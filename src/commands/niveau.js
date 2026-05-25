const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateLevelUpCard } = require('../utils/cardGenerator');
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('niveau')
    .setDescription('Affiche votre niveau et XP')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Membre concerné (optionnel)')
        .setRequired(false))
    .setDMPermission(true),

  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      if (!interaction.guild) {
        await interaction.editReply({ content: '❌ Cette commande ne peut être utilisée que dans un serveur.' });
        return;
      }

      const config    = loadGuildConfig(interaction.guild.id);
      const targetUser = interaction.options.getUser('membre') || interaction.user;
      const member    = await fetchMember(interaction.guild, targetUser.id);
      const guildId   = interaction.guild.id;

      const totalXp    = await getXP(guildId, targetUser.id) || 0;
      const levelCurve = config?.levelCurve || { base: 100, factor: 1.2 };
      const { level, xpSinceLevel } = xpToLevel(totalXp, levelCurve);
      const xpRequired = xpRequiredForNext(level, levelCurve);

      // Get user stats (messages, voiceMinutes)
      let userData = { messages: 0, voiceMinutes: 0, streak: 0 };
      try {
        userData = await getUserData(guildId, targetUser.id);
      } catch (_) {}

      const lastReward = getLastRewardForLevel(config?.levels || config || {}, level);
      const roleName   = lastReward
        ? (interaction.guild.roles.cache.get(lastReward.roleId)?.name || `Rôle ${lastReward.roleId}`)
        : null;

      const name = memberDisplayName(interaction.guild, member, targetUser.id);

      let cardTheme = config?.cardTheme || null;
      if (config?.roleThemes && member) {
        for (const roleId of member.roles.cache.map(r => r.id)) {
          if (config.roleThemes[roleId]) { cardTheme = config.roleThemes[roleId]; break; }
        }
      }

      const stats = {
        messages:     userData.messages     || 0,
        voiceMinutes: userData.voiceMinutes || 0,
        streak:       userData.streak       || 0,
        roleName:     roleName || 'Membre du serveur'
      };

      const card = await generateLevelUpCard(
        { username: name, discriminator: targetUser.discriminator, displayAvatarURL: (opts) => targetUser.displayAvatarURL(opts || {}) },
        level,
        xpSinceLevel,
        xpRequired,
        interaction.guild.iconURL(),
        cardTheme,
        interaction.guild,
        stats
      );

      const embed = new EmbedBuilder()
        .setColor(0x2f6bd6)
        .setTitle(`📊 Niveau de ${name}`)
        .setTimestamp();

      if (roleName) embed.setDescription(`🎖️ Rôle actuel: ${roleName}`);

      const mention = targetUser.id !== interaction.user.id ? `<@${targetUser.id}>` : '';

      if (card) {
        embed.setImage('attachment://holographic-card.png');
        await interaction.editReply({
          content: mention || undefined,
          embeds:  [embed],
          files:   [{ attachment: card, name: 'holographic-card.png' }]
        });
      } else {
        embed.addFields(
          { name: '📈 Niveau', value: `${level}`, inline: true },
          { name: '✨ XP',     value: `${xpSinceLevel} / ${xpRequired}`, inline: true },
          { name: '💬 Messages', value: `${userData.messages || 0}`, inline: true }
        );
        await interaction.editReply({ content: mention || undefined, embeds: [embed] });
      }
    } catch (error) {
      console.error('Erreur commande niveau:', error);
      await interaction.editReply({ content: '❌ Une erreur est survenue.' }).catch(() => {});
    }
  }
};
