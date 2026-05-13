const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateLevelUpCard(user, level, xp, xpToNextLevel, guildIcon) {
  const canvas = createCanvas(800, 200);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 800, 200);
  gradient.addColorStop(0, '#1a1a1a');
  gradient.addColorStop(1, '#2d2d2d');
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
  ctx.strokeStyle = '#C41E3A';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Username
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px Arial';
  ctx.fillText(user.username, 200, 80);

  // Level
  ctx.fillStyle = '#C41E3A';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(`Niveau ${level}`, 200, 120);

  // XP bar background
  ctx.fillStyle = '#333333';
  ctx.fillRect(200, 140, 500, 20);

  // XP bar fill
  const xpPercentage = xp / xpToNextLevel;
  ctx.fillStyle = '#C41E3A';
  ctx.fillRect(200, 140, 500 * xpPercentage, 20);

  // XP text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText(`${xp} / ${xpToNextLevel} XP`, 200, 175);

  return canvas.toBuffer();
}

module.exports = {
  generateLevelUpCard
};
