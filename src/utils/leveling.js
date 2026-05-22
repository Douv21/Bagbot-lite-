const { loadConfig, saveConfig } = require('../storage/jsonStore');

// Charger la configuration d'un serveur
function loadGuildConfig(guildId) {
  return loadConfig(guildId);
}

// Sauvegarder la configuration d'un serveur
function saveGuildConfig(guildId, config) {
  return saveConfig(guildId, config);
}

module.exports = {
  loadGuildConfig,
  saveGuildConfig
};
