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
    xp: xp,
    required: xpToNextLevel,
    rank: 1
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
    xp: balance,
    required: balance,
    rank: 1
  };

  return await generateHolographicCard(mockMember, data);
}

module.exports = {
  generateLevelUpCard,
  generateBalanceCard
};
