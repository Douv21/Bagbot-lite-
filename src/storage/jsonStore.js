const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

let DATA_DIR = process.env.DATA_DIR ? String(process.env.DATA_DIR) : path.join(process.cwd(), 'data');
let CONFIG_PATH = path.join(DATA_DIR, 'config.json');

function setDataDir(dir) {
  DATA_DIR = String(dir);
  CONFIG_PATH = path.join(DATA_DIR, 'config.json');
}

async function ensureDataDir() {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

async function loadConfig() {
  await ensureDataDir();
  try {
    const raw = await fsp.readFile(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { guilds: {} };
    }
    if (error instanceof SyntaxError) {
      console.error('[jsonStore] data/config.json corrompu, réinitialisation :', error.message);
      const empty = { guilds: {} };
      await fsp.writeFile(CONFIG_PATH, JSON.stringify(empty, null, 2), 'utf8');
      return empty;
    }
    throw error;
  }
}

async function saveConfig(config) {
  await ensureDataDir();
  const raw = JSON.stringify(config, null, 2);
  await fsp.writeFile(CONFIG_PATH, raw, 'utf8');
}

function getGuildConfig(config, guildId) {
  if (!config.guilds) config.guilds = {};
  if (!config.guilds[guildId]) {
    config.guilds[guildId] = {
      economy: {},
      levels: {},
      welcome: {},
      depart: {},
      actions: {},
      shop: {},
      forum: {},
      cards: {}
    };
  }
  return config.guilds[guildId];
}

async function getGuildData(guildId) {
  const config = await loadConfig();
  return getGuildConfig(config, guildId);
}

async function updateGuildData(guildId, data) {
  const config = await loadConfig();
  const guildConfig = getGuildConfig(config, guildId);
  Object.assign(guildConfig, data);
  await saveConfig(config);
}

// User data storage per guild
async function getUserData(guildId, userId) {
  const config = await loadConfig();
  const guildConfig = getGuildConfig(config, guildId);
  if (!guildConfig.users) guildConfig.users = {};
  if (!guildConfig.users[userId]) {
    guildConfig.users[userId] = {
      xp: 0,
      balance: 0,
      level: 0,
      messages: 0,
      voiceMinutes: 0,
      lastMessage: null,
      lastVoice: null,
      karma: 0,
      fire: 0
    };
  }
  return guildConfig.users[userId];
}

async function updateUserData(guildId, userId, data) {
  const config = await loadConfig();
  const guildConfig = getGuildConfig(config, guildId);
  if (!guildConfig.users) guildConfig.users = {};
  if (!guildConfig.users[userId]) {
    guildConfig.users[userId] = {
      xp: 0,
      balance: 0,
      level: 0,
      messages: 0,
      voiceMinutes: 0,
      lastMessage: null,
      lastVoice: null,
      karma: 0,
      fire: 0
    };
  }
  Object.assign(guildConfig.users[userId], data);
  await saveConfig(config);
}

async function addXP(guildId, userId, amount) {
  const userData = await getUserData(guildId, userId);
  userData.xp = (userData.xp || 0) + amount;
  await updateUserData(guildId, userId, userData);
  return userData.xp;
}

async function addBalance(guildId, userId, amount) {
  const userData = await getUserData(guildId, userId);
  userData.balance = (userData.balance || 0) + amount;
  await updateUserData(guildId, userId, userData);
  return userData.balance;
}

async function getXP(guildId, userId) {
  const userData = await getUserData(guildId, userId);
  return userData.xp || 0;
}

async function getBalance(guildId, userId) {
  const userData = await getUserData(guildId, userId);
  return userData.balance || 0;
}

async function getAllUsersInGuild(guildId) {
  const config = await loadConfig();
  const guildConfig = getGuildConfig(config, guildId);
  return Object.keys(guildConfig.users || {});
}

async function resetFireForGuild(guildId) {
  const config = await loadConfig();
  const guildConfig = getGuildConfig(config, guildId);
  if (!guildConfig.users) return;
  for (const userId of Object.keys(guildConfig.users)) {
    guildConfig.users[userId].fire = 0;
  }
  await saveConfig(config);
}

module.exports = {
  setDataDir,
  loadConfig,
  saveConfig,
  getGuildConfig,
  getGuildData,
  updateGuildData,
  getUserData,
  updateUserData,
  addXP,
  addBalance,
  getXP,
  getBalance,
  getAllUsersInGuild,
  resetFireForGuild
};
