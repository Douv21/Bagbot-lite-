require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
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

apiApp.listen(API_PORT, () => {
  console.log(`✓ Bot API running on port ${API_PORT}`);
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
    const config = loadGuildConfig(member.guild.id);

    if (config && config.welcome && config.welcome.enabled && config.welcome.channel) {
      const channel = await member.guild.channels.fetch(config.welcome.channel);
      if (channel && channel.isTextBased()) {
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
      }
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

// Forum illimité : réouvrir automatiquement les threads archivés
client.on('threadUpdate', async (oldThread, newThread) => {
  try {
    const config = loadGuildConfig(newThread.guildId);
    
    if (config && config.forum && config.forum.enabled && config.forum.channels) {
      // Vérifier si le thread est dans un salon forum illimité
      if (config.forum.channels.includes(newThread.parentId)) {
        // Si le thread est archivé, le réouvrir
        if (newThread.archived && !oldThread?.archived) {
          console.log(`Réouverture du thread ${newThread.name} dans le salon forum illimité`);
          await newThread.setArchived(false, 'Forum illimité - réouverture automatique');
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
  
  // Réouvrir les threads archivés dans les salons forum illimités
  for (const guild of client.guilds.cache.values()) {
    try {
      const config = loadGuildConfig(guild.id);
      
      if (config && config.forum && config.forum.enabled && config.forum.channels) {
        for (const channelId of config.forum.channels) {
          const channel = await guild.channels.fetch(channelId).catch(() => null);
          if (channel && channel.isThreadOnly()) {
            // Récupérer tous les threads archivés
            const archivedThreads = await channel.threads.fetchArchived({ fetchAll: true });
            
            for (const thread of archivedThreads.threads.values()) {
              console.log(`Réouverture du thread ${thread.name} au démarrage`);
              await thread.setArchived(false, 'Forum illimité - réouverture au démarrage');
            }
          }
        }
      }
    } catch (error) {
      console.error(`Erreur réouverture threads pour guild ${guild.id}:`, error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
