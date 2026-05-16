const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance } = require('../../utils/economy');
const { generateBalanceCard } = require('../../utils/cardGenerator');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('solde')
    .setDescription('Affiche votre solde ou celui d\'un autre membre')
    .addUserOption(option => option.setName('membre').setDescription('Membre (optionnel)').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const targetUser = interaction.options.getUser('membre') || interaction.user;
      const guildId = interaction.guildId;
      const userId = targetUser.id;

      const balance = getBalance(guildId, userId);
      const currencyName = 'BAG';

      // Generate balance card
      const card = await generateBalanceCard(targetUser, balance, currencyName, interaction.guild.iconURL());

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`💰 Solde de ${targetUser.username}`)
        .setImage('attachment://balance.png')
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
        files: [{ attachment: card, name: 'balance.png' }]
      });
    } catch (error) {
      console.error('Erreur commande solde:', error);
      await interaction.editReply({ content: '❌ Une erreur est survenue.' }).catch(() => {});
    }
  }
};
