const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateLevelUpCard } = require('../utils/cardGenerator');
const { loadGuildConfig } = require('../utils/leveling');
const { getXP } = require('../utils/economy');
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
      const config = loadGuildConfig(interaction.guild.id);
      const targetUser = interaction.options.getUser('membre') || interaction.user;
      const member = await fetchMember(interaction.guild, targetUser.id);
      const guildId = interaction.guild.id;

      // Récupérer l'XP total depuis economy.json
      const totalXp = getXP(guildId, targetUser.id) || 0;

      // Calculer le niveau et XP depuis le niveau actuel avec la courbe
      const levelCurve = config.levelCurve || { base: 100, factor: 1.2 };
      const { level, xpSinceLevel } = xpToLevel(totalXp, levelCurve);
      const xpRequired = xpRequiredForNext(level, levelCurve);

      // Récupérer la dernière récompense de rôle
      const lastReward = getLastRewardForLevel(config, level);
      const roleName = lastReward ? (interaction.guild.roles.cache.get(lastReward.roleId)?.name || `Rôle ${lastReward.roleId}`) : null;

      // Nom d'affichage
      const name = memberDisplayName(interaction.guild, member, targetUser.id);

      // Générer la carte
      const card = await generateLevelUpCard(
        { username: name, displayAvatarURL: (ext, size) => targetUser.displayAvatarURL({ extension: ext, size }) },
        level,
        xpSinceLevel,
        xpRequired,
        interaction.guild.iconURL(),
        config.cardTheme || null
      );

      const embed = new EmbedBuilder()
        .setColor(0x2f6bd6)
        .setTitle(`📊 Niveau de ${name}`)
        .setDescription(roleName ? `🎖️ Rôle actuel: ${roleName}` : '')
        .setImage('attachment://level.png')
        .setTimestamp();

      const mention = targetUser.id !== interaction.user.id ? `<@${targetUser.id}>` : '';
      await interaction.editReply({
        content: mention || undefined,
        embeds: [embed],
        files: [{ attachment: card, name: 'level.png' }]
      });
    } catch (error) {
      console.error('Erreur commande niveau:', error);
      await interaction.editReply({ content: '❌ Une erreur est survenue.' }).catch(() => {});
    }
  }
};
