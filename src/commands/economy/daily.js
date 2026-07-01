const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData, addBalance } = require('../../storage/jsonStore');

const DAILY_AMOUNT = 200;
const COOLDOWN_MS  = 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Réclamez votre récompense journalière de BAG')
    .setDMPermission(true),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const guildId = interaction.guildId || process.env.GUILD_ID;
      const userId  = interaction.user.id;

      const ud   = await getUserData(guildId, userId);
      const now  = Date.now();
      const last = ud.dailyLastClaim || 0;
      const diff = now - last;

      if (diff < COOLDOWN_MS) {
        const reste = COOLDOWN_MS - diff;
        const h = Math.floor(reste / 3_600_000);
        const m = Math.floor((reste % 3_600_000) / 60_000);
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('⏳ Déjà réclamé !')
          .setDescription(`Tu as déjà réclamé ta récompense aujourd'hui.\nReviens dans **${h}h ${m}min**.`)
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      }

      const streak   = (diff < COOLDOWN_MS * 2 && last > 0) ? (ud.dailyStreak || 0) + 1 : 1;
      const bonus    = Math.min(streak - 1, 6) * 20;
      const total    = DAILY_AMOUNT + bonus;

      await updateUserData(guildId, userId, { dailyLastClaim: now, dailyStreak: streak });
      const newBalance = await addBalance(guildId, userId, total);

      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle('💰 Récompense journalière !')
        .setDescription(
          `Tu reçois **${total} BAG** ${bonus > 0 ? `(+${bonus} bonus streak)` : ''} !\n` +
          `🔥 Série : **${streak} jour${streak > 1 ? 's' : ''}**\n` +
          `💼 Nouveau solde : **${newBalance.toLocaleString('fr-FR')} BAG**`
        )
        .setFooter({ text: 'Reviens demain pour continuer ta série !' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Erreur /daily:', err);
      return interaction.editReply({ content: '❌ Une erreur est survenue.' });
    }
  }
};
