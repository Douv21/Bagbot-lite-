const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Blue gradient function
function blueGradient(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0.00, '#b3d4ff');
  g.addColorStop(0.18, '#6aa6ff');
  g.addColorStop(0.38, '#8bbcff');
  g.addColorStop(0.60, '#2f6bd6');
  g.addColorStop(0.80, '#7fb2ff');
  g.addColorStop(1.00, '#1b4ea3');
  return g;
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

// Circular progress bar function
function drawCircularProgressBlue(ctx, centerX, centerY, radius, progress, strokeWidth = 8) {
  // Background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(179,212,255,0.2)';
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
    progressGradient.addColorStop(0, '#b3d4ff');
    progressGradient.addColorStop(0.5, '#6aa6ff');
    progressGradient.addColorStop(1, '#2f6bd6');

    ctx.strokeStyle = progressGradient;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
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

  // Select random theme or specified theme
  const theme = themeName 
    ? cardThemes.find(t => t.name === themeName) || cardThemes[0]
    : cardThemes[Math.floor(Math.random() * (cardThemes.length - 1))];

  // Background gradient (dark blue like prestige-blue)
  const bg = ctx.createLinearGradient(0, 0, 0, 900);
  bg.addColorStop(0, '#0b0f14');
  bg.addColorStop(1, '#070a0f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1600, 900);

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
  ctx.strokeStyle = blueGradient(ctx, m, m, 1600-2*m, 900-2*m);
  roundedRect(ctx, m, m, 1600 - 2*m, 900 - 2*m, 18);
  ctx.stroke();

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = blueGradient(ctx, 0, 0, 1600, 140);
  ctx.font = 'bold 72px Arial';
  ctx.shadowColor = '#00000080';
  ctx.shadowBlur = 10;
  ctx.fillText('NIVEAU SUPÉRIEUR', 800, 72);
  ctx.shadowBlur = 0;

  // Username
  const maxW = 1200;
  let y = 210;
  ctx.fillStyle = blueGradient(ctx, 0, y, 1600, 70);
  ctx.font = 'bold 78px Arial';
  ctx.fillText(user.username, 800, y);
  y += 94;

  // Level info
  ctx.fillStyle = blueGradient(ctx, 0, y, 1600, 50);
  ctx.font = 'bold 58px Arial';
  ctx.fillText(`Niveau atteint : ${level}`, 800, y);
  y += 72;

  ctx.fillStyle = blueGradient(ctx, 0, y, 1600, 50);
  ctx.fillText(`XP : ${xp} / ${xpToNextLevel}`, 800, y);
  y += 24;

  // Central logo with circular progress
  const logoSize = 210;
  const logoY = y;
  const centerX = 800;
  const centerY = logoY + logoSize / 2;
  const progressRadius = logoSize / 2 + 20;

  const progress = xpToNextLevel > 0 ? Math.min(1, Math.max(0, xp / xpToNextLevel)) : 0;

  drawCircularProgressBlue(ctx, centerX, centerY, progressRadius, progress, 12);

  // User avatar as central logo
  try {
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize/2 + 6, 0, Math.PI*2);
    ctx.strokeStyle = blueGradient(ctx, 800 - logoSize/2, logoY, logoSize, logoSize);
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
    ctx.fillStyle = blueGradient(ctx, 800 - logoSize/2, logoY, logoSize, logoSize);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(user.username.substring(0, 3).toUpperCase(), centerX, centerY);
  }

  // Progress percentage
  ctx.fillStyle = blueGradient(ctx, centerX - 50, centerY + logoSize/2 + 35, 100, 30);
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${Math.round(progress * 100)}%`, centerX, centerY + logoSize/2 + 35);

  // Congratulations
  const congratsY = logoY + logoSize + 22;
  ctx.fillStyle = blueGradient(ctx, 0, congratsY, 1600, 40);
  ctx.font = 'bold 80px Arial';
  ctx.fillText('Félicitations !', 800, congratsY);

  // Baseline
  const baseY = congratsY + 86;
  ctx.fillStyle = blueGradient(ctx, 0, baseY, 1600, 30);
  ctx.font = 'bold 42px Arial';
  ctx.fillText('💎 CONTINUE TON ASCENSION 💎', 800, baseY);

  return canvas.toBuffer();
}

async function generateBalanceCard(user, balance, currencyName, guildIcon, themeName = null) {
  const canvas = createCanvas(1600, 900);
  const ctx = canvas.getContext('2d');

  // Background gradient (dark blue like prestige-blue)
  const bg = ctx.createLinearGradient(0, 0, 0, 900);
  bg.addColorStop(0, '#0b0f14');
  bg.addColorStop(1, '#070a0f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1600, 900);

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
  ctx.strokeStyle = blueGradient(ctx, m, m, 1600-2*m, 900-2*m);
  roundedRect(ctx, m, m, 1600 - 2*m, 900 - 2*m, 18);
  ctx.stroke();

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = blueGradient(ctx, 0, 0, 1600, 140);
  ctx.font = 'bold 72px Arial';
  ctx.shadowColor = '#00000080';
  ctx.shadowBlur = 10;
  ctx.fillText('💰 SOLDE', 800, 72);
  ctx.shadowBlur = 0;

  // Username
  let y = 210;
  ctx.fillStyle = blueGradient(ctx, 0, y, 1600, 70);
  ctx.font = 'bold 78px Arial';
  ctx.fillText(user.username, 800, y);
  y += 94;

  // Balance info
  ctx.fillStyle = blueGradient(ctx, 0, y, 1600, 50);
  ctx.font = 'bold 58px Arial';
  ctx.fillText(`Solde : ${balance} ${currencyName}`, 800, y);
  y += 24;

  // Central logo
  const logoSize = 210;
  const logoY = y;
  const centerX = 800;
  const centerY = logoY + logoSize / 2;

  // User avatar as central logo
  try {
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize/2 + 6, 0, Math.PI*2);
    ctx.strokeStyle = blueGradient(ctx, 800 - logoSize/2, logoY, logoSize, logoSize);
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
    ctx.fillStyle = blueGradient(ctx, 800 - logoSize/2, logoY, logoSize, logoSize);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(user.username.substring(0, 3).toUpperCase(), centerX, centerY);
  }

  // Congratulations
  const congratsY = logoY + logoSize + 22;
  ctx.fillStyle = blueGradient(ctx, 0, congratsY, 1600, 40);
  ctx.font = 'bold 80px Arial';
  ctx.fillText('Continue à accumuler !', 800, congratsY);

  // Baseline
  const baseY = congratsY + 86;
  ctx.fillStyle = blueGradient(ctx, 0, baseY, 1600, 30);
  ctx.font = 'bold 42px Arial';
  ctx.fillText('� DEVIENT RICHE 💎', 800, baseY);

  return canvas.toBuffer();
}

module.exports = {
  generateLevelUpCard,
  generateBalanceCard,
  cardThemes
};
