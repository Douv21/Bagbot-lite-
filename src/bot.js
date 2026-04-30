require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', () => {
  console.log(`✓ Bot connecté en tant que ${client.user.tag}`);
  console.log(`✓ Prêt sur ${client.guilds.cache.size} serveur(s)`);
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

client.login(process.env.DISCORD_TOKEN);
