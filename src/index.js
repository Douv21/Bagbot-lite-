require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Vérifier que le token est présent
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ ERREUR: DISCORD_TOKEN n\'est pas défini dans le fichier .env');
  console.error('Veuillez créer un fichier .env avec DISCORD_TOKEN=votre_token_ici');
  process.exit(1);
}

console.log('🔑 Token Discord chargé (longueur:', process.env.DISCORD_TOKEN.length, 'caractères)');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  } else if (commandName === 'bonjour') {
    await interaction.reply(`Bonjour ${interaction.user} !`);
  }
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Erreur de connexion:');
  console.error(error.message);
  if (error.message.includes('Invalid Token')) {
    console.error('❌ Le token Discord est invalide ou a expiré.');
    console.error('❌ Veuillez vérifier votre token sur https://discord.com/developers/applications');
  }
  process.exit(1);
});
