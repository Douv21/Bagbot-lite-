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

    const inputChannel = config.confession.inputChannel;
    if (inputChannel && interaction.channelId !== inputChannel) {
      const ch = interaction.guild.channels.cache.get(inputChannel);
      const ref = ch ? `<#${ch.id}>` : 'le salon configuré';
      return interaction.reply({
        content: `❌ Cette commande doit être utilisée dans ${ref}.`,
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('confessModal')
      .setTitle('🙊 Confession Anonyme');

    const textInput = new TextInputBuilder()
      .setCustomId('confessText')
      .setLabel('Votre confession')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Écrivez votre confession ici… Elle sera publiée anonymement.')
      .setMinLength(5)
      .setMaxLength(1800)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(textInput));
    await interaction.showModal(modal);
  }
};
