require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { loadGuildConfig } = require('./utils/leveling');
const { addBalance, addXP } = require('./utils/economy');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: ['CHANNEL', 'MESSAGE', 'THREAD']
});

// API server pour exposer les guilds du bot
const apiApp = express();
const API_PORT = process.env.BOT_API_PORT || 49502;

apiApp.get('/guilds', (req, res) => {
  const guilds = client.guilds.cache.map(guild => ({
    id: guild.id,
    name: guild.name,
    icon: guild.icon
  }));
  res.json(guilds);
});

apiApp.get('/guilds/:guildId/channels', async (req, res) => {
  try {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    // Fetch channels if not in cache
    await guild.channels.fetch();

    const channels = guild.channels.cache.map(channel => ({
      id: channel.id,
      name: channel.name || 'Unknown',
      type: channel.type
    }));

    console.log(`Channels for guild ${req.params.guildId}:`, channels);
    res.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Error fetching channels' });
  }
});

apiApp.get('/guilds/:guildId/roles', async (req, res) => {
  try {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    // Fetch roles if not in cache
    await guild.roles.fetch();

    const roles = guild.roles.cache.map(role => ({
      id: role.id,
      name: role.name,
      color: role.color,
      position: role.position
    }));

    console.log(`Roles for guild ${req.params.guildId}:`, roles);
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Error fetching roles' });
  }
});

apiApp.listen(API_PORT, () => {
  console.log(`✓ Bot API running on port ${API_PORT}`);
});

// Charger les commandes
const commandsPath = path.join(__dirname, 'commands');
const commands = [];

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      commands.push(command);
      console.log(`✓ Commande chargée: ${command.data.name}`);
    } else {
      console.log(`⚠️ Attention: La commande dans ${file} manque les propriétés "data" ou "execute"`);
    }
  }
}

const actionsPath = path.join(__dirname, 'commands/actions');
if (fs.existsSync(actionsPath)) {
  const actionFiles = fs.readdirSync(actionsPath).filter(file => file.endsWith('.js'));
  
  for (const file of actionFiles) {
    const filePath = path.join(actionsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      commands.push(command);
      console.log(`✓ Action chargée: ${command.data.name}`);
    } else {
      console.log(`⚠️ Attention: L'action dans ${file} manque les propriétés "data" ou "execute"`);
    }
  }
}

// Handler pour les interactions (commandes slash)
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.find(cmd => cmd.data.name === interaction.commandName);

  if (!command) {
    console.error(`Commande non trouvée: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Erreur exécution commande ${interaction.commandName}:`, error);
    const errorReply = { content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorReply).catch(() => {});
    } else {
      await interaction.reply(errorReply).catch(() => {});
    }
  }
});

// Charger la configuration d'un serveur
function loadGuildConfig(guildId) {
  try {
    const configPath = path.join(__dirname, '../configs', `${guildId}.json`);
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    console.error(`Erreur chargement config pour ${guildId}:`, error);
  }
  return null;
}

client.on('guildMemberAdd', async (member) => {
  try {
    console.log(`Member joined: ${member.user.tag} in guild ${member.guild.name}`);
    const config = loadGuildConfig(member.guild.id);

    if (config && config.welcome && config.welcome.enabled && config.welcome.channel) {
      console.log(`Welcome config found, channel: ${config.welcome.channel}`);
      const channel = await member.guild.channels.fetch(config.welcome.channel);
      if (channel && channel.isTextBased()) {
        console.log(`Channel found and is text-based, sending welcome message`);
        const embed = {
          title: config.welcome.title || '👋 Bienvenue',
          description: config.welcome.message
            .replace('{user}', member.user.toString())
            .replace('{server}', member.guild.name)
            .replace('{member_count}', member.guild.memberCount.toString()),
          color: parseInt(config.welcome.color?.replace('#', ''), 16) || 0xC41E3A
        };

        if (config.welcome.image) embed.image = { url: config.welcome.image };
        if (config.welcome.thumbnail) embed.thumbnail = { url: config.welcome.thumbnail };
        if (config.welcome.authorName) {
          embed.author = {
            name: config.welcome.authorName,
            icon_url: config.welcome.authorIcon || undefined
          };
        }
        if (config.welcome.footerText) {
          embed.footer = {
            text: config.welcome.footerText,
            icon_url: config.welcome.footerIcon || undefined
          };
        }

        await channel.send({ embeds: [embed] });
        console.log(`Welcome message sent successfully`);
      } else {
        console.log(`Channel not found or not text-based`);
      }
    } else {
      console.log(`Welcome config not found or disabled`);
    }
  } catch (error) {
    console.error('Erreur message bienvenue:', error);
  }
});

client.on('guildMemberRemove', async (member) => {
  try {
    const config = loadGuildConfig(member.guild.id);

    if (config && config.depart && config.depart.enabled && config.depart.channel) {
      const channel = await member.guild.channels.fetch(config.depart.channel);
      if (channel && channel.isTextBased()) {
        const embed = {
          title: config.depart.title || '👋 Au revoir',
          description: config.depart.message
            .replace('{user}', member.user.username)
            .replace('{server}', member.guild.name),
          color: parseInt(config.depart.color?.replace('#', ''), 16) || 0xC41E3A
        };

        if (config.depart.image) embed.image = { url: config.depart.image };
        if (config.depart.thumbnail) embed.thumbnail = { url: config.depart.thumbnail };
        if (config.depart.authorName) {
          embed.author = {
            name: config.depart.authorName,
            icon_url: config.depart.authorIcon || undefined
          };
        }
        if (config.depart.footerText) {
          embed.footer = {
            text: config.depart.footerText,
            icon_url: config.depart.footerIcon || undefined
          };
        }

        await channel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error('Erreur message départ:', error);
  }
});

// Gain d'argent et XP par message
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  try {
    const config = loadGuildConfig(message.guild.id);
    
    // Vérifier si le gain d'argent est activé
    const moneyPerMessage = config?.economy?.moneyPerMessage || 1;
    const xpPerMessage = config?.economy?.xpPerMessage || 1;
    
    if (moneyPerMessage > 0) {
      addBalance(message.guild.id, message.author.id, moneyPerMessage);
    }
    
    if (xpPerMessage > 0) {
      addXP(message.guild.id, message.author.id, xpPerMessage);
    }
  } catch (error) {
    console.error('Erreur gain message:', error);
  }
});

// Forum illimité : réouvrir automatiquement les threads archivés
client.on('threadUpdate', async (oldThread, newThread) => {
  try {
    console.log(`Thread update: ${newThread.name}, archived: ${newThread.archived}, old archived: ${oldThread?.archived}, parentId: ${newThread.parentId}`);
    const config = loadGuildConfig(newThread.guildId);
    console.log(`Config for guild ${newThread.guildId}:`, config?.forum);
    
    if (config && config.forum && config.forum.enabled && config.forum.channels) {
      console.log(`Forum channels in config:`, config.forum.channels);
      // Vérifier si le thread est dans un salon forum illimité
      if (config.forum.channels.includes(newThread.parentId)) {
        console.log(`Thread is in forum unlimited channel`);
        // Si le thread est archivé, le réouvrir
        if (newThread.archived) {
          console.log(`Attempting to reopen thread ${newThread.name}`);
          await newThread.setArchived(false, 'Forum illimité - réouverture automatique');
          console.log(`Thread ${newThread.name} reopened successfully`);
        }
      }
    }
  } catch (error) {
    console.error('Erreur gestion forum illimité:', error);
  }
});

// Au démarrage, réouvrir tous les threads archivés dans les salons forum illimités
client.once('ready', async () => {
  console.log(`✓ Bot connecté en tant que ${client.user.tag}`);
  console.log(`✓ Prêt sur ${client.guilds.cache.size} serveur(s)`);

  // Enregistrer les commandes slash
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    console.log(`✓ Début de l'enregistrement des commandes slash globales.`);
    
    const commandData = commands.map(cmd => cmd.data.toJSON());
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandData }
    );
    
    console.log(`✓ ${commands.length} commandes slash enregistrées avec succès.`);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des commandes slash:', error);
  }

  // Réouvrir les threads archivés dans les salons forum illimités
  for (const guild of client.guilds.cache.values()) {
    try {
      console.log(`Checking guild ${guild.name} (${guild.id})`);
      const config = loadGuildConfig(guild.id);
      console.log(`Config for guild ${guild.id}:`, config?.forum);

      if (config && config.forum && config.forum.enabled && config.forum.channels) {
        console.log(`Forum unlimited enabled for guild ${guild.id}, channels:`, config.forum.channels);
        for (const channelId of config.forum.channels) {
          console.log(`Fetching channel ${channelId}`);
          const channel = await guild.channels.fetch(channelId).catch(() => null);
          if (channel) {
            console.log(`Channel found: ${channel.name}, type: ${channel.type}, isThreadOnly: ${channel.isThreadOnly()}`);
            if (channel.isThreadOnly()) {
              // Récupérer tous les threads archivés
              console.log(`Fetching archived threads for channel ${channel.name}`);
              const archivedThreads = await channel.threads.fetchArchived({ fetchAll: true });
              console.log(`Found ${archivedThreads.threads.size} archived threads`);

              for (const thread of archivedThreads.threads.values()) {
                console.log(`Reopening thread ${thread.name} at startup`);
                await thread.setArchived(false, 'Forum illimité - réouverture au démarrage');
                console.log(`Thread ${thread.name} reopened successfully`);
              }
            } else {
              console.log(`Channel ${channel.name} is not thread-only`);
            }
          } else {
            console.log(`Channel ${channelId} not found`);
          }
        }
      } else {
        console.log(`Forum unlimited not enabled for guild ${guild.id}`);
      }
    } catch (error) {
      console.error(`Erreur réouverture threads pour guild ${guild.id}:`, error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
