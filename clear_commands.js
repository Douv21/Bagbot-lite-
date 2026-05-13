const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🗑️ Suppression de toutes les commandes globales...');
    
    // Supprimer toutes les commandes globales
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: [] }
    );
    
    console.log('✅ Toutes les commandes globales supprimées');
    
    // Si GUILD_ID est défini, supprimer aussi les commandes du serveur
    if (process.env.GUILD_ID) {
      console.log(`🗑️ Suppression des commandes du serveur ${process.env.GUILD_ID}...`);
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.GUILD_ID),
        { body: [] }
      );
      console.log('✅ Commandes du serveur supprimées');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des commandes:', error);
  }
})();
