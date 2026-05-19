const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Theme gradient functions
function getThemeGradient(ctx, theme, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  
  switch(theme) {
    case 'gaming':
      g.addColorStop(0, '#1a1a2e');
      g.addColorStop(1, '#16213e');
      break;
    case 'holographic':
      g.addColorStop(0, '#0f0c29');
      g.addColorStop(0.5, '#302b63');
      g.addColorStop(1, '#24243e');
      break;
    case 'futuristic':
      g.addColorStop(0, '#000000');
      g.addColorStop(1, '#1a1a2e');
      break;
    case 'love':
      g.addColorStop(0, '#2d1b2e');
      g.addColorStop(1, '#1a0a1e');
      break;
    case 'sensual':
      g.addColorStop(0, '#1a0a0a');
      g.addColorStop(1, '#2d0a0a');
      break;
    case 'rose':
      g.addColorStop(0, '#ff9a9e');
      g.addColorStop(0.5, '#fecfef');
      g.addColorStop(1, '#ff6b95');
      break;
    case 'gold':
      g.addColorStop(0, '#f5af19');
      g.addColorStop(0.5, '#f12711');
      g.addColorStop(1, '#f5af19');
      break;
    case 'blue':
    default:
      g.addColorStop(0.00, '#b3d4ff');
      g.addColorStop(0.18, '#6aa6ff');
      g.addColorStop(0.38, '#8bbcff');
      g.addColorStop(0.60, '#2f6bd6');
      g.addColorStop(0.80, '#7fb2ff');
      g.addColorStop(1.00, '#1b4ea3');
      break;
  }
  return g;
}

function getThemeColors(theme) {
  switch(theme) {
    case 'gaming':
      return { text: '#00ff88', accent: '#e94560', bar: '#e94560', border: '#e94560' };
    case 'holographic':
      return { text: '#00ffff', accent: '#ff00ff', bar: '#ff00ff', border: '#00ffff' };
    case 'futuristic':
      return { text: '#00ff00', accent: '#00ffff', bar: '#00ff00', border: '#00ff00' };
    case 'love':
      return { text: '#ff69b4', accent: '#ff1493', bar: '#ff1493', border: '#ff69b4' };
    case 'sensual':
      return { text: '#ff6b6b', accent: '#ff4757', bar: '#ff4757', border: '#ff6b6b' };
    case 'rose':
      return { text: '#ff9a9e', accent: '#ff6b95', bar: '#ff6b95', border: '#ff9a9e' };
    case 'gold':
      return { text: '#f5af19', accent: '#f12711', bar: '#f5af19', border: '#f5af19' };
    case 'blue':
    default:
      return { text: '#b3d4ff', accent: '#2f6bd6', bar: '#6aa6ff', border: '#6aa6ff' };
  }
}

// Blue gradient function (for backward compatibility)
function blueGradient(ctx, x, y, w, h) {
  return getThemeGradient(ctx, 'blue', x, y, w, h);
}

// Rounded rectangle function
function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Circular progress bar function with theme support
function drawCircularProgress(ctx, centerX, centerY, radius, progress, strokeWidth = 8, theme = 'blue') {
  const colors = getThemeColors(theme);
  
  // Background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = `${colors.bar}33`;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Progress circle
  if (progress > 0) {
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (2 * Math.PI * Math.min(1, Math.max(0, progress)));
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);

    const progressGradient = ctx.createLinearGradient(
      centerX - radius, centerY - radius,
      centerX + radius, centerY + radius
    );
    progressGradient.addColorStop(0, colors.text);
    progressGradient.addColorStop(0.5, colors.bar);
    progressGradient.addColorStop(1, colors.accent);

    ctx.strokeStyle = progressGradient;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

// Circular progress bar function (for backward compatibility)
function drawCircularProgressBlue(ctx, centerX, centerY, radius, progress, strokeWidth = 8) {
  return drawCircularProgress(ctx, centerX, centerY, radius, progress, strokeWidth, 'blue');
}

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
  const canvas = createCanvas(1600, 900);
  const ctx = canvas.getContext('2d');

  // Select theme (random if not specified)
  const availableThemes = ['blue', 'gaming', 'holographic', 'futuristic', 'love', 'sensual', 'rose', 'gold'];
  const theme = themeName 
    ? (themeName === 'random' ? availableThemes[Math.floor(Math.random() * availableThemes.length)] : themeName)
    : availableThemes[Math.floor(Math.random() * availableThemes.length)];
  
  const colors = getThemeColors(theme);

  // Load background image from src/carte
  const themeImageMap = {
    'blue': 'Bleu.png',
    'gaming': 'Gaming.png',
    'holographic': 'Holographique.png',
    'futuristic': 'Futuriste.png',
    'love': 'Love.png',
    'sensual': 'Sensuelle.png',
    'rose': 'Rose.png',
    'gold': 'Or.png'
  };

  const imageName = themeImageMap[theme] || 'Bleu.png';
  const imagePath = path.join(__dirname, '../carte', imageName);

  try {
    const backgroundImage = await loadImage(imagePath);
    ctx.drawImage(backgroundImage, 0, 0, 1600, 900);
  } catch (error) {
    console.error('Error loading background image:', error);
    // Fallback to gradient if image fails
    const bg = getThemeGradient(ctx, theme, 0, 0, 1600, 900);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1600, 900);
  }

  // Semi-transparent dark overlay for better text readability
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, 1600, 900);

  // Watermark (guild icon)
  if (guildIcon) {
    try {
      const icon = await loadImage(guildIcon);
      const target = 1080;
      const x = (1600 - target) / 2;
      const y = (900 - target) / 2 + 20;
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.drawImage(icon, x, y, target, target);
      ctx.restore();
    } catch (error) {
      console.error('Error loading guild icon:', error);
    }
  }

  // Border
  const m = 20;
  ctx.lineWidth = 4;
  ctx.strokeStyle = colors.border;
  roundedRect(ctx, m, m, 1600 - 2*m, 900 - 2*m, 20);
  ctx.stroke();

  // User info section - left side
  const infoX = 100;
  let infoY = 150;
  
  // Avatar
  const avatarSize = 180;
  try {
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(infoX + avatarSize/2, infoY + avatarSize/2, avatarSize/2, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, infoX, infoY, avatarSize, avatarSize);
    ctx.restore();
    
    // Avatar border
    ctx.beginPath();
    ctx.arc(infoX + avatarSize/2, infoY + avatarSize/2, avatarSize/2, 0, Math.PI*2);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 5;
    ctx.stroke();
  } catch (error) {
    console.error('Error loading avatar:', error);
  }

  // Username
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 8;
  ctx.font = 'bold 48px Arial';
  ctx.fillText(user.username, infoX + avatarSize + 30, infoY + 20);
  
  // Discriminator
  ctx.fillStyle = '#cccccc';
  ctx.font = '32px Arial';
  ctx.fillText(`#${user.discriminator}`, infoX + avatarSize + 30, infoY + 80);
  ctx.shadowBlur = 0;

  // Level badge
  infoY += avatarSize + 40;
  ctx.fillStyle = colors.accent;
  ctx.font = 'bold 56px Arial';
  ctx.fillText(`NIVEAU ${level}`, infoX, infoY);

  // XP bar background
  infoY += 80;
  const barWidth = 500;
  const barHeight = 30;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  roundedRect(ctx, infoX, infoY, barWidth, barHeight, 15);
  ctx.fill();

  // XP bar fill
  const progress = xpToNextLevel > 0 ? Math.min(1, Math.max(0, xp / xpToNextLevel)) : 0;
  ctx.fillStyle = colors.bar;
  roundedRect(ctx, infoX, infoY, barWidth * progress, barHeight, 15);
  ctx.fill();

  // XP text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${xp} / ${xpToNextLevel} XP`, infoX + barWidth/2, infoY + 5);
  ctx.textAlign = 'left';

  // Right side - Stats
  const statsX = 950;
  let statsY = 150;
  
  // Title
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 52px Arial';
  ctx.fillText('STATISTIQUES', statsX, statsY);
  statsY += 80;

  // XP stat
  ctx.fillStyle = '#ffffff';
  ctx.font = '36px Arial';
  ctx.fillText(`XP Total: ${xp}`, statsX, statsY);
  statsY += 60;

  // Next level
  ctx.fillText(`Prochain niveau: ${xpToNextLevel - xp} XP`, statsX, statsY);
  statsY += 60;

  // Progress percentage
  ctx.fillStyle = colors.accent;
  ctx.font = 'bold 42px Arial';
  ctx.fillText(`${Math.round(progress * 100)}%`, statsX, statsY);

  // Bottom message
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px Arial';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 10;
  ctx.fillText('🎉 FÉLICITATIONS POUR CE NIVEAU ! 🎉', 800, 800);
  ctx.shadowBlur = 0;

  return canvas.toBuffer();
}

async function generateBalanceCard(user, balance, currencyName, guildIcon, themeName = null) {
  const canvas = createCanvas(1600, 900);
  const ctx = canvas.getContext('2d');

  // Select theme (random if not specified)
  const availableThemes = ['blue', 'gaming', 'holographic', 'futuristic', 'love', 'sensual', 'rose', 'gold'];
  const theme = themeName 
    ? (themeName === 'random' ? availableThemes[Math.floor(Math.random() * availableThemes.length)] : themeName)
    : availableThemes[Math.floor(Math.random() * availableThemes.length)];
  
  const colors = getThemeColors(theme);

  // Load background image from src/carte
  const themeImageMap = {
    'blue': 'Bleu.png',
    'gaming': 'Gaming.png',
    'holographic': 'Holographique.png',
    'futuristic': 'Futuriste.png',
    'love': 'Love.png',
    'sensual': 'Sensuelle.png',
    'rose': 'Rose.png',
    'gold': 'Or.png'
  };

  const imageName = themeImageMap[theme] || 'Bleu.png';
  const imagePath = path.join(__dirname, '../carte', imageName);

  try {
    const backgroundImage = await loadImage(imagePath);
    ctx.drawImage(backgroundImage, 0, 0, 1600, 900);
  } catch (error) {
    console.error('Error loading background image:', error);
    // Fallback to gradient if image fails
    const bg = getThemeGradient(ctx, theme, 0, 0, 1600, 900);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1600, 900);
  }

  // Vignette effect
  const vign = ctx.createRadialGradient(800, 450, 200, 800, 450, 900);
  vign.addColorStop(0, 'rgba(0,0,0,0)');
  vign.addColorStop(1, 'rgba(0,0,0,0.60)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, 1600, 900);

  // Watermark (guild icon)
  if (guildIcon) {
    try {
      const icon = await loadImage(guildIcon);
      const target = 1080;
      const x = (1600 - target) / 2;
      const y = (900 - target) / 2 + 20;
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.drawImage(icon, x, y, target, target);
      ctx.restore();
    } catch (error) {
      console.error('Error loading guild icon:', error);
    }
  }

  // Border + corners
  const m = 22;
  ctx.lineWidth = 3;
  ctx.strokeStyle = colors.border;
  roundedRect(ctx, m, m, 1600 - 2*m, 900 - 2*m, 18);
  ctx.stroke();

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 72px Arial';
  ctx.shadowColor = '#00000080';
  ctx.shadowBlur = 10;
  ctx.fillText('SOLDE', 800, 72);
  ctx.shadowBlur = 0;

  // Username
  let y = 160;
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 78px Arial';
  ctx.fillText(user.username, 800, y);
  y += 90;

  // Balance info
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 58px Arial';
  ctx.fillText(`Solde : ${balance} ${currencyName}`, 800, y);
  y += 70;

  // Central logo
  const logoSize = 200;
  const logoY = y;
  const centerX = 800;
  const centerY = logoY + logoSize / 2;

  // User avatar as central logo
  try {
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize/2 + 6, 0, Math.PI*2);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize/2, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, centerX - logoSize/2, logoY, logoSize, logoSize);
    ctx.restore();
  } catch (error) {
    console.error('Error loading avatar:', error);
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize/2, 0, Math.PI*2);
    ctx.fillStyle = colors.border;
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(user.username.substring(0, 3).toUpperCase(), centerX, centerY);
  }

  // Congratulations
  const congratsY = logoY + logoSize + 22;
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 80px Arial';
  ctx.fillText('💰', 800, congratsY);

  // Baseline
  const baseY = congratsY + 86;
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 42px Arial';
  ctx.fillText('💎 TON ARGENT EST EN SÉCURITÉ 💎', 800, baseY);

  return canvas.toBuffer();
}

module.exports = {
  generateLevelUpCard,
  generateBalanceCard,
  cardThemes
};
