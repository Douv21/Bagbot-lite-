const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance, addBalance, updateUserData } = require('../../storage/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('don')
    .setDescription('Transférez des BAG à un autre membre')
    .setDMPermission(true)
    .addUserOption(o =>
      o.setName('membre')
        .setDescription('Membre qui reçoit les BAG')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('montant')
        .setDescription('Nombre de BAG à transférer')
        .setMinValue(1)
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const guildId = interaction.guildId || process.env.GUILD_ID;
      const sender  = interaction.user;
      const target  = interaction.options.getUser('membre');
      const amount  = interaction.options.getInteger('montant');

      if (target.id === sender.id) {
        return interaction.editReply({ content: '❌ Tu ne peux pas te faire un don à toi-même.' });
      }
      if (target.bot) {
        return interaction.editReply({ content: '❌ Tu ne peux pas envoyer des BAG à un bot.' });
      }

      const senderBalance = await getBalance(guildId, sender.id);
      if (senderBalance < amount) {
        return interaction.editReply({
          content: `❌ Solde insuffisant. Tu as **${senderBalance.toLocaleString('fr-FR')} BAG** mais tu essaies d'envoyer **${amount.toLocaleString('fr-FR')} BAG**.`
        });
      }

      await addBalance(guildId, sender.id, -amount);
      await addBalance(guildId, target.id,  amount);

      const newSenderBalance = await getBalance(guildId, sender.id);
      const newTargetBalance = await getBalance(guildId, target.id);

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('💸 Don effectué !')
        .setDescription(
          `**${sender.displayName || sender.username}** a envoyé **${amount.toLocaleString('fr-FR')} BAG** à **${target.displayName || target.username}** !`
        )
        .addFields(
          { name: `💼 ${sender.username}`, value: `${newSenderBalance.toLocaleString('fr-FR')} BAG`, inline: true },
          { name: `💼 ${target.username}`, value: `${newTargetBalance.toLocaleString('fr-FR')} BAG`, inline: true }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Erreur /don:', err);
      return interaction.editReply({ content: '❌ Une erreur est survenue.' });
    }
  }
};
