const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

class WelcomeDepartModule {
  constructor(client, configManager) {
    this.client = client;
    this.configManager = configManager;
    this.name = 'welcome-depart';
    this.configPath = path.join(__dirname, '../../data/welcome-depart.json');
    this.config = this.loadConfig();
  }

  /**
   * Initialiser le module
   */
  async initialize() {
    console.log('[WelcomeDepartModule] Initialisation...');
    
    // Créer le dossier data s'il n'existe pas
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Charger la configuration
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[WelcomeDepartModule] Erreur chargement config:', error);
    }
    
    // Configuration par défaut
    return {
      guilds: {}
    };
  }

  /**
   * Sauvegarder la configuration
   */
  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('[WelcomeDepartModule] Erreur sauvegarde config:', error);
    }
  }

  /**
   * Configurer la bienvenue pour un serveur
   */
  setWelcomeConfig(guildId, config) {
    if (!this.config.guilds[guildId]) {
      this.config.guilds[guildId] = {};
    }
    
    this.config.guilds[guildId].welcome = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      channelId: config.channelId,
      message: config.message || 'Bienvenue {user} sur {server} !',
      color: config.color || '#FF0040',
      logo: config.logo || null,
      thumbnail: config.thumbnail || null,
      image: config.image || null,
      footer: config.footer || 'Bienvenue !',
      footerIcon: config.footerIcon || null
    };
    
    this.saveConfig();
  }

  /**
   * Configurer le départ pour un serveur
   */
  setDepartConfig(guildId, config) {
    if (!this.config.guilds[guildId]) {
      this.config.guilds[guildId] = {};
    }
    
    this.config.guilds[guildId].depart = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      channelId: config.channelId,
      message: config.message || '{user} a quitté {server} !',
      color: config.color || '#FF0040',
      logo: config.logo || null,
      thumbnail: config.thumbnail || null,
      image: config.image || null,
      footer: config.footer || 'Au revoir !',
      footerIcon: config.footerIcon || null
    };
    
    this.saveConfig();
  }

  /**
   * Envoyer le message de bienvenue
   */
  async sendWelcome(member) {
    const guild = member.guild;
    const config = this.config.guilds[guild.id]?.welcome;
    
    if (!config || !config.enabled || !config.channelId) return;
    
    const channel = await guild.channels.fetch(config.channelId).catch(() => null);
    if (!channel) return;
    
    // Remplacer les variables
    let message = config.message
      .replace('{user}', member.toString())
      .replace('{username}', member.user.username)
      .replace('{server}', guild.name)
      .replace('{memberCount}', guild.memberCount.toString());
    
    // Créer l'embed
    const embed = new EmbedBuilder()
      .setColor(config.color)
      .setDescription(message)
      .setTimestamp();
    
    // Logo (author)
    if (config.logo) {
      embed.setAuthor({
        name: guild.name,
        iconURL: config.logo
      });
    } else {
      embed.setAuthor({
        name: guild.name,
        iconURL: guild.iconURL()
      });
    }
    
    // Thumbnail
    if (config.thumbnail) {
      embed.setThumbnail(config.thumbnail);
    } else {
      embed.setThumbnail(member.user.displayAvatarURL({ size: 256 }));
    }
    
    // Image
    if (config.image) {
      embed.setImage(config.image);
    }
    
    // Footer
    if (config.footer) {
      embed.setFooter({
        text: config.footer,
        iconURL: config.footerIcon || null
      });
    }
    
    await channel.send({ embeds: [embed] });
    console.log(`[WelcomeDepartModule] Bienvenue envoyée pour ${member.user.tag}`);
  }

  /**
   * Envoyer le message de départ
   */
  async sendDepart(member) {
    const guild = member.guild;
    const config = this.config.guilds[guild.id]?.depart;
    
    if (!config || !config.enabled || !config.channelId) return;
    
    const channel = await guild.channels.fetch(config.channelId).catch(() => null);
    if (!channel) return;
    
    // Remplacer les variables
    let message = config.message
      .replace('{user}', member.toString())
      .replace('{username}', member.user.username)
      .replace('{server}', guild.name)
      .replace('{memberCount}', guild.memberCount.toString());
    
    // Créer l'embed
    const embed = new EmbedBuilder()
      .setColor(config.color)
      .setDescription(message)
      .setTimestamp();
    
    // Logo (author)
    if (config.logo) {
      embed.setAuthor({
        name: guild.name,
        iconURL: config.logo
      });
    } else {
      embed.setAuthor({
        name: guild.name,
        iconURL: guild.iconURL()
      });
    }
    
    // Thumbnail
    if (config.thumbnail) {
      embed.setThumbnail(config.thumbnail);
    } else {
      embed.setThumbnail(member.user.displayAvatarURL({ size: 256 }));
    }
    
    // Image
    if (config.image) {
      embed.setImage(config.image);
    }
    
    // Footer
    if (config.footer) {
      embed.setFooter({
        text: config.footer,
        iconURL: config.footerIcon || null
      });
    }
    
    await channel.send({ embeds: [embed] });
    console.log(`[WelcomeDepartModule] Départ envoyé pour ${member.user.tag}`);
  }

  /**
   * Événement guildMemberAdd
   */
  async onGuildMemberAdd(member) {
    await this.sendWelcome(member);
  }

  /**
   * Événement guildMemberRemove
   */
  async onGuildMemberRemove(member) {
    await this.sendDepart(member);
  }

  /**
   * Obtenir la configuration d'un serveur
   */
  getGuildConfig(guildId) {
    return this.config.guilds[guildId] || null;
  }

  /**
   * Arrêter le module
   */
  shutdown() {
    console.log('[WelcomeDepartModule] Arrêt...');
  }
}

module.exports = WelcomeDepartModule;
