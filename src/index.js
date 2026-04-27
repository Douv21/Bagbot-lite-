require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Debug: Vérifier si le fichier .env existe
const envPath = path.resolve(__dirname, '../.env');
console.log('🔍 Debug - Chemin .env:', envPath);
console.log('🔍 Debug - Fichier .env existe:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('🔍 Debug - Contenu .env (premières lignes):');
  console.log(envContent.split('\n').slice(0, 5).join('\n'));
}

// Debug: Afficher toutes les variables d'environnement
console.log('🔍 Debug variables d\'environnement:');
console.log('DISCORD_TOKEN présent:', !!process.env.DISCORD_TOKEN);
console.log('DISCORD_TOKEN longueur:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0);
if (process.env.DISCORD_TOKEN) {
  const token = process.env.DISCORD_TOKEN;
  console.log('DISCORD_TOKEN brut (repr):', JSON.stringify(token));
  console.log('DISCORD_TOKEN début:', token.substring(0, 10) + '...');
  console.log('DISCORD_TOKEN fin:', '...' + token.substring(token.length - 10));
  console.log('DISCORD_TOKEN a des espaces:', token !== token.trim());
  console.log('DISCORD_TOKEN après trim:', token.trim().length, 'caractères');
}

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
