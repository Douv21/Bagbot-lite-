const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🗑️ Suppression de toutes les commandes...');
    
    // Supprimer toutes les commandes globales
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: [] }
    );
    
    console.log('✅ Toutes les commandes supprimées');
    
    // Charger uniquement la commande boutique
    const boutiqueCommand = require('./src/commands/boutique.js');
    const commands = [boutiqueCommand.data.toJSON()];
    
    console.log('🚀 Déploiement de la commande /boutique...');
    
    // Déploiement global
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    
    console.log(`✅ ${data.length} commande(s) déployée(s) avec succès globalement`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
})();
