const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData } = require('../storage/jsonStore');
const { loadGuildConfig } = require('../utils/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('karma')
    .setDescription('Affiche votre karma et vos stats de feu')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Membre à consulter (optionnel)')
        .setRequired(false))
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const guildId    = interaction.guild.id;
      const targetUser = interaction.options.getUser('membre') || interaction.user;
      const isSelf     = targetUser.id === interaction.user.id;

      let ud = { karma: 0, fire: 0, messages: 0, voiceMinutes: 0 };
      try { ud = await getUserData(guildId, targetUser.id); } catch (_) {}

      const karma    = ud.karma    || 0;
      const fire     = ud.fire     || 0;
      const messages = ud.messages || 0;

      // Karma rank
      let karmaRank, karmaColor;
      if      (karma >= 10000) { karmaRank = '👑 Légende';       karmaColor = 0xFFD700; }
      else if (karma >= 5000)  { karmaRank = '💎 Maître';        karmaColor = 0x00CFFF; }
      else if (karma >= 2000)  { karmaRank = '🔮 Expert';        karmaColor = 0x9B59B6; }
      else if (karma >= 1000)  { karmaRank = '⭐ Vétéran';       karmaColor = 0xF1C40F; }
      else if (karma >= 500)   { karmaRank = '🔥 Actif';         karmaColor = 0xE74C3C; }
      else if (karma >= 100)   { karmaRank = '📈 Montant';       karmaColor = 0x2ECC71; }
      else                     { karmaRank = '🌱 Débutant';      karmaColor = 0x95A5A6; }

      // Fire percent of messages
      const firePct = messages > 0 ? Math.round((fire / messages) * 100) : 0;

      // Build karma bar (10 chars)
      const karmaBarFill = Math.min(10, Math.floor((karma % 1000) / 100));
      const karmaBar = '█'.repeat(karmaBarFill) + '░'.repeat(10 - karmaBarFill);

      const embed = new EmbedBuilder()
        .setColor(karmaColor)
        .setTitle(`${isSelf ? '⭐ Ton Karma' : `⭐ Karma de ${targetUser.displayName}`}`)
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setDescription(`**Rang :** ${karmaRank}`)
        .addFields(
          {
            name: '⭐ Karma total',
            value: `\`\`\`\n${karmaBar} ${karma.toLocaleString('fr-FR')} pts\n\`\`\``,
            inline: false
          },
          {
            name: '🔥 Messages dans les salons réservés',
            value: `**${fire.toLocaleString('fr-FR')}** messages (${firePct}% du total)`,
            inline: true
          },
          {
            name: '💬 Messages totaux',
            value: `**${messages.toLocaleString('fr-FR')}**`,
            inline: true
          }
        )
        .setFooter({ text: '+1 karma par message • +1 feu par message dans un salon soumis à l\'âge' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Erreur /karma:', err);
      await interaction.editReply({ content: '❌ Une erreur est survenue.' }).catch(() => {});
    }
  }
};
