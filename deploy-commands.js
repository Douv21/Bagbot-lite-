const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');

// Read all command files from src/commands and src/commands/actions
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`✓ Commande chargée: ${command.data.name}`);
    } else {
      console.log(`⚠️ Attention: La commande dans ${file} manque les propriétés "data" ou "execute"`);
    }
  }
}

// Also load commands from actions subdirectory
const actionsPath = path.join(__dirname, 'src/commands/actions');
if (fs.existsSync(actionsPath)) {
  const actionFiles = fs.readdirSync(actionsPath).filter(file => file.endsWith('.js'));
  
  for (const file of actionFiles) {
    const filePath = path.join(actionsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`✓ Action chargée: ${command.data.name}`);
    } else {
      console.log(`⚠️ Attention: L'action dans ${file} manque les propriétés "data" ou "execute"`);
    }
  }
} else {
  console.log('⚠️ Le dossier src/commands/actions n\'existe pas');
}

// Deploy commands
const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log(`\n🚀 Déploiement de ${commands.length} commande(s)...`);

    // Pour le déploiement global (tous les serveurs)
    // const data = await rest.put(
    //   Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
    //   { body: commands }
    // );

    // Pour le déploiement sur un serveur spécifique (recommandé pour le développement)
    const GUILD_ID = process.env.GUILD_ID; // Ajoutez votre GUILD_ID dans le .env
    if (GUILD_ID) {
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, GUILD_ID),
        { body: commands }
      );
      console.log(`✅ ${data.length} commande(s) déployée(s) avec succès sur le serveur ${GUILD_ID}`);
    } else {
      console.log('⚠️ GUILD_ID non défini dans le .env, déploiement global...');
      const data = await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ ${data.length} commande(s) déployée(s) avec succès globalement`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du déploiement des commandes:', error);
  }
})();
