require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

console.log('🔍 Test du token Discord...');
console.log('Token chargé:', process.env.DISCORD_TOKEN ? 'OUI' : 'NON');
console.log('Longueur du token:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0);

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ Le token n\'est pas défini dans le fichier .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.once('ready', () => {
  console.log(`✅ Token valide ! Connecté en tant que ${client.user.tag}`);
  client.destroy();
  process.exit(0);
});

client.on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
  process.exit(1);
});

client.login(process.env.DISCORD_TOKEN);
