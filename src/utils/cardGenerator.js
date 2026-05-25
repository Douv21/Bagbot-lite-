const generateHolographicCard = require('../carte/holographique');

async function generateLevelUpCard(user, level, xp, xpToNextLevel, guildIcon, themeName = null, guild = null) {
  // Create a mock member object for the holographic card function
  const mockMember = {
    user: {
      username: user.username,
      discriminator: user.discriminator,
      displayAvatarURL: user.displayAvatarURL.bind(user)
    },
    guild: {
      iconURL: () => guildIcon
    }
  };

  const data = {
    level: level,
    xp: xp,
    required: xpToNextLevel,
    rank: 1
  };

  const result = await generateHolographicCard(mockMember, data);
  if (!result) return null;
  
  // If result is an AttachmentBuilder, extract the buffer
  if (result.constructor.name === 'AttachmentBuilder') {
    return result.files[0].attachment;
  }
  
  return result;
}

async function generateBalanceCard(user, balance, currencyName, guildIcon, themeName = null, guild = null) {
  // Create a mock member object for the holographic card function
  const mockMember = {
    user: {
      username: user.username,
      discriminator: user.discriminator,
      displayAvatarURL: user.displayAvatarURL.bind(user)
    },
    guild: {
      iconURL: () => guildIcon
    }
  };

  const data = {
    level: 0,
    xp: balance,
    required: balance,
    rank: 1
  };

  const result = await generateHolographicCard(mockMember, data);
  if (!result) return null;
  
  // If result is an AttachmentBuilder, extract the buffer
  if (result.constructor.name === 'AttachmentBuilder') {
    return result.files[0].attachment;
  }
  
  return result;
}

module.exports = {
  generateLevelUpCard,
  generateBalanceCard
};
