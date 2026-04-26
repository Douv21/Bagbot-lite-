require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'ping',
    description: 'Répond Pong!'
  },
  {
    name: 'bonjour',
    description: 'Dit bonjour'
  }
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Déploiement des commandes...');

    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log(`✅ ${data.length} commandes déployées avec succès!`);
  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error);
  }
})();
