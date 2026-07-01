const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData, addBalance } = require('../../storage/jsonStore');

const COOLDOWN_MS = 60 * 60 * 1000;

const JOBS = [
  { emoji: '👨‍💻', label: 'Développeur',       min: 80,  max: 320 },
  { emoji: '🍕', label: 'Livreur',             min: 40,  max: 180 },
  { emoji: '🔧', label: 'Mécanicien',          min: 60,  max: 260 },
  { emoji: '🎨', label: 'Graphiste',           min: 70,  max: 300 },
  { emoji: '🚕', label: 'Chauffeur',           min: 50,  max: 200 },
  { emoji: '🧑‍🍳', label: 'Chef cuisinier',    min: 90,  max: 340 },
  { emoji: '🏗️', label: 'Ouvrier BTP',        min: 55,  max: 240 },
  { emoji: '🧑‍🏫', label: 'Professeur',        min: 65,  max: 280 },
  { emoji: '🎤', label: 'Streamer',            min: 30,  max: 500 },
  { emoji: '🧑‍⚕️', label: 'Médecin',          min: 100, max: 400 },
  { emoji: '🕵️', label: 'Détective privé',    min: 75,  max: 350 },
  { emoji: '🌿', label: 'Jardinier',           min: 45,  max: 190 },
  { emoji: '📦', label: 'Magasinier',          min: 40,  max: 160 },
  { emoji: '🧹', label: 'Agent d\'entretien',  min: 35,  max: 150 },
  { emoji: '📸', label: 'Photographe',         min: 60,  max: 300 },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('travailler')
    .setDescription('Travaillez pour gagner des BAG (cooldown 1h)')
    .setDMPermission(true),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const guildId = interaction.guildId || process.env.GUILD_ID;
      const userId  = interaction.user.id;

      const ud   = await getUserData(guildId, userId);
      const now  = Date.now();
      const last = ud.workLastClaim || 0;
      const diff = now - last;

      if (diff < COOLDOWN_MS) {
        const reste = COOLDOWN_MS - diff;
        const m = Math.floor(reste / 60_000);
        const s = Math.floor((reste % 60_000) / 1000);
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('😓 Tu es épuisé !')
          .setDescription(`Tu as besoin de te reposer.\nTu peux retravailler dans **${m}min ${s}s**.`)
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      }

      const job    = JOBS[Math.floor(Math.random() * JOBS.length)];
      const gain   = randInt(job.min, job.max);

      await updateUserData(guildId, userId, { workLastClaim: now });
      const newBalance = await addBalance(guildId, userId, gain);

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle(`${job.emoji} Tu as travaillé comme ${job.label} !`)
        .setDescription(
          `Tu as gagné **${gain} BAG** pour ton travail !\n` +
          `💼 Nouveau solde : **${newBalance.toLocaleString('fr-FR')} BAG**`
        )
        .setFooter({ text: 'Tu pourras retravailler dans 1 heure.' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Erreur /travailler:', err);
      return interaction.editReply({ content: '❌ Une erreur est survenue.' });
    }
  }
};
