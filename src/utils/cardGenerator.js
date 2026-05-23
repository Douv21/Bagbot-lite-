const generateHolographicCard = require('../carte/holographique');

async function generateLevelUpCard(user, level, xp, xpToNextLevel, guildIcon, themeName = null, guild = null) {
  // Create a mock member object for the holographic card function
  const mockMember = {
    user: {
      username: user.username,
      discriminator: user.discriminator,
      displayAvatarURL: (opts) => user.displayAvatarURL(opts)
    },
    guild: {
      iconURL: (opts) => guildIcon
    }
  };

  const data = {
    level: level,
    currentXP: xp,
    requiredXP: xpToNextLevel,
    messages: 0,
    timeSpent: "0h",
    streak: "0 jours"
  };

  return await generateHolographicCard(mockMember, data);
}

async function generateBalanceCard(user, balance, currencyName, guildIcon, themeName = null, guild = null) {
  // Create a mock member object for the holographic card function
  const mockMember = {
    user: {
      username: user.username,
      discriminator: user.discriminator,
      displayAvatarURL: (opts) => user.displayAvatarURL(opts)
    },
    guild: {
      iconURL: (opts) => guildIcon
    }
  };

  const data = {
    level: 0,
    currentXP: balance,
    requiredXP: balance,
    messages: 0,
    timeSpent: "0h",
    streak: "0 jours"
  };

  return await generateHolographicCard(mockMember, data);
}

module.exports = {
  generateLevelUpCard,
  generateBalanceCard
};
