require('dotenv').config();

process.on('uncaughtException', err => {
  console.error('💥 UNCAUGHT EXCEPTION — bot va redémarrer:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION — promesse non catchée:', reason);
});

const { Client, GatewayIntentBits, REST, Routes, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { loadGuildConfig } = require('./utils/leveling');
const { addBalance, addXP, getXP } = require('./utils/economy');
const { getUserData, updateUserData } = require('./storage/jsonStore');
const { xpToLevel, getLastRewardForLevel, getNextRewardForLevel } = require('./utils/levelHelpers');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
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

const economyPath = path.join(__dirname, 'commands/economy');
if (fs.existsSync(economyPath)) {
  const economyFiles = fs.readdirSync(economyPath).filter(file => file.endsWith('.js'));
  
  for (const file of economyFiles) {
    const filePath = path.join(economyPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      commands.push(command);
      console.log(`✓ Commande économie chargée: ${command.data.name}`);
    } else {
      console.log(`⚠️ Attention: La commande économie dans ${file} manque les propriétés "data" ou "execute"`);
    }
  }
}

// Handler pour les interactions (commandes slash)
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const age = Date.now() - interaction.createdTimestamp;
  if (age > 2800) {
    console.warn(`⚠️ Interaction /${interaction.commandName} reçue avec ${age}ms de délai (horloge serveur?)`);
  }

  const command = commands.find(cmd => cmd.data.name === interaction.commandName);

  if (!command) {
    console.error(`Commande non trouvée: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    if (error.code === 10062) {
      console.warn(`⚠️ Interaction /${interaction.commandName} expirée (latence réseau trop élevée)`);
      return;
    }
    console.error(`Erreur exécution commande ${interaction.commandName}:`, error);
    const errorReply = { content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.', flags: 64 };
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorReply).catch(() => {});
    } else {
      await interaction.reply(errorReply).catch(() => {});
    }
  }
});

client.on('guildMemberAdd', async (member) => {
  try {
    console.log(`Member joined: ${member.user.tag} in guild ${member.guild.name}`);
    const config = loadGuildConfig(member.guild.id);

    if (config && config.welcome && config.welcome.enabled && config.welcome.channel) {
      console.log(`Welcome config found, channel: ${config.welcome.channel}`);
      const channel = await member.guild.channels.fetch(config.welcome.channel);
      if (channel && channel.isTextBased()) {
        console.log(`Channel found and is text-based, sending welcome message`);
        const desc = (config.welcome.message || 'Bienvenue {user} sur le serveur !')
          .replace('{user}', member.user.toString())
          .replace('{server}', member.guild.name)
          .replace('{member_count}', member.guild.memberCount.toString());

        const embed = new EmbedBuilder()
          .setTitle(config.welcome.title || '👋 Bienvenue')
          .setDescription(desc)
          .setColor(parseInt((config.welcome.color || '#C41E3A').replace('#', ''), 16) || 0xC41E3A)
          .setTimestamp();

        if (config.welcome.image)     embed.setImage(config.welcome.image);
        if (config.welcome.thumbnail) embed.setThumbnail(config.welcome.thumbnail);
        if (config.welcome.authorName) {
          const authorOpts = { name: config.welcome.authorName };
          if (config.welcome.authorIcon) authorOpts.iconURL = config.welcome.authorIcon;
          embed.setAuthor(authorOpts);
        }
        if (config.welcome.footerText) {
          const footerOpts = { text: config.welcome.footerText };
          if (config.welcome.footerIcon) footerOpts.iconURL = config.welcome.footerIcon;
          embed.setFooter(footerOpts);
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

// Helper function to handle level ups
async function handleLevelUp(guild, userId, newLevel) {
  try {
    const config = loadGuildConfig(guild.id);
    if (!config) return;

    // Check if there's a role reward for this level
    const reward = config.rewards && config.rewards[newLevel];
    if (reward) {
      const role = await guild.roles.fetch(reward).catch(() => null);
      if (role) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) {
          await member.roles.add(role);
          console.log(`User ${userId} reached level ${newLevel}, added role ${role.name}`);
        }
      }
    }

    // Announce level up if configured
    if (config.levelUpChannel) {
      const channel = await guild.channels.fetch(config.levelUpChannel).catch(() => null);
      if (channel && channel.isTextBased()) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) {
          await channel.send(`🎉 ${member} a atteint le niveau **${newLevel}** !`);
        }
      }
    }
  } catch (error) {
    console.error('Erreur handleLevelUp:', error);
  }
}

// Voice state tracking for rewards
const voiceSessions = new Map();

client.on('voiceStateUpdate', async (oldState, newState) => {
  const userId = newState.member.id;
  const guildId = newState.guild.id;

  // User joined a voice channel
  if (!oldState.channel && newState.channel) {
    voiceSessions.set(`${guildId}-${userId}`, {
      joinedAt: Date.now(),
      channelId: newState.channel.id
    });
  }

  // User left a voice channel
  if (oldState.channel && !newState.channel) {
    const session = voiceSessions.get(`${guildId}-${userId}`);
    if (session) {
      const duration = Date.now() - session.joinedAt;
      const minutes = Math.floor(duration / 60000);

      if (minutes > 0) {
        try {
          const config = loadGuildConfig(guildId);
          const moneyPerMinute = config?.economy?.moneyPerVoiceMinute || 2;
          const xpMinPerMinute = config?.economy?.xpMinPerVoiceMinute || 2;
          const xpMaxPerMinute = config?.economy?.xpMaxPerVoiceMinute || 10;

          if (moneyPerMinute > 0) {
            const totalMoney = moneyPerMinute * minutes;
            await addBalance(guildId, userId, totalMoney);
          }

          if (xpMinPerMinute > 0 && xpMaxPerMinute > 0) {
            const totalXP = minutes * Math.floor(Math.random() * (xpMaxPerMinute - xpMinPerMinute + 1)) + xpMinPerMinute;
            const oldXP = await getXP(guildId, userId) || 0;
            await addXP(guildId, userId, totalXP);
            const newXP = await getXP(guildId, userId);

            // Track voice minutes in user stats
            try {
              const ud = await getUserData(guildId, userId);
              await updateUserData(guildId, userId, { voiceMinutes: (ud.voiceMinutes || 0) + minutes });
            } catch (_) {}
            
            // Check for level up
            const levelCurve = config?.levelCurve || { base: 100, factor: 1.2 };
            const oldLevel = xpToLevel(oldXP, levelCurve).level;
            const newLevel = xpToLevel(newXP, levelCurve).level;
            
            if (newLevel > oldLevel) {
              await handleLevelUp(newState.guild, userId, newLevel);
            }
          }
        } catch (error) {
          console.error('Erreur gain vocal:', error);
        }
      }

      voiceSessions.delete(`${guildId}-${userId}`);
    }
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
    const xpMinPerMessage = config?.economy?.xpMinPerMessage || 1;
    const xpMaxPerMessage = config?.economy?.xpMaxPerMessage || 5;
    
    if (moneyPerMessage > 0) {
      await addBalance(message.guild.id, message.author.id, moneyPerMessage);
    }
    
    if (xpMinPerMessage > 0 && xpMaxPerMessage > 0) {
      const xpReward = Math.floor(Math.random() * (xpMaxPerMessage - xpMinPerMessage + 1)) + xpMinPerMessage;
      const oldXP = await getXP(message.guild.id, message.author.id) || 0;
      await addXP(message.guild.id, message.author.id, xpReward);
      const newXP = await getXP(message.guild.id, message.author.id);

      // Track message count + karma + fire in user stats
      try {
        const ud = await getUserData(message.guild.id, message.author.id);
        const isNsfw = message.channel && message.channel.nsfw === true;
        await updateUserData(message.guild.id, message.author.id, {
          messages: (ud.messages || 0) + 1,
          karma:    (ud.karma   || 0) + 1,
          fire:     (ud.fire    || 0) + (isNsfw ? 1 : 0)
        });
      } catch (_) {}
      
      // Check for level up
      const levelCurve = config?.levelCurve || { base: 100, factor: 1.2 };
      const oldLevel = xpToLevel(oldXP, levelCurve).level;
      const newLevel = xpToLevel(newXP, levelCurve).level;
      
      if (newLevel > oldLevel) {
        await handleLevelUp(message.guild, message.author.id, newLevel);
      }
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
