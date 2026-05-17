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
      // Check if in DM
      if (!interaction.guild) {
        await interaction.editReply({ content: '❌ Cette commande ne peut être utilisée que dans un serveur.' });
        return;
      }

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

      // Déterminer le thème en fonction des rôles
      let cardTheme = config.cardTheme || null;
      if (config.roleThemes && member) {
        const memberRoleIds = member.roles.cache.map(r => r.id);
        for (const roleId of memberRoleIds) {
          if (config.roleThemes[roleId]) {
            cardTheme = config.roleThemes[roleId];
            break;
          }
        }
      }

      // Générer la carte
      const card = await generateLevelUpCard(
        { username: name, displayAvatarURL: (ext, size) => targetUser.displayAvatarURL({ extension: ext, size }) },
        level,
        xpSinceLevel,
        xpRequired,
        interaction.guild.iconURL(),
        cardTheme
      );

      const embed = new EmbedBuilder()
        .setColor(0x2f6bd6)
        .setTitle(`📊 Niveau de ${name}`)
        .setImage('attachment://level.png')
        .setTimestamp();

      if (roleName) {
        embed.setDescription(`🎖️ Rôle actuel: ${roleName}`);
      }

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
