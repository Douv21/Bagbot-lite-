const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');
const { loadGuildConfig } = require('../utils/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('confess')
    .setDescription('Envoyer une confession anonyme dans le salon dédié')
    .addStringOption(opt =>
      opt.setName('texte')
        .setDescription('Votre confession (texte)')
        .setRequired(false)
        .setMaxLength(1800))
    .addAttachmentOption(opt =>
      opt.setName('image')
        .setDescription('Image depuis votre galerie (optionnel)')
        .setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    try {
      const config = loadGuildConfig(interaction.guild.id);

      if (config?.confession?.enabled === false) {
        return interaction.editReply({ content: '❌ Le système de confessions n\'est pas activé sur ce serveur.' });
      }

      const allowedChannels = config?.confession?.channels || [];
      if (allowedChannels.length > 0 && !allowedChannels.includes(interaction.channelId)) {
        const refs = allowedChannels.map(id => `<#${id}>`).join(', ');
        return interaction.editReply({ content: `❌ Cette commande ne peut être utilisée que dans : ${refs}` });
      }

      const texte      = interaction.options.getString('texte')?.trim() || '';
      const attachment = interaction.options.getAttachment('image');

      if (!texte && !attachment) {
        return interaction.editReply({ content: '❌ Vous devez fournir un texte ou une image (ou les deux).' });
      }

      // Determine output channel
      let outputChannel = interaction.channel;
      if (allowedChannels.length > 0) {
        outputChannel = await interaction.guild.channels.fetch(allowedChannels[0]).catch(() => interaction.channel);
      }
      if (!outputChannel?.isTextBased()) {
        return interaction.editReply({ content: '❌ Impossible d\'accéder au salon de confessions.' });
      }

      const count = incrementConfessCount(interaction.guild.id);
      const color = parseInt((config?.confession?.color || '#5865f2').replace('#', ''), 16) || 0x5865f2;

      const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({ name: `🙊 Confession anonyme #${count}` })
        .setFooter({ text: `${interaction.guild.name} • Confession anonyme` })
        .setTimestamp();

      if (texte) embed.setDescription(texte);

      // Use the attachment URL if provided (Discord CDN URL stays valid)
      const hasImage = attachment && attachment.url;
      if (hasImage) embed.setImage(attachment.url);

      await outputChannel.send({ embeds: [embed] });

      // Log to mod channel with author identity
      if (config?.confession?.modChannel) {
        const modCh = await interaction.guild.channels.fetch(config.confession.modChannel).catch(() => null);
        if (modCh?.isTextBased()) {
          const modEmbed = new EmbedBuilder()
            .setColor(0xff4444)
            .setTitle(`🔍 Log confession #${count}`)
            .setDescription(texte || '*(pas de texte)*')
            .addFields({ name: 'Auteur', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true })
            .setTimestamp();
          if (hasImage) modEmbed.setImage(attachment.url);
          await modCh.send({ embeds: [modEmbed] });
        }
      }

      await interaction.editReply({ content: `✅ Votre confession **#${count}** a été envoyée anonymement !` });
    } catch (error) {
      console.error('Erreur commande confess:', error);
      await interaction.editReply({ content: '❌ Une erreur est survenue.' }).catch(() => {});
    }
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const COUNTERS_FILE = path.join(process.cwd(), 'data', 'confession_counters.json');

function loadCounters() {
  try {
    if (!fs.existsSync(COUNTERS_FILE)) return {};
    return JSON.parse(fs.readFileSync(COUNTERS_FILE, 'utf8'));
  } catch { return {}; }
}
function saveCounters(c) {
  try {
    fs.mkdirSync(path.dirname(COUNTERS_FILE), { recursive: true });
    fs.writeFileSync(COUNTERS_FILE, JSON.stringify(c, null, 2));
  } catch {}
}
function incrementConfessCount(guildId) {
  const c = loadCounters();
  c[guildId] = (c[guildId] || 0) + 1;
  saveCounters(c);
  return c[guildId];
}
