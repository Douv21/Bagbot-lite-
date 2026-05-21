const { getBalance: getBalanceStore, addBalance: addBalanceStore, getXP: getXPStore, addXP: addXPStore } = require('../storage/jsonStore');

// Obtenir le solde d'un utilisateur
function getBalance(guildId, userId) {
  return getBalanceStore(guildId, userId);
}

// Ajouter de l'argent à un utilisateur
function addBalance(guildId, userId, amount) {
  return addBalanceStore(guildId, userId, amount);
}

// Définir le solde d'un utilisateur
function setBalance(guildId, userId, amount) {
  const { updateUserData } = require('../storage/jsonStore');
  return updateUserData(guildId, userId, { balance: amount }).then(() => amount);
}

// Obtenir l'XP d'un utilisateur
function getXP(guildId, userId) {
  return getXPStore(guildId, userId);
}

// Ajouter de l'XP à un utilisateur
function addXP(guildId, userId, amount) {
  return addXPStore(guildId, userId, amount);
}

// Définir l'XP d'un utilisateur
function setXP(guildId, userId, amount) {
  const { updateUserData } = require('../storage/jsonStore');
  return updateUserData(guildId, userId, { xp: amount }).then(() => amount);
}

module.exports = {
  getBalance,
  addBalance,
  setBalance,
  getXP,
  addXP,
  setXP
};
