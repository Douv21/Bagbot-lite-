const { AttachmentBuilder } = require("discord.js");

let Canvas, sharp;
try {
  Canvas = require("canvas");
  sharp = require("sharp");
} catch (e) {
  console.warn("⚠️  canvas/sharp indisponible — /niveau désactivé. Lancez 'npm rebuild canvas' sur le serveur.");
  module.exports = async () => null;
  return;
}

const path = require("path");

function getRankName(level) {
  if (level < 5)  return 'NOVICE';
  if (level < 10) return 'BRONZE '  + romanSuffix(level - 5,  5);
  if (level < 20) return 'ARGENT '  + romanSuffix(level - 10, 10);
  if (level < 30) return 'OR '      + romanSuffix(level - 20, 10);
  if (level < 40) return 'PLATINE ' + romanSuffix(level - 30, 10);
  if (level < 50) return 'DIAMANT ' + romanSuffix(level - 40, 10);
  if (level < 60) return 'MAÎTRE';
  if (level < 75) return 'GRAND MAÎTRE';
  return 'CHALLENGER';
}
function romanSuffix(diff, range) {
  const t = Math.floor(diff / (range / 3));
  return ['III','II','I'][Math.min(2, t)];
}

function getRankColors(rankName) {
  if (rankName.includes('BRONZE'))      return ['#cd7f32','#a05a2c'];
  if (rankName.includes('ARGENT'))      return ['#c0c0c0','#8a8a8a'];
  if (rankName.includes('OR'))          return ['#ffd700','#b8860b'];
  if (rankName.includes('PLATINE'))     return ['#e5e4e2','#7eb8c9'];
  if (rankName.includes('DIAMANT'))     return ['#6ef7ff','#4a90d9'];
  if (rankName.includes('MAÎTRE'))      return ['#a855f7','#6a0dad'];
  if (rankName.includes('GRAND'))       return ['#ff6030','#ff2000'];
  if (rankName.includes('CHALLENGER')) return ['#ffd700','#ff2000'];
  return ['#7aaeff','#4466cc'];
}

module.exports = async (member, data) => {
  const canvas = Canvas.createCanvas(1600, 900);
  const ctx = canvas.getContext("2d");

  const username   = member.user.username;
  const discrim    = member.user.discriminator;
  const level      = data.level    || 0;
  const xp         = data.xp       || 0;
  const required   = data.required || 100;
  const messages   = data.messages     || 0;
  const voiceMin   = data.voiceMinutes || 0;
  const streak     = data.streak       || 0;
  const roleName   = (data.roleName || 'MEMBRE DU SERVEUR').toUpperCase();
  const nextLevel  = level + 1;
  const xpLeft     = Math.max(0, required - xp);
  const rankName   = getRankName(level);
  const progress   = Math.min(1, xp / Math.max(1, required));
  const [rc1, rc2] = getRankColors(rankName);

  const avatar = await Canvas.loadImage(
    member.user.displayAvatarURL({ extension: "png", size: 512 })
  );

  let serverLogo = null;
  try {
    const logoUrl = member.guild.iconURL({ extension: "png", size: 256 });
    if (logoUrl) serverLogo = await Canvas.loadImage(logoUrl);
  } catch (_) {}

  const bg = await Canvas.loadImage(path.join(__dirname, "Holographique.png"));
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(4, 8, 22, 0.68)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0, 200, 255, 0.055)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  holoPanel(ctx, 28, 28, 1544, 844);

  ctx.font = "bold 28px Orbitron, Arial";
  ctx.fillStyle = "rgba(140,210,255,0.5)";
  ctx.fillText("✦ DISCORD", 58, 95);

  const ax = 185, ay = 265, ar = 108;
  ctx.save();
  ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(avatar, ax - ar, ay - ar, ar * 2, ar * 2);
  ctx.restore();

  ctx.beginPath(); ctx.arc(ax, ay, ar + 9, 0, Math.PI * 2);
  ctx.strokeStyle = "#00f7ff"; ctx.lineWidth = 5;
  ctx.shadowColor = "#00f7ff"; ctx.shadowBlur = 35;
  ctx.stroke(); ctx.shadowBlur = 0;

  ctx.beginPath(); ctx.arc(ax + 76, ay + 74, 17, 0, Math.PI * 2);
  ctx.fillStyle = "#23c75b"; ctx.shadowColor = "#23c75b"; ctx.shadowBlur = 14;
  ctx.fill(); ctx.shadowBlur = 0;

  ctx.font = "bold 62px Orbitron, Arial";
  const ng = ctx.createLinearGradient(340, 180, 950, 230);
  ng.addColorStop(0, "#dffcff"); ng.addColorStop(0.5, "#a8d8ff"); ng.addColorStop(1, "#ffffff");
  ctx.fillStyle = ng;
  ctx.shadowColor = "#00f7ff"; ctx.shadowBlur = 16;
  ctx.fillText(username, 340, 228); ctx.shadowBlur = 0;

  ctx.font = "34px Orbitron, Arial";
  ctx.fillStyle = "#7aaeff";
  ctx.fillText(discrim && discrim !== '0' ? `#${discrim}` : '#0000', 345, 284);

  ctx.font = "bold 24px Orbitron, Arial";
  const badgeW = ctx.measureText(`✦ ${roleName}`).width + 32;
  holoPanel(ctx, 345, 304, badgeW, 40);
  ctx.fillStyle = "#b8ffff";
  ctx.fillText(`✦ ${roleName}`, 359, 330);

  holoPanel(ctx, 978, 54, 566, 316);
  ctx.font = "bold 48px Orbitron, Arial";
  ctx.fillStyle = "#b8ffff"; ctx.shadowColor = "#00f7ff"; ctx.shadowBlur = 12;
  ctx.fillText("NIVEAU", 1060, 142); ctx.shadowBlur = 0;

  const lvlStr = String(level);
  const lvlSize = lvlStr.length > 2 ? 130 : 190;
  ctx.font = `bold ${lvlSize}px Orbitron, Arial`;
  const lg = ctx.createLinearGradient(1040, 160, 1360, 360);
  lg.addColorStop(0, "#ffffff"); lg.addColorStop(0.3, "#6ef7ff");
  lg.addColorStop(0.7, "#8b7dff"); lg.addColorStop(1, "#ffffff");
  ctx.fillStyle = lg; ctx.shadowBlur = 55; ctx.shadowColor = "#00f7ff";
  ctx.fillText(lvlStr, 1055, 338); ctx.shadowBlur = 0;

  holoPanel(ctx, 54, 440, 1492, 82);
  ctx.font = "bold 32px Orbitron, Arial";
  ctx.fillStyle = "#bfffff";
  ctx.fillText("EXP", 76, 492);

  roundedRect(ctx, 198, 466, 1042, 26, 13);
  ctx.fillStyle = "#050d1a"; ctx.fill();

  if (progress > 0) {
    const bg2 = ctx.createLinearGradient(198, 0, 1240, 0);
    bg2.addColorStop(0, "#00f7ff"); bg2.addColorStop(0.5, "#7b68ff"); bg2.addColorStop(1, "#7dffff");
    roundedRect(ctx, 198, 466, Math.max(26, 1042 * progress), 26, 13);
    ctx.fillStyle = bg2; ctx.shadowBlur = 20; ctx.shadowColor = "#00ffff";
    ctx.fill(); ctx.shadowBlur = 0;
  }

  ctx.font = "bold 30px Orbitron, Arial"; ctx.fillStyle = "#bfffff";
  ctx.fillText(`${xp.toLocaleString('fr-FR')} / ${required.toLocaleString('fr-FR')} EXP`, 1258, 492);

  holoPanel(ctx, 54, 565, 480, 270);
  ctx.font = "bold 26px Orbitron, Arial"; ctx.fillStyle = "#8fc8ff";
  ctx.shadowColor = "#00f7ff"; ctx.shadowBlur = 8;
  ctx.fillText("☰ STATISTIQUES", 72, 608); ctx.shadowBlur = 0;

  const voiceDisplay = voiceMin >= 60 ? `${Math.floor(voiceMin/60)}h` : `${voiceMin}m`;
  const msgDisplay   = messages >= 1000 ? `${(messages/1000).toFixed(1)}K` : String(messages);
  const stats = [
    { label: "MESSAGES",   value: msgDisplay },
    { label: "TEMPS PASSÉ", value: voiceDisplay },
    { label: "SÉRIE",      value: `${streak} J` }
  ];
  stats.forEach((s, i) => {
    const sx = 74 + i * 154;
    ctx.font = "bold 18px Orbitron, Arial"; ctx.fillStyle = "#7aaeff";
    ctx.fillText(s.label.length > 9 ? s.label.slice(0,9) : s.label, sx, 658);
    ctx.font = "bold 38px Orbitron, Arial";
    const sg = ctx.createLinearGradient(sx, 668, sx + 130, 718);
    sg.addColorStop(0, "#6ef7ff"); sg.addColorStop(1, "#ffffff");
    ctx.fillStyle = sg;
    ctx.fillText(s.value, sx, 718);
  });
  ctx.font = "italic 16px Orbitron, Arial"; ctx.fillStyle = "rgba(180,240,255,0.35)";
  ctx.fillText("CHAQUE MESSAGE COMPTE.", 72, 796);
  ctx.fillText("CHAQUE MOMENT AUSSI.", 72, 816);

  holoPanel(ctx, 564, 565, 462, 270);
  ctx.font = "bold 26px Orbitron, Arial"; ctx.fillStyle = "#8fc8ff";
  ctx.shadowColor = "#00f7ff"; ctx.shadowBlur = 8;
  ctx.fillText("RANG ACTUEL", 594, 608); ctx.shadowBlur = 0;

  drawGem(ctx, 795, 700, rc1, rc2);

  ctx.textAlign = "center";
  ctx.font = "bold 32px Orbitron, Arial";
  const rg = ctx.createLinearGradient(594, 780, 1006, 800);
  rg.addColorStop(0, rc1); rg.addColorStop(1, rc2);
  ctx.fillStyle = rg; ctx.shadowColor = rc1; ctx.shadowBlur = 12;
  ctx.fillText(rankName, 795, 792); ctx.shadowBlur = 0;
  ctx.textAlign = "left";

  holoPanel(ctx, 1056, 565, 490, 270);
  ctx.font = "bold 26px Orbitron, Arial"; ctx.fillStyle = "#8fc8ff";
  ctx.shadowColor = "#00f7ff"; ctx.shadowBlur = 8;
  ctx.fillText("PROCHAIN NIVEAU", 1074, 608); ctx.shadowBlur = 0;

  drawSmallGem(ctx, 1103, 700);

  ctx.font = "bold 38px Orbitron, Arial";
  const nlg = ctx.createLinearGradient(1148, 660, 1510, 720);
  nlg.addColorStop(0, "#dffcff"); nlg.addColorStop(1, "#a07dff");
  ctx.fillStyle = nlg;
  ctx.fillText(`NIVEAU ${nextLevel}`, 1148, 705);
  ctx.font = "bold 30px Orbitron, Arial"; ctx.fillStyle = "#7aaeff";
  ctx.fillText(`${xpLeft.toLocaleString('fr-FR')} EXP`, 1148, 748);
  ctx.font = "22px Orbitron, Arial"; ctx.fillStyle = "rgba(180,240,255,0.5)";
  ctx.fillText("RESTANTES", 1148, 782);

  drawBarcode(ctx, 1515, 852);

  const final = await sharp(canvas.toBuffer("image/png")).sharpen().png().toBuffer();
  return new AttachmentBuilder(final, { name: "holographic-card.png" });
};

function drawGem(ctx, cx, cy, c1, c2) {
  const s = 54;
  const g = ctx.createLinearGradient(cx - s, cy - s, cx + s, cy + s);
  g.addColorStop(0, "#ffffff"); g.addColorStop(0.3, c1); g.addColorStop(1, c2);
  ctx.shadowColor = c1; ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.7, cy - s * 0.2);
  ctx.lineTo(cx + s * 0.7, cy + s * 0.25);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx - s * 0.7, cy + s * 0.25);
  ctx.lineTo(cx - s * 0.7, cy - s * 0.2);
  ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.4);
  ctx.lineTo(cx + s * 0.4, cy + s * 0.1);
  ctx.lineTo(cx, cy + s * 0.55);
  ctx.lineTo(cx - s * 0.4, cy + s * 0.1);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fill();
  ctx.shadowBlur = 0;
}

function drawSmallGem(ctx, cx, cy) {
  const s = 26;
  const g = ctx.createLinearGradient(cx - s, cy - s, cx + s, cy + s);
  g.addColorStop(0, "#ffffff"); g.addColorStop(0.4, "#6ef7ff"); g.addColorStop(1, "#8b7dff");
  ctx.shadowColor = "#00f7ff"; ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.7, cy - s * 0.2);
  ctx.lineTo(cx + s * 0.7, cy + s * 0.25);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx - s * 0.7, cy + s * 0.25);
  ctx.lineTo(cx - s * 0.7, cy - s * 0.2);
  ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBarcode(ctx, x, y) {
  const cols = ["rgba(0,255,255,0.6)", "rgba(160,90,255,0.5)", "rgba(0,200,255,0.3)"];
  const ws   = [2,4,2,6,2,3,5,2,4,2,6,3,2,4,2,3,5];
  let bx = x - ws.reduce((a,b) => a+b,0) - ws.length * 2;
  ws.forEach((w, i) => {
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(bx, y - 24, w, 18);
    bx += w + 2;
  });
}

function holoPanel(ctx, x, y, w, h) {
  roundedRect(ctx, x, y, w, h, 20);
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, "rgba(0,255,255,0.07)");
  g.addColorStop(0.5, "rgba(80,50,180,0.10)");
  g.addColorStop(1, "rgba(0,40,80,0.16)");
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = "rgba(0,220,255,0.5)"; ctx.lineWidth = 2;
  ctx.shadowBlur = 16; ctx.shadowColor = "#00ffff";
  ctx.stroke(); ctx.shadowBlur = 0;
}

function roundedRect(ctx, x, y, w, h, r) {
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
