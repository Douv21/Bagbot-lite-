const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('🗑️ Suppression de TOUTES les commandes Discord...');
    
    // Supprimer toutes les commandes globales
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: [] }
    );
    
    console.log('✅ Toutes les commandes globales supprimées');
    
    // Si GUILD_ID est défini, supprimer aussi les commandes du serveur spécifique
    const GUILD_ID = process.env.GUILD_ID;
    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, GUILD_ID),
        { body: [] }
      );
      console.log(`✅ Toutes les commandes du serveur ${GUILD_ID} supprimées`);
    }
    
    console.log('\n✅ Toutes les commandes ont été supprimées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
})();
