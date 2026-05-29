const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { getGuildData } = require('../storage/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('confess')
    .setDescription('Envoyer une confession anonyme')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Votre confession (texte)')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option
        .setName('image')
        .setDescription('Ajouter une image à votre confession')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // Récupérer la configuration du serveur
      const guildData = await getGuildData(interaction.guildId);
      
      // Vérifier si les confessions sont activées
      if (!guildData.confessions || !guildData.confessions.enabled) {
        return await interaction.editReply({
          content: '❌ Le système de confession n\'est pas activé sur ce serveur.',
          ephemeral: true
        });
      }

      // Vérifier si au moins un salon de confession est configuré
      if (!guildData.confessions.channels || guildData.confessions.channels.length === 0) {
        return await interaction.editReply({
          content: '❌ Aucun salon de confession n\'a été configuré.',
          ephemeral: true
        });
      }

      // Vérifier que le canal courant est un salon de confession configuré
      const isAllowedChannel = guildData.confessions.channels.includes(interaction.channelId);
      if (!isAllowedChannel) {
        return await interaction.editReply({
          content: '❌ Vous ne pouvez utiliser la commande `/confess` que dans les salons configurés pour les confessions.',
          ephemeral: true
        });
      }

      // Récupérer le texte et l'image
      const confessText = interaction.options.getString('message');
      const image = interaction.options.getAttachment('image');

      // Au moins un des deux est requis
      if (!confessText && !image) {
        return await interaction.editReply({
          content: '❌ Vous devez fournir un message texte ou une image pour votre confession.',
          ephemeral: true
        });
      }

      // Limiter la longueur du texte
      if (confessText && confessText.length > 2000) {
        return await interaction.editReply({
          content: '❌ Votre confession est trop longue (maximum 2000 caractères).',
          ephemeral: true
        });
      }

      // Créer l'embed de la confession
      const confessionEmbed = new EmbedBuilder()
        .setTitle('🤫 Confession Anonyme')
        .setColor(0x9b59b6)
        .setTimestamp()
        .setFooter({ text: 'Confession anonyme' });

      if (confessText) {
        confessionEmbed.setDescription(confessText);
      } else {
        confessionEmbed.setDescription('*Confession avec image*');
      }

      if (image && image.contentType && image.contentType.startsWith('image/')) {
        confessionEmbed.setImage(image.url);
      } else if (image) {
        return await interaction.editReply({
          content: '❌ Le fichier attaché doit être une image.',
          ephemeral: true
        });
      }

      // Envoyer la confession SEULEMENT au salon courant
      try {
        const channel = await interaction.guild.channels.fetch(interaction.channelId);
        if (channel && channel.isTextBased()) {
          await channel.send({ embeds: [confessionEmbed] });
          await interaction.editReply({
            content: '✅ Votre confession a été envoyée de manière anonyme.',
            ephemeral: true
          });
        } else {
          await interaction.editReply({
            content: '❌ Erreur : impossible d\'envoyer la confession.',
            ephemeral: true
          });
        }
      } catch (error) {
        console.error(`Erreur envoi confession:`, error);
        await interaction.editReply({
          content: '❌ Une erreur est survenue lors de l\'envoi de la confession.',
          ephemeral: true
        });
      }

    } catch (error) {
      console.error('Erreur commande confess:', error);
      await interaction.editReply({
        content: '❌ Une erreur est survenue.',
        ephemeral: true
      }).catch(() => {});
    }
  }
};
