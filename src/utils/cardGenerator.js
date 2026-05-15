const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Card themes
const cardThemes = [
  {
    name: 'gaming',
    background: ['#1a1a2e', '#16213e'],
    accent: '#e94560',
    textColor: '#ffffff',
    barColor: '#e94560',
    borderColor: '#e94560'
  },
  {
    name: 'holographique',
    background: ['#0f0c29', '#302b63', '#24243e'],
    accent: '#00d4ff',
    textColor: '#ffffff',
    barColor: '#00d4ff',
    borderColor: '#00d4ff'
  },
  {
    name: 'futuriste',
    background: ['#000000', '#434343'],
    accent: '#00ff88',
    textColor: '#ffffff',
    barColor: '#00ff88',
    borderColor: '#00ff88'
  },
  {
    name: 'sensuelle',
    background: ['#2d1b2e', '#5c2a4e'],
    accent: '#ff69b4',
    textColor: '#ffffff',
    barColor: '#ff69b4',
    borderColor: '#ff69b4'
  },
  {
    name: 'love',
    background: ['#ff6b6b', '#ee5a5a'],
    accent: '#ffffff',
    textColor: '#ffffff',
    barColor: '#ffffff',
    borderColor: '#ffffff'
  },
  {
    name: 'default',
    background: ['#1a1a1a', '#2d2d2d'],
    accent: '#C41E3A',
    textColor: '#ffffff',
    barColor: '#C41E3A',
    borderColor: '#C41E3A'
  }
];

async function generateLevelUpCard(user, level, xp, xpToNextLevel, guildIcon, themeName = null) {
  const canvas = createCanvas(800, 200);
  const ctx = canvas.getContext('2d');

  // Select random theme or specified theme
  const theme = themeName 
    ? cardThemes.find(t => t.name === themeName) || cardThemes[0]
    : cardThemes[Math.floor(Math.random() * (cardThemes.length - 1))];

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 800, 200);
  gradient.addColorStop(0, theme.background[0]);
  gradient.addColorStop(1, theme.background[theme.background.length - 1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 200);

  // Guild icon as background if provided
  if (guildIcon) {
    try {
      const icon = await loadImage(guildIcon);
      ctx.globalAlpha = 0.1;
      ctx.drawImage(icon, 0, 0, 800, 200);
      ctx.globalAlpha = 1.0;
    } catch (error) {
      console.error('Error loading guild icon:', error);
    }
  }

  // User avatar
  try {
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 128 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(100, 100, 64, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 36, 36, 128, 128);
    ctx.restore();
  } catch (error) {
    console.error('Error loading avatar:', error);
  }

  // Avatar border
  ctx.beginPath();
  ctx.arc(100, 100, 64, 0, Math.PI * 2);
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Username
  ctx.fillStyle = theme.textColor;
  ctx.font = 'bold 36px Arial';
  ctx.fillText(user.username, 200, 80);

  // Level
  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 28px Arial';
  ctx.fillText(`Niveau ${level}`, 200, 120);

  // XP bar background
  ctx.fillStyle = '#333333';
  ctx.fillRect(200, 140, 500, 20);

  // XP bar fill
  const xpPercentage = xp / xpToNextLevel;
  ctx.fillStyle = theme.barColor;
  ctx.fillRect(200, 140, 500 * xpPercentage, 20);

  // XP text
  ctx.fillStyle = theme.textColor;
  ctx.font = '16px Arial';
  ctx.fillText(`${xp} / ${xpToNextLevel} XP`, 200, 175);

  // Theme name watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.font = '12px Arial';
  ctx.fillText(theme.name.toUpperCase(), 750, 190);

  return canvas.toBuffer();
}

module.exports = {
  generateLevelUpCard,
  cardThemes
};
