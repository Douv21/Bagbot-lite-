const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateLevelUpCard } = require('../utils/cardGenerator');
const { loadGuildConfig } = require('../utils/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('niveau')
    .setDescription('Affiche votre niveau et XP'),

  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const config = loadGuildConfig(interaction.guild.id);
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      // Récupérer le niveau et XP depuis la config
      const userLevel = config?.leveling?.users?.[userId]?.level || 1;
      const userXp = config?.leveling?.users?.[userId]?.xp || 0;
      const xpToNextLevel = userLevel * 100;

      // Générer la carte
      const card = await generateLevelUpCard(
        interaction.user,
        userLevel,
        userXp,
        xpToNextLevel,
        interaction.guild.iconURL()
      );

      const embed = new EmbedBuilder()
        .setColor(0xC41E3A)
        .setTitle(`📊 Niveau de ${interaction.user.username}`)
        .setDescription(`Niveau: ${userLevel}\nXP: ${userXp}/${xpToNextLevel}`)
        .setImage('attachment://level.png')
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
        files: [{ attachment: card, name: 'level.png' }]
      });
    } catch (error) {
      console.error('Erreur commande niveau:', error);
      await interaction.editReply({ content: '❌ Une erreur est survenue.' }).catch(() => {});
    }
  }
};
