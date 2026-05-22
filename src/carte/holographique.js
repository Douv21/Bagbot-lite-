// npm i discord.js canvas node-fetch sharp
// Carte holographique futuriste Discord
// Compatible discord.js v14

const {
  AttachmentBuilder
} = require("discord.js");

const Canvas = require("canvas");
const sharp = require("sharp");

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

  // ===== BACKGROUND =====

  // Fond noir
  ctx.fillStyle = "#050816";
  ctx.fillRect(0, 0, width, height);

  // Effet grille / texture
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(0,255,255,${Math.random() * 0.08})`;
    ctx.fillRect(
      Math.random() * width,
      Math.random() * height,
      2,
      2
    );
  }

  // Glow cyan
  const glow = ctx.createRadialGradient(
    width / 2,
    height / 2,
    100,
    width / 2,
    height / 2,
    900
  );

  glow.addColorStop(0, "rgba(0,255,255,0.15)");
  glow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // ===== BORDURE HOLOGRAPHIQUE =====

  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = 6;

  roundRect(ctx, 20, 20, width - 40, height - 40, 25);
  ctx.stroke();

  ctx.shadowBlur = 25;
  ctx.shadowColor = "#00e5ff";

  ctx.stroke();

  ctx.shadowBlur = 0;

  // ===== HEADER =====

  drawPanel(ctx, 50, 50, 1500, 120);

  ctx.font = "bold 52px sans-serif";
  ctx.fillStyle = "#bdfdff";
  ctx.fillText("DISCORD LEVEL CARD", 90, 125);

  // ===== AVATAR =====

  const avatar = await Canvas.loadImage(avatarURL);

  ctx.save();

  ctx.beginPath();
  ctx.arc(220, 310, 110, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(avatar, 110, 200, 220, 220);

  ctx.restore();

  // Cercle holographique
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
  ctx.fillText(username.toUpperCase(), 400, 280);

  ctx.font = "42px sans-serif";
  ctx.fillStyle = "#7d8cff";
  ctx.fillText(`#${discriminator}`, 405, 340);

  drawSmallPanel(ctx, 400, 380, 420, 80);

  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#8defff";
  ctx.fillText("MEMBRE DU SERVEUR", 470, 432);

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

  // ===== NIVEAU =====

  drawPanel(ctx, 980, 80, 520, 280);

  ctx.font = "bold 42px sans-serif";
  ctx.fillStyle = "#bfffff";
  ctx.fillText("NIVEAU", 1160, 145);

  ctx.font = "bold 180px sans-serif";
  ctx.fillStyle = "#5ef7ff";

  ctx.shadowBlur = 30;
  ctx.shadowColor = "#00ffff";

  ctx.fillText(level, 1080, 300);

  ctx.shadowBlur = 0;

  // ===== BARRE XP =====

  drawPanel(ctx, 70, 500, 1460, 90);

  ctx.font = "bold 40px sans-serif";
  ctx.fillStyle = "#d8ffff";
  ctx.fillText("EXP", 100, 558);

  // Fond barre
  roundRect(ctx, 230, 525, 1100, 35, 18);

  ctx.fillStyle = "#0b2230";
  ctx.fill();

  // Progression
  const gradient = ctx.createLinearGradient(230, 0, 1330, 0);

  gradient.addColorStop(0, "#00e5ff");
  gradient.addColorStop(0.5, "#5e9dff");
  gradient.addColorStop(1, "#8effff");

  roundRect(
    ctx,
    230,
    525,
    1100 * progress,
    35,
    18
  );

  ctx.fillStyle = gradient;
  ctx.fill();

  // ===== STATS =====

  drawPanel(ctx, 70, 620, 700, 240);

  ctx.font = "bold 36px sans-serif";
  ctx.fillStyle = "#bfffff";
  ctx.fillText("STATISTIQUES", 100, 670);

  ctx.font = "32px sans-serif";
  ctx.fillStyle = "#8defff";
  ctx.fillText(`XP: ${currentXP} / ${requiredXP}`, 100, 720);
  ctx.fillText(`Messages: ${messages}`, 100, 770);
  ctx.fillText(`Temps: ${timeSpent}`, 100, 820);

  // ===== STREAK =====

  drawPanel(ctx, 830, 620, 700, 240);

  ctx.font = "bold 36px sans-serif";
  ctx.fillStyle = "#bfffff";
  ctx.fillText("ACTIVITÉ", 860, 670);

  ctx.font = "32px sans-serif";
  ctx.fillStyle = "#8defff";
  ctx.fillText(`Série: ${streak}`, 860, 720);
  ctx.fillText(`Prochain niveau: ${nextLevel}`, 860, 770);
  ctx.fillText(`XP restant: ${remainingXP}`, 860, 820);

  // ===== FOOTER =====

  ctx.font = "bold 38px sans-serif";
  ctx.fillStyle = "#7d8cff";
  ctx.fillText(`Généré pour ${username}`, 90, 880);

  return canvas.toBuffer();
};

// ===== FONCTIONS UTILITAIRES =====

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(0, 20, 40, 0.8)";
  roundRect(ctx, x, y, w, h, 15);
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 229, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSmallPanel(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(0, 30, 60, 0.7)";
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();
}
