// Standalone card worker — runs as a child process.
// Reads JSON from stdin, writes PNG buffer to stdout.
// If canvas/sharp cause SIGILL, only this process dies; the bot survives.

const Canvas = require('canvas');
const sharp  = require('sharp');

// ─── Helpers ────────────────────────────────────────────────────────────────

function getRankName(level) {
  if (level < 5)  return 'NOVICE';
  if (level < 10) return 'BRONZE '  + romanTier(level - 5,  5,  3);
  if (level < 20) return 'ARGENT '  + romanTier(level - 10, 10, 3);
  if (level < 30) return 'OR '      + romanTier(level - 20, 10, 3);
  if (level < 40) return 'PLATINE ' + romanTier(level - 30, 10, 3);
  if (level < 50) return 'DIAMANT ' + romanTier(level - 40, 10, 3);
  if (level < 60) return 'MAÎTRE';
  if (level < 75) return 'GRAND MAÎTRE';
  return 'CHALLENGER';
}
function romanTier(d, r, s) {
  return ['III','II','I'][Math.min(s - 1, Math.floor(d / (r / s)))];
}
function gemPalette(name) {
  if (name.includes('BRONZE'))     return ['#ffd090','#c07820','#804010','#ffb050'];
  if (name.includes('ARGENT'))     return ['#ffffff','#c0c8d8','#8090a8','#e0e8f8'];
  if (name.includes('OR'))         return ['#fff0a0','#ffd700','#a07800','#ffe860'];
  if (name.includes('PLATINE'))    return ['#e0f4ff','#a0d0f0','#4090c0','#c0e8ff'];
  if (name.includes('DIAMANT'))    return ['#c0f8ff','#60c8ff','#1060c8','#80e8ff'];
  if (name.includes('MAÎTRE'))     return ['#e8c0ff','#a040e0','#600090','#d080ff'];
  if (name.includes('GRAND'))      return ['#ffc080','#ff4010','#a00000','#ff8040'];
  if (name.includes('CHALLENGER')) return ['#fff080','#ff8020','#cc0000','#ffcc40'];
  return ['#c0e8ff','#6090d0','#304880','#90c0f0'];
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

function poly(ctx, pts, grad) {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  pts.slice(1).forEach(p => ctx.lineTo(...p));
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
}
function lerpGrad(ctx, x1, y1, x2, y2, colors) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
  return g;
}
function drawPanel(ctx, x, y, w, h) {
  roundedRect(ctx, x, y, w, h, 18);
  const bg = ctx.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, 'rgba(6,16,44,0.94)');
  bg.addColorStop(1, 'rgba(4,10,32,0.94)');
  ctx.fillStyle = bg; ctx.fill();
  roundedRect(ctx, x, y, w, h, 18);
  const ig = ctx.createLinearGradient(x, y, x + w, y + h);
  ig.addColorStop(0, 'rgba(0,180,255,0.05)');
  ig.addColorStop(1, 'rgba(80,0,200,0.04)');
  ctx.fillStyle = ig; ctx.fill();
  roundedRect(ctx, x, y, w, h, 18);
  ctx.strokeStyle = 'rgba(0,180,255,0.45)'; ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00c8ff'; ctx.shadowBlur = 10;
  ctx.stroke(); ctx.shadowBlur = 0;
}
function drawCrystalGem(ctx, cx, cy, s, pal) {
  const [hi, mid, dark, glow] = pal;
  ctx.shadowColor = glow; ctx.shadowBlur = 28;
  poly(ctx, [[cx,cy-s],[cx-s*0.62,cy-s*0.18],[cx-s*0.28,cy+s*0.10]],
    lerpGrad(ctx, cx-s*0.6,cy-s, cx,cy+s*0.1, [hi,'rgba(255,255,255,0.8)',mid]));
  poly(ctx, [[cx,cy-s],[cx+s*0.62,cy-s*0.18],[cx+s*0.28,cy+s*0.10]],
    lerpGrad(ctx, cx,cy-s, cx+s*0.6,cy+s*0.1, ['rgba(255,255,255,0.9)',hi,mid]));
  poly(ctx, [[cx,cy-s],[cx-s*0.28,cy+s*0.10],[cx+s*0.28,cy+s*0.10]],
    lerpGrad(ctx, cx,cy-s, cx,cy+s*0.1, ['rgba(255,255,255,0.95)',hi]));
  poly(ctx, [[cx-s*0.62,cy-s*0.18],[cx-s*0.72,cy+s*0.10],[cx-s*0.28,cy+s*0.10]],
    lerpGrad(ctx, cx-s*0.7,cy-s*0.1, cx-s*0.3,cy+s*0.1, [mid,dark]));
  poly(ctx, [[cx+s*0.62,cy-s*0.18],[cx+s*0.72,cy+s*0.10],[cx+s*0.28,cy+s*0.10]],
    lerpGrad(ctx, cx+s*0.3,cy-s*0.1, cx+s*0.7,cy+s*0.1, [hi,mid]));
  poly(ctx, [[cx-s*0.72,cy+s*0.10],[cx-s*0.28,cy+s*0.10],[cx,cy+s]],
    lerpGrad(ctx, cx-s*0.7,cy+s*0.1, cx,cy+s, [mid,dark]));
  poly(ctx, [[cx+s*0.72,cy+s*0.10],[cx+s*0.28,cy+s*0.10],[cx,cy+s]],
    lerpGrad(ctx, cx+s*0.3,cy+s*0.1, cx,cy+s, [hi,mid]));
  poly(ctx, [[cx-s*0.28,cy+s*0.10],[cx+s*0.28,cy+s*0.10],[cx,cy+s]],
    lerpGrad(ctx, cx,cy+s*0.1, cx,cy+s, [mid,dark]));
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.55;
  poly(ctx, [[cx-s*0.05,cy-s*0.95],[cx-s*0.35,cy-s*0.15],[cx-s*0.05,cy-s*0.05]],
    lerpGrad(ctx, cx-s*0.2,cy-s, cx,cy-s*0.1, ['rgba(255,255,255,0.9)','rgba(255,255,255,0)']));
  ctx.globalAlpha = 1.0;
}
function drawBarcode(ctx, x, y) {
  const ws = [2,4,2,6,2,3,5,2,4,2,6,3,2,4,2,3,5,2,3,4];
  const cs = ['rgba(0,200,255,0.6)','rgba(140,80,255,0.5)','rgba(0,160,255,0.35)'];
  let bx = x - ws.reduce((a,b) => a+b,0) - ws.length * 2;
  ws.forEach((w, i) => {
    ctx.fillStyle = cs[i % cs.length];
    ctx.fillRect(bx, y - 22, w, 16); bx += w + 2;
  });
}
function drawDiscordLogo(ctx, x, y, size) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#7289da'; ctx.shadowBlur = 8;
  ctx.font = `bold ${size}px Arial`;
  ctx.fillText('⊹', x, y + size * 0.82);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function run() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  const { username, discriminator, avatarUrl, data } = JSON.parse(raw);

  const W = 1400, H = 800;
  const canvas = Canvas.createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const level    = data.level    || 0;
  const xp       = data.xp       || 0;
  const required = data.required || 100;
  const messages = data.messages     || 0;
  const voiceMin = data.voiceMinutes || 0;
  const streak   = data.streak       || 0;
  const roleName = (data.roleName || 'MEMBRE DU SERVEUR').toUpperCase();
  const nextLvl  = level + 1;
  const xpLeft   = Math.max(0, required - xp);
  const pct      = Math.min(1, xp / Math.max(1, required));
  const rankName = getRankName(level);
  const pal      = gemPalette(rankName);

  const avatar = await Canvas.loadImage(avatarUrl);

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#040a1e'; ctx.fillRect(0, 0, W, H);
  const a1 = ctx.createRadialGradient(120, 80, 0, 120, 80, 420);
  a1.addColorStop(0,'rgba(80,40,180,0.55)'); a1.addColorStop(0.3,'rgba(0,120,200,0.35)');
  a1.addColorStop(0.6,'rgba(0,200,180,0.15)'); a1.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = a1; ctx.fillRect(0, 0, W, H);
  const a2 = ctx.createRadialGradient(W-200, 100, 0, W-200, 100, 500);
  a2.addColorStop(0,'rgba(140,0,200,0.45)'); a2.addColorStop(0.25,'rgba(0,100,220,0.35)');
  a2.addColorStop(0.5,'rgba(0,200,255,0.20)'); a2.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = a2; ctx.fillRect(0, 0, W, H);
  const a3 = ctx.createRadialGradient(W*0.5, H, 0, W*0.5, H, 300);
  a3.addColorStop(0,'rgba(0,80,160,0.30)'); a3.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = a3; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.strokeStyle = 'rgba(60,140,255,0.06)'; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 38) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 38) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.restore();

  // ── Card border + corners ─────────────────────────────────────────────────
  const CX = 22, CY = 22, CW = W - 44, CH = H - 44, CR = 24;
  ctx.save(); roundedRect(ctx, CX, CY, CW, CH, CR);
  ctx.strokeStyle = 'rgba(0,200,255,0.4)'; ctx.lineWidth = 3;
  ctx.shadowColor = '#00c8ff'; ctx.shadowBlur = 30; ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
  const bLen = 38, bT = 3;
  const corners = [[CX,CY],[CX+CW,CY],[CX,CY+CH],[CX+CW,CY+CH]];
  const dirs    = [[1,1],[-1,1],[1,-1],[-1,-1]];
  ctx.strokeStyle = '#00e8ff'; ctx.lineWidth = bT;
  ctx.shadowColor = '#00e8ff'; ctx.shadowBlur = 10;
  corners.forEach(([cx,cy],i) => {
    const [dx,dy] = dirs[i];
    ctx.beginPath();
    ctx.moveTo(cx+dx*bLen,cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+dy*bLen); ctx.stroke();
  }); ctx.shadowBlur = 0;

  // ── Discord logo ──────────────────────────────────────────────────────────
  drawDiscordLogo(ctx, 48, 48, 36);
  ctx.font = 'bold 28px Orbitron, Arial'; ctx.fillStyle = '#ffffff';
  ctx.fillText('DISCORD', 96, 76);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const ax = 180, ay = 270, ar = 108;
  const ringGrad = ctx.createLinearGradient(ax-ar-12,ay-ar-12,ax+ar+12,ay+ar+12);
  ringGrad.addColorStop(0,'#ff88cc'); ringGrad.addColorStop(0.18,'#cc88ff');
  ringGrad.addColorStop(0.36,'#88aaff'); ringGrad.addColorStop(0.50,'#00eeff');
  ringGrad.addColorStop(0.64,'#88ffcc'); ringGrad.addColorStop(0.80,'#cc88ff');
  ringGrad.addColorStop(1,'#ff88cc');
  ctx.beginPath(); ctx.arc(ax, ay, ar+14, 0, Math.PI*2);
  ctx.strokeStyle = ringGrad; ctx.lineWidth = 14;
  ctx.shadowColor = '#60c0ff'; ctx.shadowBlur = 22; ctx.stroke(); ctx.shadowBlur = 0;
  [Math.PI*0.25,Math.PI*0.75,Math.PI*1.25,Math.PI*1.75].forEach(angle => {
    const r1 = ar+6, r2 = ar+22;
    ctx.beginPath();
    ctx.moveTo(ax+Math.cos(angle)*r1, ay+Math.sin(angle)*r1);
    ctx.lineTo(ax+Math.cos(angle)*r2, ay+Math.sin(angle)*r2);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00eeff'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
  });
  ctx.save(); ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI*2); ctx.clip();
  ctx.drawImage(avatar, ax-ar, ay-ar, ar*2, ar*2); ctx.restore();
  ctx.beginPath(); ctx.arc(ax+74, ay+72, 15, 0, Math.PI*2);
  ctx.fillStyle = '#2ecc71'; ctx.shadowColor = '#2ecc71'; ctx.shadowBlur = 14;
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(ax+74, ay+72, 15, 0, Math.PI*2);
  ctx.strokeStyle = '#050e22'; ctx.lineWidth = 3; ctx.stroke();

  // ── Username + role ───────────────────────────────────────────────────────
  const nameX = 324;
  let namePx = 68; ctx.font = `bold ${namePx}px Orbitron, Arial`;
  while (ctx.measureText(username).width > 480 && namePx > 30) {
    namePx -= 2; ctx.font = `bold ${namePx}px Orbitron, Arial`;
  }
  ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#a0c8ff'; ctx.shadowBlur = 16;
  ctx.fillText(username, nameX, 220); ctx.shadowBlur = 0;
  ctx.font = '30px Orbitron, Arial'; ctx.fillStyle = '#6080a0';
  ctx.fillText(discriminator && discriminator !== '0' ? `#${discriminator}` : '#0000', nameX+2, 268);
  ctx.font = 'bold 21px Orbitron, Arial';
  const badgeTxt = `  ✦  ${roleName}  `;
  const bw = ctx.measureText(badgeTxt).width;
  roundedRect(ctx, nameX, 282, bw, 40, 20);
  const bg2 = ctx.createLinearGradient(nameX, 282, nameX+bw, 322);
  bg2.addColorStop(0,'rgba(0,180,255,0.18)'); bg2.addColorStop(1,'rgba(80,0,200,0.18)');
  ctx.fillStyle = bg2; ctx.fill();
  roundedRect(ctx, nameX, 282, bw, 40, 20);
  ctx.strokeStyle = 'rgba(0,200,255,0.6)'; ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00c8ff'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#a0e8ff'; ctx.fillText(badgeTxt, nameX, 310);

  // ── Niveau panel ──────────────────────────────────────────────────────────
  const NX = 860, NY = 40, NW = 510, NH = 350;
  roundedRect(ctx, NX, NY, NW, NH, 20);
  const nbg = ctx.createLinearGradient(NX, NY, NX+NW, NY+NH);
  nbg.addColorStop(0,'rgba(10,20,60,0.92)'); nbg.addColorStop(1,'rgba(5,10,40,0.92)');
  ctx.fillStyle = nbg; ctx.fill();
  const nBLen = 50;
  ctx.strokeStyle = 'rgba(0,200,255,0.55)'; ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00c8ff'; ctx.shadowBlur = 12;
  [[NX,NY],[NX+NW,NY],[NX,NY+NH],[NX+NW,NY+NH]].forEach(([cx,cy],i) => {
    const [dx,dy] = dirs[i];
    ctx.beginPath();
    ctx.moveTo(cx+dx*nBLen,cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+dy*nBLen); ctx.stroke();
  }); ctx.shadowBlur = 0;
  ctx.font = 'bold 44px Orbitron, Arial'; ctx.fillStyle = '#a0d8ff';
  ctx.shadowColor = '#00c8ff'; ctx.shadowBlur = 10;
  ctx.fillText('NIVEAU', NX+36, NY+76); ctx.shadowBlur = 0;
  ['✦','+','✦'].forEach((s,i) => {
    ctx.font = `${i===1?22:16}px Orbitron, Arial`;
    ctx.fillStyle = `rgba(0,200,255,${i===1?0.6:0.4})`;
    ctx.fillText(s, NX+290+i*38, NY+68);
  });
  const lvlStr = String(level);
  const lvlPx = lvlStr.length > 2 ? 160 : 210;
  ctx.font = `bold ${lvlPx}px Orbitron, Arial`;
  const lvlMw = ctx.measureText(lvlStr).width;
  const lvlStartX = NX + (NW - lvlMw) / 2;
  const lvlGrad = ctx.createLinearGradient(lvlStartX, NY+100, lvlStartX+lvlMw, NY+NH-20);
  lvlGrad.addColorStop(0,'#e0f0ff'); lvlGrad.addColorStop(0.15,'#a0b8ff');
  lvlGrad.addColorStop(0.30,'#c080ff'); lvlGrad.addColorStop(0.48,'#ff80cc');
  lvlGrad.addColorStop(0.64,'#80d8ff'); lvlGrad.addColorStop(0.80,'#a0e8cc');
  lvlGrad.addColorStop(1,'#e0f8ff');
  ctx.fillStyle = lvlGrad; ctx.shadowColor = '#60a8ff'; ctx.shadowBlur = 50;
  ctx.fillText(lvlStr, lvlStartX, NY+NH-30); ctx.shadowBlur = 0;

  // ── EXP bar ───────────────────────────────────────────────────────────────
  const EX = 42, EY = 418, EW = W-84, EH = 62;
  roundedRect(ctx, EX, EY, EW, EH, 14);
  const ebg = ctx.createLinearGradient(EX, EY, EX+EW, EY+EH);
  ebg.addColorStop(0,'rgba(5,12,32,0.95)'); ebg.addColorStop(1,'rgba(8,16,40,0.95)');
  ctx.fillStyle = ebg; ctx.fill();
  roundedRect(ctx, EX, EY, EW, EH, 14);
  ctx.strokeStyle = 'rgba(0,180,255,0.4)'; ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00c8ff'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.font = 'bold 26px Orbitron, Arial'; ctx.fillStyle = '#80b8e0';
  ctx.fillText('EXP', EX+18, EY+40);
  const bX = EX+80, bY = EY+14, bW = EW-90-320, bH = EH-28;
  roundedRect(ctx, bX, bY, bW, bH, bH/2);
  ctx.fillStyle = 'rgba(0,8,24,0.9)'; ctx.fill();
  if (pct > 0) {
    const fw = Math.max(bH, bW*pct);
    const fg = ctx.createLinearGradient(bX, 0, bX+fw, 0);
    fg.addColorStop(0,'#ff80cc'); fg.addColorStop(0.18,'#cc80ff');
    fg.addColorStop(0.36,'#80aaff'); fg.addColorStop(0.52,'#00eeff');
    fg.addColorStop(0.70,'#80ffcc'); fg.addColorStop(0.86,'#cc80ff');
    fg.addColorStop(1,'#ff80cc');
    roundedRect(ctx, bX, bY, fw, bH, bH/2);
    ctx.fillStyle = fg; ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 20;
    ctx.fill(); ctx.shadowBlur = 0;
  }
  ctx.font = 'bold 26px Orbitron, Arial'; ctx.fillStyle = '#90c8e8';
  ctx.textAlign = 'right';
  ctx.fillText(`${xp.toLocaleString('fr-FR')} / ${required.toLocaleString('fr-FR')} EXP`, EX+EW-18, EY+40);
  ctx.textAlign = 'left';

  // ── Bottom 3 panels ───────────────────────────────────────────────────────
  const PY = 506, PH = H-PY-48;
  const PW = (W-84-24)/3;
  const p1x = 42, p2x = p1x+PW+12, p3x = p2x+PW+12;

  // Stats panel
  drawPanel(ctx, p1x, PY, PW, PH);
  ctx.font = 'bold 22px Orbitron, Arial'; ctx.fillStyle = '#70b8ff';
  ctx.shadowColor = '#00c8ff'; ctx.shadowBlur = 6;
  ctx.fillText('☰  STATISTIQUES', p1x+18, PY+34); ctx.shadowBlur = 0;
  const voiceStr = voiceMin >= 60 ? `${Math.floor(voiceMin/60)}h` : `${voiceMin}m`;
  const msgStr   = messages >= 10000 ? `${Math.floor(messages/1000)}K`
                 : messages >= 1000  ? `${(messages/1000).toFixed(1)}K` : String(messages);
  const statsData = [
    { icon:'💬', label:'MESSAGES',    value: msgStr },
    { icon:'🕐', label:'TEMPS PASSÉ', value: voiceStr },
    { icon:'🔥', label:'SÉRIE',       value: `${streak} JOURS` }
  ];
  const colW = PW/3;
  statsData.forEach((s,i) => {
    const sx = p1x+14+i*colW;
    ctx.font = '26px Arial'; ctx.fillStyle = '#a0d0ff'; ctx.fillText(s.icon, sx, PY+74);
    ctx.font = '16px Orbitron, Arial'; ctx.fillStyle = 'rgba(120,180,255,0.7)'; ctx.fillText(s.label, sx, PY+98);
    ctx.font = 'bold 32px Orbitron, Arial';
    const sg = ctx.createLinearGradient(sx, PY+100, sx+colW-10, PY+140);
    sg.addColorStop(0,'#6ef7ff'); sg.addColorStop(1,'#ffffff'); ctx.fillStyle = sg;
    ctx.fillText(s.value, sx, PY+136);
  });
  ctx.font = 'italic 14px Orbitron, Arial'; ctx.fillStyle = 'rgba(100,160,255,0.38)';
  ctx.fillText('CHAQUE MESSAGE COMPTE.', p1x+14, PY+PH-22);
  ctx.fillText('CHAQUE MOMENT AUSSI.', p1x+14, PY+PH-6);

  // Rang panel
  drawPanel(ctx, p2x, PY, PW, PH);
  ctx.font = 'bold 22px Orbitron, Arial'; ctx.fillStyle = '#70b8ff';
  ctx.shadowColor = '#00c8ff'; ctx.shadowBlur = 6;
  ctx.fillText('RANG ACTUEL', p2x+PW/2-ctx.measureText('RANG ACTUEL').width/2, PY+34);
  ctx.shadowBlur = 0;
  const gemCx = p2x+PW/2, gemCy = PY+PH/2-12;
  drawCrystalGem(ctx, gemCx, gemCy, 60, pal);
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px Orbitron, Arial';
  const rnG = ctx.createLinearGradient(p2x, PY+PH-48, p2x+PW, PY+PH-28);
  rnG.addColorStop(0, pal[0]); rnG.addColorStop(1, pal[1]);
  ctx.fillStyle = rnG; ctx.shadowColor = pal[0]; ctx.shadowBlur = 14;
  ctx.fillText(rankName, gemCx, PY+PH-26); ctx.shadowBlur = 0;
  ctx.textAlign = 'left';

  // Prochain niveau panel
  drawPanel(ctx, p3x, PY, PW, PH);
  ctx.font = 'bold 22px Orbitron, Arial'; ctx.fillStyle = '#70b8ff';
  ctx.shadowColor = '#00c8ff'; ctx.shadowBlur = 6;
  ctx.fillText('PROCHAIN NIVEAU', p3x+18, PY+34); ctx.shadowBlur = 0;
  drawCrystalGem(ctx, p3x+60, PY+PH/2-8, 34, pal);
  ctx.font = 'bold 38px Orbitron, Arial';
  const nlG = ctx.createLinearGradient(p3x+98, PY+80, p3x+PW, PY+130);
  nlG.addColorStop(0,'#e0f4ff'); nlG.addColorStop(1,'#a060ff');
  ctx.fillStyle = nlG; ctx.fillText(`NIVEAU ${nextLvl}`, p3x+98, PY+118);
  ctx.font = 'bold 28px Orbitron, Arial'; ctx.fillStyle = '#5080b8';
  ctx.fillText(`${xpLeft.toLocaleString('fr-FR')} EXP`, p3x+98, PY+158);
  ctx.font = '20px Orbitron, Arial'; ctx.fillStyle = 'rgba(120,160,220,0.6)';
  ctx.fillText('RESTANTES', p3x+98, PY+188);

  // Barcode
  drawBarcode(ctx, W-48, H-30);

  // ── Export ────────────────────────────────────────────────────────────────
  const buf = await sharp(canvas.toBuffer('image/png')).sharpen().png().toBuffer();
  process.stdout.write(buf);
  process.exit(0);
}

run().catch(err => {
  process.stderr.write('card-worker error: ' + err.message + '\n');
  process.exit(1);
});
