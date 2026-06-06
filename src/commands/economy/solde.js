const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance }     = require('../../utils/economy');
const { getUserData }    = require('../../storage/jsonStore');
const { loadGuildConfig } = require('../../utils/leveling');
const { fetchMember }    = require('../../utils/levelHelpers');
const genCard            = require('../../carte/holographique');

const WEALTH_RANKS = [
  { min: 200000, name: '💎 MILLIARDAIRE', next: Infinity, nextName: 'MAX' },
  { min: 50000,  name: '🏆 FORTUNE',      next: 200000,   nextName: '💎 MILLIARDAIRE' },
  { min: 10000,  name: '👑 RICHE',         next: 50000,    nextName: '🏆 FORTUNE' },
  { min: 2000,   name: '💰 AISÉ',          next: 10000,    nextName: '👑 RICHE' },
  { min: 500,    name: '📈 ÉCONOME',       next: 2000,     nextName: '💰 AISÉ' },
  { min: 0,      name: '🌱 PAUVRE',        next: 500,      nextName: '📈 ÉCONOME' },
];

function getWealthRank(b) {
  return WEALTH_RANKS.find(r => b >= r.min) || WEALTH_RANKS[WEALTH_RANKS.length - 1];
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
    .setName('solde')
    .setDescription('Affiche votre solde ou celui d\'un autre membre')
    .addUserOption(option =>
      option.setName('membre').setDescription('Membre (optionnel)').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const targetUser = interaction.options.getUser('membre') || interaction.user;
      const guildId    = interaction.guildId;
      const balance    = await getBalance(guildId, targetUser.id);
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
            // Si c'est 'random', utiliser null (random parmi tous)
            if (t === 'random') {
              theme = null;
              break;
            }
            // Si c'est un tableau, choisir aléatoirement parmi les thèmes
            if (Array.isArray(t) && t.length > 0) {
              theme = t[Math.floor(Math.random() * t.length)];
              break;
            }
            // Sinon, utiliser le thème unique
            theme = t;
            break;
          }
        }
      }
      if (!theme) {
        theme = (defaultTheme && defaultTheme !== 'random' && defaultTheme !== '')
          ? defaultTheme
          : ALL_THEMES[Math.floor(Math.random() * ALL_THEMES.length)];
      }

      let ud = { karma: 0, fire: 0, messages: 0 };
      try { ud = await getUserData(guildId, targetUser.id); } catch (_) {}

      const karma = ud.karma || 0;
      const fire  = ud.fire  || 0;
      const msgs  = ud.messages || 0;

      const rank          = getWealthRank(balance);
      const nextThreshold = rank.next === Infinity ? balance : rank.next;
      const progress      = balance - rank.min;
      const rangeSize     = nextThreshold - rank.min;

      const cardData = {
        panelTitle:    'SOLDE BAG',
        displayNumStr: fmt(balance),
        level:         0,
        xp:            Math.max(0, progress),
        required:      Math.max(1, rangeSize),
        messages:      msgs,
        voiceMinutes:  0,
        streak:        fire,
        karma,
        roleName:      'SOLDE BAG',
        expBarLabel:   rank.next === Infinity
          ? `${balance.toLocaleString('fr-FR')} BAG — FORTUNE MAX`
          : `${balance.toLocaleString('fr-FR')} / ${nextThreshold.toLocaleString('fr-FR')} BAG`,
        statsItems: [
          { icon: '💰', label: 'BAG',   value: fmt(balance) },
          { icon: '⭐', label: 'KARMA', value: fmt(karma) },
          { icon: '🔥', label: 'FEU',   value: String(fire) },
        ],
        rankDisplay:     rank.name,
        nextPanelTitle:  'PROCHAINE FORTUNE',
        nextPanelBig:    rank.nextName,
        nextPanelSub:    rank.next === Infinity ? 'MAX' : `${(rank.next - balance).toLocaleString('fr-FR')} BAG`,
        nextPanelSubSub: 'RESTANTS',
      };

      const mention = targetUser.id !== interaction.user.id ? `<@${targetUser.id}>` : null;

      try {
        const card = await genCard(member, cardData, theme);
        if (card) {
          return interaction.editReply({
            content: mention,
            files: [card],
            allowedMentions: mention ? { users: [targetUser.id] } : { parse: [] }
          });
        }
      } catch (cardError) {
        console.error('Erreur génération carte solde:', cardError);
        // Continue with fallback embed
      }

      // Fallback embed
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`💰 Solde de ${targetUser.username}`)
        .addFields(
          { name: '💰 BAG',   value: `${balance.toLocaleString('fr-FR')}`, inline: true },
          { name: '🏅 Rang',  value: rank.name,                             inline: true },
        )
        .setTimestamp();
      await interaction.editReply({
        content: mention,
        embeds: [embed],
        allowedMentions: mention ? { users: [targetUser.id] } : { parse: [] }
      });
    } catch (error) {
      console.error('Erreur commande solde:', error);
      await interaction.editReply({ content: '❌ Une erreur est survenue.' }).catch(() => {});
    }
  }
};
