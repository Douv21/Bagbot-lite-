const fs = require('fs');
const path = require('path');

// Charger la configuration d'un serveur depuis configs/{guildId}.json
function loadGuildConfig(guildId) {
  if (!guildId) return null;
  const configPath = path.join(process.cwd(), 'configs', `${guildId}.json`);
  try {
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Sauvegarder la configuration d'un serveur dans configs/{guildId}.json
function saveGuildConfig(guildId, config) {
  if (!guildId) return;
  const configDir = path.join(process.cwd(), 'configs');
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  const configPath = path.join(configDir, `${guildId}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  loadGuildConfig,
  saveGuildConfig
};
