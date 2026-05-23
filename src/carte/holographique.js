const Canvas = require("canvas");
const path = require("path");

module.exports = async (member, data) => {

  const canvas = Canvas.createCanvas(1600, 900);
  const ctx = canvas.getContext("2d");

  // =========================
  // DATA
  // =========================

  const username = member.user.username;

  const avatar = await Canvas.loadImage(
    member.user.displayAvatarURL({
      extension: "png",
      size: 512
    })
  );

  const serverLogo = await Canvas.loadImage(
    member.guild.iconURL({
      extension: "png",
      size: 512
    })
  );

  const level = data.level;
  const xp = data.xp;
  const required = data.required;
  const rank = data.rank;

  const progress = xp / required;

  // =========================
  // BACKGROUND
  // =========================

  const bg = await Canvas.loadImage(
    path.join(__dirname, "Holographique.png")
  );

  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // =========================
  // OVERLAY GRID
  // =========================

  ctx.fillStyle = "rgba(0,255,255,0.03)";

  for (let x = 0; x < canvas.width; x += 4) {
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // =========================
  // MAIN PANEL
  // =========================

  holographicPanel(
    ctx,
    40,
    40,
    1520,
    820
  );

  // =========================
  // AVATAR
  // =========================

  ctx.save();

  ctx.beginPath();
  ctx.arc(240, 270, 120, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    avatar,
    120,
    150,
    240,
    240
  );

  ctx.restore();

  // glow
  ctx.beginPath();
  ctx.arc(240, 270, 135, 0, Math.PI * 2);

  ctx.strokeStyle = "#00f7ff";
  ctx.lineWidth = 8;

  ctx.shadowColor = "#00f7ff";
  ctx.shadowBlur = 40;

  ctx.stroke();

  ctx.shadowBlur = 0;

  // =========================
  // USERNAME
  // =========================

  ctx.font = "bold 72px Orbitron";
  ctx.fillStyle = "#dffcff";

  ctx.fillText(username, 420, 260);

  ctx.font = "40px Orbitron";
  ctx.fillStyle = "#7aaeff";

  ctx.fillText(`#${member.user.discriminator}`, 425, 320);

  // =========================
  // LEVEL PANEL
  // =========================

  holographicPanel(
    ctx,
    980,
    70,
    500,
    300
  );

  ctx.font = "bold 50px Orbitron";
  ctx.fillStyle = "#b8ffff";

  ctx.fillText("NIVEAU", 1120, 140);

  ctx.font = "bold 190px Orbitron";

  const holo = ctx.createLinearGradient(
    1080,
    180,
    1300,
    350
  );

  holo.addColorStop(0, "#ffffff");
  holo.addColorStop(0.3, "#6ef7ff");
  holo.addColorStop(0.7, "#6b7dff");
  holo.addColorStop(1, "#ffffff");

  ctx.fillStyle = holo;

  ctx.shadowBlur = 50;
  ctx.shadowColor = "#00f7ff";

  ctx.fillText(level, 1080, 320);

  ctx.shadowBlur = 0;

  // =========================
  // XP BAR
  // =========================

  holographicPanel(
    ctx,
    70,
    460,
    1420,
    90
  );

  // bar background
  roundedRect(
    ctx,
    220,
    490,
    1100,
    28,
    15
  );

  ctx.fillStyle = "#09131f";
  ctx.fill();

  // bar fill
  const xpGradient = ctx.createLinearGradient(
    220,
    0,
    1320,
    0
  );

  xpGradient.addColorStop(0, "#00f7ff");
  xpGradient.addColorStop(0.5, "#7b68ff");
  xpGradient.addColorStop(1, "#7dffff");

  roundedRect(
    ctx,
    220,
    490,
    1100 * progress,
    28,
    15
  );

  ctx.fillStyle = xpGradient;

  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00ffff";

  ctx.fill();

  ctx.shadowBlur = 0;

  // text
  ctx.font = "40px Orbitron";
  ctx.fillStyle = "#bfffff";

  ctx.fillText(
    `${xp} / ${required} EXP`,
    1080,
    520
  );

  // =========================
  // SERVER LOGO
  // =========================

  ctx.save();

  ctx.beginPath();
  ctx.arc(800, 760, 85, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    serverLogo,
    715,
    675,
    170,
    170
  );

  ctx.restore();

  ctx.beginPath();
  ctx.arc(800, 760, 90, 0, Math.PI * 2);

  ctx.strokeStyle = "#ffd86b";
  ctx.lineWidth = 6;

  ctx.shadowBlur = 25;
  ctx.shadowColor = "#ffd86b";

  ctx.stroke();

  ctx.shadowBlur = 0;

  // =========================
  // RANK PANEL
  // =========================

  holographicPanel(
    ctx,
    610,
    590,
    380,
    190
  );

  ctx.font = "40px Orbitron";
  ctx.fillStyle = "#bfffff";

  ctx.fillText("RANG", 720, 650);

  ctx.font = "bold 75px Orbitron";
  ctx.fillStyle = "#6ef7ff";

  ctx.fillText(rank, 710, 740);

  // =========================
  // FOOTER
  // =========================

  ctx.font = "bold 60px Orbitron";
  ctx.fillStyle = "#d7ffff";

  ctx.fillText(
    "FÉLICITATIONS !",
    70,
    840
  );

  // =========================
  // EXPORT
  // =========================

  return canvas.toBuffer();

};

// =====================================
// HOLOGRAPHIC PANEL
// =====================================

function holographicPanel(
  ctx,
  x,
  y,
  w,
  h
) {

  roundedRect(ctx, x, y, w, h, 25);

  const gradient = ctx.createLinearGradient(
    x,
    y,
    x + w,
    y + h
  );

  gradient.addColorStop(
    0,
    "rgba(0,255,255,0.10)"
  );

  gradient.addColorStop(
    1,
    "rgba(0,50,90,0.25)"
  );

  ctx.fillStyle = gradient;

  ctx.fill();

  ctx.strokeStyle = "rgba(0,255,255,0.6)";
  ctx.lineWidth = 3;

  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00ffff";

  ctx.stroke();

  ctx.shadowBlur = 0;
}

// =====================================
// ROUNDED RECT
// =====================================

function roundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {

  ctx.beginPath();

  ctx.moveTo(x + radius, y);

  ctx.lineTo(x + width - radius, y);

  ctx.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + radius
  );

  ctx.lineTo(
    x + width,
    y + height - radius
  );

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
