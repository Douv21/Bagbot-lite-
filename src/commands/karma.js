const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData }    = require('../storage/jsonStore');
const { loadGuildConfig } = require('../utils/leveling');
const { fetchMember }    = require('../utils/levelHelpers');
const genCard            = require('../carte/holographique');

const KARMA_RANKS = [
  { min: 10000, name: '👑 LÉGENDE',  next: Infinity, nextName: 'MAX' },
  { min: 5000,  name: '💎 MAÎTRE',   next: 10000,    nextName: '👑 LÉGENDE' },
  { min: 2000,  name: '🔮 EXPERT',   next: 5000,     nextName: '💎 MAÎTRE' },
  { min: 1000,  name: '⭐ VÉTÉRAN',  next: 2000,     nextName: '🔮 EXPERT' },
  { min: 500,   name: '🔥 ACTIF',    next: 1000,     nextName: '⭐ VÉTÉRAN' },
  { min: 100,   name: '📈 MONTANT',  next: 500,      nextName: '🔥 ACTIF' },
  { min: 0,     name: '🌱 DÉBUTANT', next: 100,      nextName: '📈 MONTANT' },
];

function getKarmaRank(k) {
  return KARMA_RANKS.find(r => k >= r.min) || KARMA_RANKS[KARMA_RANKS.length - 1];
}

function fmt(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 10000)   return `${Math.floor(n / 1000)}K`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

const ALL_THEMES = ['holographique','gaming','love','sensuel','cosmos','nature','dark','gold','argent','bleu','rose'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('karma')
    .setDescription('Affiche votre karma et vos stats')
    .addUserOption(opt =>
      opt.setName('membre').setDescription('Membre à consulter (optionnel)').setRequired(false))
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const guildId    = interaction.guild.id;
      const targetUser = interaction.options.getUser('membre') || interaction.user;
      const member     = await fetchMember(interaction.guild, targetUser.id);
      const config     = loadGuildConfig(guildId);

      // Theme selection: roleThemes > defaultTheme > random
      let theme = null;
      const roleThemes   = config?.roleThemes  || {};
      const defaultTheme = config?.defaultTheme || '';
      if (member && Object.keys(roleThemes).length > 0) {
        const sorted = [...member.roles.cache.values()]
          .filter(r => r.id !== interaction.guild.id)
          .sort((a, b) => b.position - a.position);
        for (const role of sorted) {
          if (roleThemes[role.id]) {
            const t = roleThemes[role.id];
            theme = t === 'random' ? null : t;
            break;
          }
        }
      }
      if (!theme) {
        theme = (defaultTheme && defaultTheme !== 'random' && defaultTheme !== '')
          ? defaultTheme
          : ALL_THEMES[Math.floor(Math.random() * ALL_THEMES.length)];
      }

      let ud = { karma: 0, fire: 0, messages: 0, voiceMinutes: 0 };
      try { ud = await getUserData(guildId, targetUser.id); } catch (_) {}

      const karma    = ud.karma        || 0;
      const fire     = ud.fire         || 0;
      const messages = ud.messages     || 0;
      const voiceMin = ud.voiceMinutes || 0;

      const rank          = getKarmaRank(karma);
      const nextThreshold = rank.next === Infinity ? karma : rank.next;
      const progress      = karma - rank.min;
      const rangeSize     = nextThreshold - rank.min;
      const voiceStr      = voiceMin >= 60 ? `${Math.floor(voiceMin / 60)}h ${voiceMin % 60}m` : `${voiceMin}m`;

      const cardData = {
        panelTitle:      'KARMA',
        displayNumStr:   fmt(karma),
        level:           0,
        xp:              Math.max(0, progress),
        required:        Math.max(1, rangeSize),
        messages,
        voiceMinutes:    voiceMin,
        streak:          fire,
        karma,
        roleName:        'KARMA CARD',
        expBarLabel:     rank.next === Infinity
          ? `${karma.toLocaleString('fr-FR')} KARMA — LÉGENDE MAX`
          : `${karma.toLocaleString('fr-FR')} / ${nextThreshold.toLocaleString('fr-FR')} KARMA`,
        statsItems: [
          { icon: '⭐',  label: 'KARMA',    value: fmt(karma) },
          { icon: '🔥',  label: 'FEU',      value: fmt(fire) },
          { icon: 'MSG', label: 'MESSAGES', value: fmt(messages) },
        ],
        rankDisplay:     rank.name,
        nextPanelTitle:  'PROCHAIN RANG',
        nextPanelBig:    rank.nextName,
        nextPanelSub:    rank.next === Infinity ? 'MAX' : `${(rank.next - karma).toLocaleString('fr-FR')} pts`,
        nextPanelSubSub: 'RESTANTS',
      };

      const mention = targetUser.id !== interaction.user.id ? `<@${targetUser.id}>` : null;

      if (member) {
        const card = await genCard(member, cardData, theme);
        if (card) {
          return interaction.editReply({
            content: mention,
            files: [card],
            allowedMentions: mention ? { users: [targetUser.id] } : { parse: [] }
          });
        }
      }

      // Fallback embed
      const karmaColor = karma >= 10000 ? 0xFFD700 : karma >= 5000 ? 0x00CFFF
        : karma >= 2000 ? 0x9B59B6 : karma >= 1000 ? 0xF1C40F
        : karma >= 500  ? 0xE74C3C : karma >= 100  ? 0x2ECC71 : 0x95A5A6;
      const embed = new EmbedBuilder()
        .setColor(karmaColor)
        .setTitle(`⭐ Karma de ${targetUser.displayName || targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setDescription(`**Rang :** ${rank.name}`)
        .addFields(
          { name: '⭐ Karma',    value: `${karma.toLocaleString('fr-FR')} pts`, inline: true },
          { name: '🔥 Feu',      value: `${fire.toLocaleString('fr-FR')}`,      inline: true },
          { name: '💬 Messages', value: `${messages.toLocaleString('fr-FR')}`,  inline: true },
        )
        .setTimestamp();
      await interaction.editReply({
        content: mention,
        embeds: [embed],
        allowedMentions: mention ? { users: [targetUser.id] } : { parse: [] }
      });
    } catch (err) {
      console.error('Erreur /karma:', err);
      await interaction.editReply({ content: '❌ Une erreur est survenue.' }).catch(() => {});
    }
  }
};
