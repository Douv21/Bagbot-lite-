const fs = require('fs');
const path = require('path');

// Chemin vers le fichier d'économie
const economyPath = path.join(__dirname, '../../data/economy.json');

// Assurer que le dossier data existe
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Charger les données d'économie
function loadEconomy() {
  if (!fs.existsSync(economyPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(economyPath, 'utf8'));
  } catch (error) {
    console.error('Erreur chargement economy:', error);
    return {};
  }
}

// Sauvegarder les données d'économie
function saveEconomy(data) {
  try {
    fs.writeFileSync(economyPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erreur sauvegarde economy:', error);
  }
}

// Obtenir le solde d'un utilisateur
function getBalance(guildId, userId) {
  const economy = loadEconomy();
  const key = `${guildId}_${userId}`;
  return economy[key] || 0;
}

// Ajouter de l'argent à un utilisateur
function addBalance(guildId, userId, amount) {
  const economy = loadEconomy();
  const key = `${guildId}_${userId}`;
  economy[key] = (economy[key] || 0) + amount;
  saveEconomy(economy);
  return economy[key];
}

// Définir le solde d'un utilisateur
function setBalance(guildId, userId, amount) {
  const economy = loadEconomy();
  const key = `${guildId}_${userId}`;
  economy[key] = amount;
  saveEconomy(economy);
  return economy[key];
}

// Obtenir l'XP d'un utilisateur
function getXP(guildId, userId) {
  const economy = loadEconomy();
  const key = `${guildId}_${userId}_xp`;
  return economy[key] || 0;
}

// Ajouter de l'XP à un utilisateur
function addXP(guildId, userId, amount) {
  const economy = loadEconomy();
  const key = `${guildId}_${userId}_xp`;
  economy[key] = (economy[key] || 0) + amount;
  saveEconomy(economy);
  return economy[key];
}

// Définir l'XP d'un utilisateur
function setXP(guildId, userId, amount) {
  const economy = loadEconomy();
  const key = `${guildId}_${userId}_xp`;
  economy[key] = amount;
  saveEconomy(economy);
  return economy[key];
}

module.exports = {
  getBalance,
  addBalance,
  setBalance,
  getXP,
  addXP,
  setXP
};
