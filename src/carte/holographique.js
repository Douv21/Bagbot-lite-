// Carte holographique utilisant Holographique.png comme fond
// Compatible discord.js v14

const Canvas = require("canvas");
const path = require("path");

module.exports = async (member, data = {}) => {

  // ===== CONFIG =====
  const width = 1600;
  const height = 900;

  const canvas = Canvas.createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // ===== DONNÉES =====
  const username = member.user.username;
  const discriminator = member.user.discriminator;
  const avatarURL = member.user.displayAvatarURL({
    extension: "png",
    size: 512
  });

  const serverIcon = member.guild.iconURL({
    extension: "png",
    size: 512
  });

  const level = data.level || 38;
  const currentXP = data.currentXP || 18750;
  const requiredXP = data.requiredXP || 25000;

  const messages = data.messages || 5842;
  const timeSpent = data.timeSpent || "120h";
  const streak = data.streak || "28 jours";

  const nextLevel = level + 1;
  const remainingXP = requiredXP - currentXP;

  const progress = currentXP / requiredXP;

  // ===== BACKGROUND IMAGE =====
  try {
    const bgPath = path.join(__dirname, 'Holographique.png');
    const bgImage = await Canvas.loadImage(bgPath);
    ctx.drawImage(bgImage, 0, 0, width, height);
  } catch (error) {
    console.error('Error loading background image:', error);
    // Fallback to dark background
    ctx.fillStyle = "#050816";
    ctx.fillRect(0, 0, width, height);
  }

  // ===== DARK OVERLAY TO COVER ORIGINAL TEXT =====
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, width, height);

  // ===== AVATAR =====
  const avatar = await Canvas.loadImage(avatarURL);

  ctx.save();
  ctx.beginPath();
  ctx.arc(220, 310, 110, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 110, 200, 220, 220);
  ctx.restore();

  // Avatar border
  ctx.strokeStyle = "#00f7ff";
  ctx.lineWidth = 8;
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00f7ff";
  ctx.beginPath();
  ctx.arc(220, 310, 125, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ===== INFOS MEMBRE =====
  ctx.font = "bold 72px sans-serif";
  ctx.fillStyle = "#d9ffff";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 8;
  ctx.fillText(username.toUpperCase(), 400, 280);

  ctx.font = "42px sans-serif";
  ctx.fillStyle = "#7d8cff";
  ctx.fillText(`#${discriminator}`, 405, 340);
  ctx.shadowBlur = 0;

  // ===== NIVEAU =====
  ctx.font = "bold 180px sans-serif";
  ctx.fillStyle = "#5ef7ff";
  ctx.shadowBlur = 30;
  ctx.shadowColor = "#00ffff";
  ctx.fillText(level, 1080, 300);
  ctx.shadowBlur = 0;

  // ===== BARRE XP =====
  ctx.font = "bold 40px sans-serif";
  ctx.fillStyle = "#d8ffff";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 8;
  ctx.fillText("EXP", 100, 558);
  ctx.shadowBlur = 0;

  // Fond barre
  roundRect(ctx, 230, 525, 1100, 35, 18);
  ctx.fillStyle = "#0b2230";
  ctx.fill();

  // Progression
  const gradient = ctx.createLinearGradient(230, 0, 1330, 0);
  gradient.addColorStop(0, "#00e5ff");
  gradient.addColorStop(0.5, "#5e9dff");
  gradient.addColorStop(1, "#8effff");

  roundRect(ctx, 230, 525, 1100 * progress, 35, 18);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.font = "bold 36px sans-serif";
  ctx.fillStyle = "#9fe7ff";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 8;
  ctx.fillText(`${currentXP.toLocaleString()} / ${requiredXP.toLocaleString()} EXP`, 1080, 558);
  ctx.shadowBlur = 0;

  // ===== STATS =====
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#76f7ff";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 8;
  ctx.fillText("MESSAGES", 100, 760);

  ctx.font = "bold 52px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(messages.toString(), 100, 815);

  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#76f7ff";
  ctx.fillText("TEMPS", 300, 760);

  ctx.font = "bold 52px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(timeSpent, 300, 815);

  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#76f7ff";
  ctx.fillText("SÉRIE", 470, 760);

  ctx.font = "bold 52px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(streak, 470, 815);
  ctx.shadowBlur = 0;

  // ===== PROCHAIN NIVEAU =====
  ctx.font = "bold 80px sans-serif";
  ctx.fillStyle = "#5ef7ff";
  ctx.shadowBlur = 30;
  ctx.shadowColor = "#00ffff";
  ctx.fillText(nextLevel, 770, 790);
  ctx.shadowBlur = 0;

  ctx.font = "bold 40px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 8;
  ctx.fillText(`${remainingXP} EXP`, 910, 790);
  ctx.shadowBlur = 0;

  // ===== LOGO SERVEUR =====
  if (serverIcon) {
    const icon = await Canvas.loadImage(serverIcon);
    ctx.save();
    ctx.beginPath();
    ctx.arc(1340, 760, 75, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(icon, 1265, 685, 150, 150);
    ctx.restore();

    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffe08a";
    ctx.beginPath();
    ctx.arc(1340, 760, 78, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ===== EXPORT =====
  return canvas.toBuffer();

};

// ===== FONCTIONS =====

function roundRect(ctx, x, y, width, height, radius) {

  ctx.beginPath();

  ctx.moveTo(x + radius, y);

  ctx.lineTo(x + width - radius, y);

  ctx.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + radius
  );

  ctx.lineTo(x + width, y + height - radius);

  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );

  ctx.lineTo(x + radius, y + height);

  ctx.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - radius
  );

  ctx.lineTo(x, y + radius);

  ctx.quadraticCurveTo(
    x,
    y,
    x + radius,
    y
  );

  ctx.closePath();
}

function drawPanel(ctx, x, y, w, h) {

  roundRect(ctx, x, y, w, h, 20);

  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);

  gradient.addColorStop(0, "rgba(0,255,255,0.12)");
  gradient.addColorStop(1, "rgba(0,80,120,0.18)");

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = "rgba(0,255,255,0.5)";
  ctx.lineWidth = 3;

  ctx.stroke();
}

function drawSmallPanel(ctx, x, y, w, h) {

  roundRect(ctx, x, y, w, h, 15);

  ctx.fillStyle = "rgba(0,255,255,0.08)";
  ctx.fill();

  ctx.strokeStyle = "rgba(0,255,255,0.4)";
  ctx.lineWidth = 2;

  ctx.stroke();
}
