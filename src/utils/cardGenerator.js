const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Card themes with background images
const cardThemes = [
  {
    name: 'gaming',
    background: ['#1a1a2e', '#16213e'],
    accent: '#e94560',
    textColor: '#ffffff',
    barColor: '#e94560',
    borderColor: '#e94560',
    backgroundPattern: 'gaming'
  },
  {
    name: 'holographique',
    background: ['#0f0c29', '#302b63', '#24243e'],
    accent: '#00d4ff',
    textColor: '#ffffff',
    barColor: '#00d4ff',
    borderColor: '#00d4ff',
    backgroundPattern: 'holographic'
  },
  {
    name: 'futuriste',
    background: ['#000000', '#434343'],
    accent: '#00ff88',
    textColor: '#ffffff',
    barColor: '#00ff88',
    borderColor: '#00ff88',
    backgroundPattern: 'futuristic'
  },
  {
    name: 'sensuelle',
    background: ['#2d1b2e', '#5c2a4e'],
    accent: '#ff69b4',
    textColor: '#ffffff',
    barColor: '#ff69b4',
    borderColor: '#ff69b4',
    backgroundPattern: 'sensual'
  },
  {
    name: 'love',
    background: ['#ff6b6b', '#ee5a5a'],
    accent: '#ffffff',
    textColor: '#ffffff',
    barColor: '#ffffff',
    borderColor: '#ffffff',
    backgroundPattern: 'love'
  },
  {
    name: 'default',
    background: ['#1a1a1a', '#2d2d2d'],
    accent: '#C41E3A',
    textColor: '#ffffff',
    barColor: '#C41E3A',
    borderColor: '#C41E3A',
    backgroundPattern: 'default'
  }
];

// Draw background pattern based on theme
function drawBackgroundPattern(ctx, width, height, pattern) {
  ctx.save();
  
  switch(pattern) {
    case 'gaming':
      // Draw pixelated grid pattern
      ctx.strokeStyle = 'rgba(233, 69, 96, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      break;
      
    case 'holographic':
      // Draw gradient lines
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 - i * 0.02})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height * (i + 1) / 6);
        ctx.lineTo(width, height * (i + 2) / 6);
        ctx.stroke();
      }
      break;
      
    case 'futuristic':
      // Draw circuit-like pattern
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.stroke();
      }
      break;
      
    case 'sensual':
      // Draw soft curves
      ctx.strokeStyle = 'rgba(255, 105, 180, 0.1)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, height * (i + 1) / 6);
        ctx.bezierCurveTo(width / 3, height * (i + 2) / 6, width * 2 / 3, height * i / 6, width, height * (i + 1) / 6);
        ctx.stroke();
      }
      break;
      
    case 'love':
      // Draw heart pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = 10 + Math.random() * 20;
        ctx.beginPath();
        ctx.moveTo(x, y + size / 4);
        ctx.quadraticCurveTo(x, y, x + size / 4, y);
        ctx.quadraticCurveTo(x + size / 2, y, x + size / 2, y + size / 4);
        ctx.quadraticCurveTo(x + size / 2, y, x + size * 3 / 4, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + size / 4);
        ctx.quadraticCurveTo(x + size, y + size / 2, x + size / 2, y + size);
        ctx.quadraticCurveTo(x, y + size / 2, x, y + size / 4);
        ctx.fill();
      }
      break;
      
    default:
      // No pattern for default
      break;
  }
  
  ctx.restore();
}

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

  // Draw background pattern
  drawBackgroundPattern(ctx, 800, 200, theme.backgroundPattern);

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
