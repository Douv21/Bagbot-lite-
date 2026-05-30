const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance } = require('../../utils/economy');
const generateHolographicCard = require('../../carte/holographique');

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
      const balance    = getBalance(guildId, targetUser.id);

      const mockMember = {
        user: {
          username:         targetUser.username,
          discriminator:    targetUser.discriminator,
          displayAvatarURL: (opts) => targetUser.displayAvatarURL(opts || {})
        },
        guild: { iconURL: () => interaction.guild?.iconURL() || null }
      };

      const data = {
        level:        0,
        xp:           balance,
        required:     balance || 1,
        rank:         1,
        messages:     0,
        voiceMinutes: 0,
        streak:       0,
        roleName:     'Solde BAG'
      };

      const card = await generateHolographicCard(mockMember, data);

      if (card) {
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`💰 Solde de ${targetUser.username}`)
          .setImage('attachment://holographic-card.png')
          .setTimestamp();

        await interaction.editReply({
          embeds: [embed],
          files:  [{ attachment: card, name: 'holographic-card.png' }]
        });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`💰 Solde de ${targetUser.username}`)
          .addFields({ name: 'BAG', value: `${balance}`, inline: true })
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Erreur commande solde:', error);
      await interaction.editReply({ content: '❌ Une erreur est survenue.' }).catch(() => {});
    }
  }
};
