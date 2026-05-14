const fs = require('fs');
const path = require('path');

// Charger la configuration d'un serveur
function loadGuildConfig(guildId) {
  try {
    const configPath = path.join(__dirname, '../../configs', `${guildId}.json`);
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    console.error(`Erreur chargement config pour ${guildId}:`, error);
  }
  return null;
}

// Sauvegarder la configuration d'un serveur
function saveGuildConfig(guildId, config) {
  try {
    const configPath = path.join(__dirname, '../../configs', `${guildId}.json`);
    const configsDir = path.join(__dirname, '../../configs');
    
    if (!fs.existsSync(configsDir)) {
      fs.mkdirSync(configsDir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`Erreur sauvegarde config pour ${guildId}:`, error);
  }
}

module.exports = {
  loadGuildConfig,
  saveGuildConfig
};
