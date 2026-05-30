const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');
const { loadGuildConfig } = require('../utils/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('confess')
    .setDescription('Envoyer une confession anonyme dans le salon dédié'),

  async execute(interaction) {
    const config = loadGuildConfig(interaction.guild.id);

    if (!config?.confession?.enabled) {
      return interaction.reply({
        content: '❌ Le système de confessions n\'est pas activé sur ce serveur.',
        ephemeral: true
      });
    }

    const allowedChannels = config.confession.channels || [];
    if (allowedChannels.length > 0 && !allowedChannels.includes(interaction.channelId)) {
      const refs = allowedChannels.map(id => `<#${id}>`).join(', ');
      return interaction.reply({
        content: `❌ Cette commande ne peut être utilisée que dans : ${refs}`,
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('confessModal')
      .setTitle('🙊 Confession Anonyme');

    const textInput = new TextInputBuilder()
      .setCustomId('confessText')
      .setLabel('Votre confession (texte)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Écrivez votre confession ici… Elle sera publiée anonymement.')
      .setMinLength(1)
      .setMaxLength(1800)
      .setRequired(true);

    const imageInput = new TextInputBuilder()
      .setCustomId('confessImage')
      .setLabel('Image (URL — optionnel)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://… (lien direct vers une image)')
      .setRequired(false)
      .setMaxLength(500);

    modal.addComponents(
      new ActionRowBuilder().addComponents(textInput),
      new ActionRowBuilder().addComponents(imageInput)
    );

    await interaction.showModal(modal);
  }
};
