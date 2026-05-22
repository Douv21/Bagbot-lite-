// npm i discord.js canvas node-fetch sharp
// Carte holographique futuriste Discord
// Compatible discord.js v14

const {
  AttachmentBuilder
} = require("discord.js");

const Canvas = require("canvas");

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

  ctx.font = "bold 36px sans-serif";
  ctx.fillStyle = "#9fe7ff";

  ctx.fillText(
    `${currentXP.toLocaleString()} / ${requiredXP.toLocaleString()} EXP`,
    1080,
    558
  );

  // ===== STATS =====

  drawPanel(ctx, 70, 640, 560, 200);

  ctx.font = "bold 38px sans-serif";
  ctx.fillStyle = "#c8ffff";

  ctx.fillText("STATISTIQUES", 95, 690);

  // Messages
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#76f7ff";

  ctx.fillText("MESSAGES", 100, 760);

  ctx.font = "bold 52px sans-serif";
  ctx.fillStyle = "#ffffff";

  ctx.fillText(messages.toString(), 100, 815);

  // Temps
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#76f7ff";

  ctx.fillText("TEMPS", 300, 760);

  ctx.font = "bold 52px sans-serif";
  ctx.fillStyle = "#ffffff";

  ctx.fillText(timeSpent, 300, 815);

  // Série
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#76f7ff";

  ctx.fillText("SÉRIE", 470, 760);

  ctx.font = "bold 52px sans-serif";
  ctx.fillStyle = "#ffffff";

  ctx.fillText(streak, 470, 815);

  // ===== PROCHAIN NIVEAU =====

  drawPanel(ctx, 720, 640, 420, 200);

  ctx.font = "bold 38px sans-serif";
  ctx.fillStyle = "#c8ffff";

  ctx.fillText("PROCHAIN NIVEAU", 760, 695);

  ctx.font = "bold 80px sans-serif";
  ctx.fillStyle = "#5ef7ff";

  ctx.fillText(nextLevel, 770, 790);

  ctx.font = "bold 40px sans-serif";
  ctx.fillStyle = "#ffffff";

  ctx.fillText(`${remainingXP} EXP`, 910, 790);

  // ===== FOOTER =====

  ctx.font = "bold 64px sans-serif";
  ctx.fillStyle = "#9ffcff";

  ctx.fillText("FÉLICITATIONS !", 70, 885);

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
