const generateHolographicCard = require('../carte/holographique');

async function generateLevelUpCard(user, level, xp, xpToNextLevel, guildIcon, themeName = null, guild = null, stats = {}) {
  const mockMember = {
    user: {
      username:        user.username,
      discriminator:   user.discriminator,
      displayAvatarURL: user.displayAvatarURL.bind(user)
    },
    guild: {
      iconURL: () => guildIcon
    }
  };

  const data = {
    level,
    xp,
    required:     xpToNextLevel,
    rank:         1,
    messages:     stats.messages     || 0,
    voiceMinutes: stats.voiceMinutes || 0,
    streak:       stats.streak       || 0,
    roleName:     stats.roleName     || 'Membre du serveur'
  };

  try {
    const result = await generateHolographicCard(mockMember, data);
    if (!result) return null;
    if (result && typeof result === 'object' && result.attachment) return result.attachment;
    return result;
  } catch (err) {
    console.error('❌ generateLevelUpCard error:', err.message, err.stack);
    return null;
  }
}

async function generateBalanceCard(user, balance, currencyName, guildIcon, themeName = null, guild = null) {
  const mockMember = {
    user: {
      username:        user.username,
      discriminator:   user.discriminator,
      displayAvatarURL: user.displayAvatarURL.bind(user)
    },
    guild: {
      iconURL: () => guildIcon
    }
  };

  const data = {
    level:    0,
    xp:       balance,
    required: balance,
    rank:     1,
    messages: 0,
    voiceMinutes: 0,
    streak:   0,
    roleName: 'Solde BAG'
  };

  try {
    const result = await generateHolographicCard(mockMember, data);
    if (!result) return null;
    if (result && typeof result === 'object' && result.attachment) return result.attachment;
    return result;
  } catch (err) {
    console.error('❌ generateBalanceCard error:', err.message);
    return null;
  }
}

module.exports = { generateLevelUpCard, generateBalanceCard };
