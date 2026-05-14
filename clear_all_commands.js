const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('🗑️ Suppression de TOUTES les commandes Discord...');
    
    // Supprimer toutes les commandes globales
    try {
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: [] }
      );
      console.log('✅ Toutes les commandes globales supprimées');
    } catch (error) {
      console.log('⚠️ Erreur suppression commandes globales:', error.message);
    }
    
    // Supprimer aussi les commandes de tous les serveurs
    try {
      const guilds = await rest.get(Routes.userGuilds(process.env.DISCORD_CLIENT_ID));
      console.log(`📋 ${guilds.length} serveur(s) trouvé(s)`);
      
      for (const guild of guilds) {
        try {
          await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guild.id),
            { body: [] }
          );
          console.log(`✅ Commandes supprimées pour le serveur ${guild.name} (${guild.id})`);
        } catch (error) {
          console.log(`⚠️ Erreur suppression commandes serveur ${guild.name}:`, error.message);
        }
      }
    } catch (error) {
      console.log('⚠️ Erreur récupération serveurs:', error.message);
    }
    
    console.log('\n✅ Toutes les commandes ont été supprimées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
})();
