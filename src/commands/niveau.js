const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadGuildConfig } = require('../utils/leveling');
const { getXP } = require('../utils/economy');
const { getUserData } = require('../storage/jsonStore');
const {
  getLastRewardForLevel,
  memberDisplayName,
  fetchMember,
  xpRequiredForNext,
  xpToLevel
} = require('../utils/levelHelpers');
const genCard = require('../carte/holographique');

const THEMES = [
  'holographique','gaming','love','sensuel','cosmos',
  'nature','dark','gold','argent','bleu','rose'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('niveau')
    .setDescription('Affiche votre niveau et XP')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Membre concerné (optionnel)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('theme')
        .setDescription('Thème visuel de la carte')
        .setRequired(false)
        .addChoices(
          { name: 'Holographique (defaut)', value: 'holographique' },
          { name: 'Gaming',                value: 'gaming' },
          { name: 'Love',                  value: 'love' },
          { name: 'Sensuel',               value: 'sensuel' },
          { name: 'Cosmos',                value: 'cosmos' },
          { name: 'Nature',                value: 'nature' },
          { name: 'Dark',                  value: 'dark' },
          { name: 'Gold',                  value: 'gold' },
          { name: 'Argent',                value: 'argent' },
          { name: 'Bleu',                  value: 'bleu' },
          { name: 'Rose',                  value: 'rose' }
        ))
    .setDMPermission(true),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      if (!interaction.guild) {
        await interaction.editReply({ content: '❌ Cette commande ne peut être utilisée que dans un serveur.' });
        return;
      }

      const config     = loadGuildConfig(interaction.guild.id);
      const targetUser = interaction.options.getUser('membre') || interaction.user;
      const member     = await fetchMember(interaction.guild, targetUser.id);

      // Determine theme: explicit option > roleThemes config > defaultTheme > fallback
      let theme = interaction.options.getString('theme');
      if (!theme) {
        const roleThemes  = config?.roleThemes  || {};
        const defaultTheme = config?.defaultTheme || '';
        // Check member roles from highest to lowest position
        if (member && Object.keys(roleThemes).length > 0) {
          const sorted = [...member.roles.cache.values()]
            .filter(r => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position);
          for (const role of sorted) {
            if (roleThemes[role.id]) {
              const t = roleThemes[role.id];
              theme = (t === 'random') ? null : t;
              break;
            }
          }
        }
        if (!theme) {
          if (defaultTheme && defaultTheme !== 'random' && defaultTheme !== '') {
            theme = defaultTheme;
          } else {
            const ALL_THEMES = ['holographique','gaming','love','sensuel','cosmos','nature','dark','gold','argent','bleu','rose'];
            theme = ALL_THEMES[Math.floor(Math.random() * ALL_THEMES.length)];
          }
        }
      }
      const guildId    = interaction.guild.id;

      const totalXp    = await getXP(guildId, targetUser.id) || 0;
      const levelCurve = config?.levelCurve || { base: 100, factor: 1.2 };
      const { level, xpSinceLevel } = xpToLevel(totalXp, levelCurve);
      const xpRequired = xpRequiredForNext(level, levelCurve);

      let userData = { messages: 0, voiceMinutes: 0, streak: 0, karma: 0, fire: 0 };
      try { userData = await getUserData(guildId, targetUser.id); } catch (_) {}

      const lastReward = getLastRewardForLevel(config?.levels || config || {}, level);
      const roleName   = lastReward
        ? (interaction.guild.roles.cache.get(lastReward.roleId)?.name || `Role ${lastReward.roleId}`)
        : null;

      const name    = memberDisplayName(interaction.guild, member, targetUser.id);
      const mention = targetUser.id !== interaction.user.id ? `<@${targetUser.id}>` : undefined;

      const xpLeft = Math.max(0, xpRequired - xpSinceLevel);
      const pct    = Math.min(100, Math.round((xpSinceLevel / Math.max(1, xpRequired)) * 100));

      const voiceStr = userData.voiceMinutes >= 60
        ? `${Math.floor(userData.voiceMinutes / 60)}h ${userData.voiceMinutes % 60}m`
        : `${userData.voiceMinutes || 0}m`;

      const cardData = {
        level,
        xp:           xpSinceLevel,
        required:     xpRequired,
        messages:     userData.messages     || 0,
        voiceMinutes: userData.voiceMinutes || 0,
        streak:       userData.fire         || 0,
        karma:        userData.karma        || 0,
        roleName:     roleName              || ''
      };

      try {
        const cardAttachment = await genCard(member, cardData, theme);
        if (cardAttachment) {
          await interaction.editReply({
            content: mention || null,
            files: [cardAttachment],
            allowedMentions: mention ? { users: [targetUser.id] } : { parse: [] }
          });
          return;
        }
      } catch (cardError) {
        console.error('Erreur génération carte niveau:', cardError);
        // Continue with fallback embed
      }

      // Fallback embed si la carte échoue
      const embed = new EmbedBuilder()
        .setColor(0x2f6bd6)
        .setTitle(`✨ Niveau de ${name}`)
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .addFields(
          { name: '📈 Niveau',        value: `**${level}**`,                                                                              inline: true },
          { name: '✨ XP',             value: `${xpSinceLevel.toLocaleString('fr-FR')} / ${xpRequired.toLocaleString('fr-FR')} (${pct}%)`, inline: true },
          { name: '⬆️ Prochain niv.', value: `${xpLeft.toLocaleString('fr-FR')} XP restantes`,                                           inline: true },
          { name: '💬 Messages',      value: `${(userData.messages || 0).toLocaleString('fr-FR')}`,                                       inline: true },
          { name: '🎤 Vocal',         value: voiceStr,                                                                                    inline: true },
          { name: '🔥 Feu',           value: `${(userData.fire    || 0).toLocaleString('fr-FR')}`,                                        inline: true },
          { name: '⭐ Karma',         value: `${(userData.karma   || 0).toLocaleString('fr-FR')}`,                                        inline: true }
        )
        .setTimestamp();

      if (roleName) embed.setDescription(`🎖️ Role actuel : **${roleName}**`);

      await interaction.editReply({
        content: mention || null,
        embeds: [embed],
        allowedMentions: mention ? { users: [targetUser.id] } : { parse: [] }
      });
    } catch (error) {
      console.error('Erreur commande niveau:', error);
      await interaction.editReply({ content: '❌ Une erreur est survenue.' }).catch(() => {});
    }
  }
};
