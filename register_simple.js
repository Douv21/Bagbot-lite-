const { Client, GatewayIntentBits } = require('discord.js');
const { loadCommands } = require('./src/handlers/commandHandler');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`✓ Bot connecté: ${client.user.tag}`);
  
  try {
    // Charger les commandes
    const commands = await loadCommands(client);
    console.log(`✓ ${commands.length} commandes chargées`);
    
    // Enregistrer les commandes globalement
    await client.application.commands.set(commands);
    console.log(`✓ ${commands.length} commandes enregistrées globalement`);
    
    // Vérifier
    const registeredCommands = await client.application.commands.fetch();
    console.log(`✓ ${registeredCommands.size} commandes vérifiées`);
    
    registeredCommands.forEach(cmd => {
      console.log(`  - ${cmd.name} (DM: ${cmd.dmPermission})`);
    });
    
    console.log('\n✅ Commandes enregistrées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
