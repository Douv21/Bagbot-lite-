const fsp  = require('fs/promises');
const path = require('path');

let DATA_DIR    = process.env.DATA_DIR ? String(process.env.DATA_DIR) : path.join(process.cwd(), 'data');
let CONFIG_PATH = path.join(DATA_DIR, 'config.json');

// ── In-memory cache + serialised write queue ─────────────────────────────────
// All reads are served from _mem (after first load) — zero disk I/O for reads.
// All writes are serialised through _q and use an atomic rename to avoid
// partial-write corruption (the main source of "Unexpected end of JSON" errors).
let _mem = null;
let _q   = Promise.resolve();

function setDataDir(dir) {
  DATA_DIR    = String(dir);
  CONFIG_PATH = path.join(DATA_DIR, 'config.json');
  _mem = null; // invalidate cache when path changes
}

async function _ensureDir() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
}

// ── Read ──────────────────────────────────────────────────────────────────────
async function loadConfig() {
  if (_mem) return _mem;
  await _ensureDir();
  try {
    _mem = JSON.parse(await fsp.readFile(CONFIG_PATH, 'utf8'));
    return _mem;
  } catch (err) {
    if (err.code === 'ENOENT') {
      _mem = { guilds: {} };
      return _mem;
    }
    if (err instanceof SyntaxError) {
      console.error('[jsonStore] config.json corrompu, tentative de récupération…');
      try {
        _mem = JSON.parse(await fsp.readFile(CONFIG_PATH + '.bak', 'utf8'));
        console.log('[jsonStore] Récupéré depuis la sauvegarde .bak ✓');
        return _mem;
      } catch (_) {}
      console.error('[jsonStore] Aucune sauvegarde valide — réinitialisation');
      _mem = { guilds: {} };
      return _mem;
    }
    throw err;
  }
}

// ── Write (atomic + queued) ───────────────────────────────────────────────────
async function _flush() {
  if (!_mem) return;
  await _ensureDir();
  const tmp = CONFIG_PATH + '.tmp';
  const raw = JSON.stringify(_mem, null, 2);
  try { await fsp.copyFile(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch (_) {}
  await fsp.writeFile(tmp, raw, 'utf8');
  await fsp.rename(tmp, CONFIG_PATH); // atomic on Linux — no partial writes
}

function saveConfig(cfg) {
  _mem = cfg;
  _q   = _q.then(_flush).catch(e => console.error('[jsonStore] Erreur écriture:', e));
  return _q;
}

// ── Guild helpers ─────────────────────────────────────────────────────────────
function getGuildConfig(cfg, guildId) {
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guildId]) {
    cfg.guilds[guildId] = {
      economy: {}, levels: {}, welcome: {}, depart: {},
      actions: {}, shop: {}, forum: {}, cards: {}
    };
  }
  return cfg.guilds[guildId];
}

async function getGuildData(guildId) {
  return getGuildConfig(await loadConfig(), guildId);
}

async function updateGuildData(guildId, data) {
  const cfg = await loadConfig();
  Object.assign(getGuildConfig(cfg, guildId), data);
  return saveConfig(cfg);
}

// ── User helpers ──────────────────────────────────────────────────────────────
const _dUser = () => ({
  xp: 0, balance: 0, level: 0, messages: 0, voiceMinutes: 0,
  lastMessage: null, lastVoice: null, karma: 0, fire: 0
});

function _ensureUser(guild, userId) {
  if (!guild.users) guild.users = {};
  if (!guild.users[userId]) guild.users[userId] = _dUser();
  return guild.users[userId];
}

async function getUserData(guildId, userId) {
  const cfg = await loadConfig();
  return _ensureUser(getGuildConfig(cfg, guildId), userId); // direct in-memory ref
}

async function updateUserData(guildId, userId, data) {
  const cfg = await loadConfig();
  Object.assign(_ensureUser(getGuildConfig(cfg, guildId), userId), data);
  return saveConfig(cfg);
}

async function addXP(guildId, userId, amount) {
  const cfg  = await loadConfig();
  const user = _ensureUser(getGuildConfig(cfg, guildId), userId);
  user.xp    = (user.xp || 0) + amount;
  await saveConfig(cfg);
  return user.xp;
}

async function addBalance(guildId, userId, amount) {
  const cfg  = await loadConfig();
  const user = _ensureUser(getGuildConfig(cfg, guildId), userId);
  user.balance = (user.balance || 0) + amount;
  await saveConfig(cfg);
  return user.balance;
}

async function getXP(guildId, userId) {
  return (await getUserData(guildId, userId)).xp || 0;
}

async function getBalance(guildId, userId) {
  return (await getUserData(guildId, userId)).balance || 0;
}

async function getAllUsersInGuild(guildId) {
  const cfg = await loadConfig();
  return Object.keys(getGuildConfig(cfg, guildId).users || {});
}

async function resetFireForGuild(guildId) {
  const cfg   = await loadConfig();
  const guild = getGuildConfig(cfg, guildId);
  if (!guild.users) return;
  for (const uid of Object.keys(guild.users)) guild.users[uid].fire = 0;
  return saveConfig(cfg);
}

module.exports = {
  setDataDir, loadConfig, saveConfig, getGuildConfig,
  getGuildData, updateGuildData,
  getUserData, updateUserData,
  addXP, addBalance, getXP, getBalance,
  getAllUsersInGuild, resetFireForGuild
};
