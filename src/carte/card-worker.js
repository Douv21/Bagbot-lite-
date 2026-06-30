// Standalone card worker — runs as a child process.
// Reads JSON from stdin, writes PNG buffer to stdout.
// Uses canvas (node-canvas) with registered system fonts.

const { createCanvas, loadImage, registerFont } = require('canvas');

// Enregistrer les polices système Linux
registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', { family: 'DejaVu Sans', weight: 'bold' });
registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', { family: 'DejaVu Sans', weight: 'normal' });
registerFont('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', { family: 'Liberation Sans', weight: 'bold' });
registerFont('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', { family: 'Liberation Sans', weight: 'normal' });

// ─── Themes ───────────────────────────────────────────────────────────────────

function getTheme(name) {
  const t = (name || 'holographique').toLowerCase();
  const themes = {
    holographique: {
      bg1: '#040a1e', bg2: '#060f28',
      aura1: ['rgba(80,40,180,0.55)','rgba(0,120,200,0.35)','rgba(0,200,180,0.15)'],
      aura2: ['rgba(140,0,200,0.45)','rgba(0,100,220,0.35)','rgba(0,200,255,0.20)'],
      border: 'rgba(0,200,255,0.4)', borderGlow: '#00c8ff',
      corner: '#00e8ff', cornerGlow: '#00e8ff',
      ringColors: ['#ff88cc','#cc88ff','#88aaff','#00eeff','#88ffcc','#cc88ff','#ff88cc'],
      barColors: ['#ff80cc','#cc80ff','#80aaff','#00eeff','#80ffcc','#cc80ff','#ff80cc'],
      levelColors: ['#e0f0ff','#a0b8ff','#c080ff','#ff80cc','#80d8ff','#a0e8cc','#e0f8ff'],
      levelGlow: '#60a8ff',
      panelBg1: 'rgba(6,16,44,0.94)', panelBg2: 'rgba(4,10,32,0.94)',
      panelBorder: 'rgba(0,180,255,0.45)', panelGlow: '#00c8ff',
      titleColor: '#a0d8ff', titleGlow: '#00c8ff',
      statColor: '#6ef7ff', grid: 'rgba(60,140,255,0.06)',
      gemOverride: null,
    },
    gaming: {
      bg1: '#0a0a0a', bg2: '#111118',
      aura1: ['rgba(0,255,80,0.45)','rgba(0,180,60,0.25)','rgba(0,255,100,0.10)'],
      aura2: ['rgba(255,100,0,0.40)','rgba(200,50,0,0.25)','rgba(255,180,0,0.15)'],
      border: 'rgba(0,255,80,0.55)', borderGlow: '#00ff50',
      corner: '#00ff50', cornerGlow: '#00ff50',
      ringColors: ['#00ff50','#80ff00','#ffff00','#ff8000','#ff4000','#ff0080','#00ff50'],
      barColors: ['#00ff50','#80ff00','#ffff00','#ff8000','#ff4000','#ff0080','#00ff50'],
      levelColors: ['#ffffff','#80ff80','#00ff50','#ffff00','#ff8000','#80ff80','#ffffff'],
      levelGlow: '#00ff50',
      panelBg1: 'rgba(0,20,5,0.94)', panelBg2: 'rgba(0,10,3,0.94)',
      panelBorder: 'rgba(0,255,80,0.45)', panelGlow: '#00ff50',
      titleColor: '#80ff80', titleGlow: '#00ff50',
      statColor: '#00ff80', grid: 'rgba(0,255,80,0.05)',
      gemOverride: ['#80ff80','#00cc40','#005020','#00ff50'],
    },
    love: {
      bg1: '#1a0010', bg2: '#120008',
      aura1: ['rgba(255,80,150,0.55)','rgba(200,40,100,0.35)','rgba(255,150,200,0.15)'],
      aura2: ['rgba(255,40,120,0.45)','rgba(180,0,80,0.30)','rgba(255,100,180,0.20)'],
      border: 'rgba(255,80,160,0.55)', borderGlow: '#ff50a0',
      corner: '#ff80c0', cornerGlow: '#ff50a0',
      ringColors: ['#ff80c0','#ff40a0','#ff0080','#ff80c0','#ffb0d8','#ff40a0','#ff80c0'],
      barColors: ['#ff80c0','#ff40a0','#ff0080','#ff80c0','#ffb0d8','#ff40a0','#ff80c0'],
      levelColors: ['#ffe0f0','#ffb0d8','#ff80c0','#ff40a0','#ff0080','#ffb0d8','#ffe0f0'],
      levelGlow: '#ff50a0',
      panelBg1: 'rgba(40,5,20,0.94)', panelBg2: 'rgba(30,3,15,0.94)',
      panelBorder: 'rgba(255,80,160,0.45)', panelGlow: '#ff50a0',
      titleColor: '#ffb0d8', titleGlow: '#ff50a0',
      statColor: '#ffb0d8', grid: 'rgba(255,80,160,0.05)',
      gemOverride: ['#ffb0d8','#ff40a0','#cc0060','#ff80c0'],
    },
    sensuel: {
      bg1: '#150010', bg2: '#0d0008',
      aura1: ['rgba(180,0,120,0.55)','rgba(120,0,80,0.35)','rgba(220,80,180,0.15)'],
      aura2: ['rgba(100,0,60,0.50)','rgba(200,0,100,0.30)','rgba(255,60,160,0.20)'],
      border: 'rgba(200,0,120,0.55)', borderGlow: '#cc0080',
      corner: '#cc0080', cornerGlow: '#ff0090',
      ringColors: ['#cc0080','#990060','#660040','#cc0080','#ff40a0','#990060','#cc0080'],
      barColors: ['#ff40a0','#cc0080','#990060','#660040','#cc0080','#ff40a0','#cc0080'],
      levelColors: ['#ffc0e0','#ff80c0','#cc0080','#990060','#660040','#ff80c0','#ffc0e0'],
      levelGlow: '#cc0080',
      panelBg1: 'rgba(30,0,18,0.96)', panelBg2: 'rgba(20,0,12,0.96)',
      panelBorder: 'rgba(200,0,120,0.50)', panelGlow: '#cc0080',
      titleColor: '#ff80c0', titleGlow: '#cc0080',
      statColor: '#ff80c0', grid: 'rgba(200,0,120,0.04)',
      gemOverride: ['#ff80c0','#cc0080','#660040','#ff40a0'],
    },
    cosmos: {
      bg1: '#010112', bg2: '#00010e',
      aura1: ['rgba(60,0,180,0.55)','rgba(100,0,200,0.35)','rgba(180,80,255,0.15)'],
      aura2: ['rgba(0,20,180,0.45)','rgba(40,0,160,0.30)','rgba(120,60,255,0.20)'],
      border: 'rgba(140,60,255,0.55)', borderGlow: '#8c3cff',
      corner: '#a060ff', cornerGlow: '#8c3cff',
      ringColors: ['#a060ff','#8040ff','#6020ff','#a060ff','#c090ff','#8040ff','#a060ff'],
      barColors: ['#c090ff','#a060ff','#8040ff','#6020ff','#a060ff','#c090ff','#a060ff'],
      levelColors: ['#e8d8ff','#c090ff','#a060ff','#8040ff','#6020ff','#c090ff','#e8d8ff'],
      levelGlow: '#8c3cff',
      panelBg1: 'rgba(5,2,20,0.96)', panelBg2: 'rgba(3,1,15,0.96)',
      panelBorder: 'rgba(140,60,255,0.45)', panelGlow: '#8c3cff',
      titleColor: '#c090ff', titleGlow: '#8c3cff',
      statColor: '#c090ff', grid: 'rgba(120,60,255,0.05)',
      gemOverride: ['#c090ff','#8040ff','#4010c0','#a060ff'],
    },
    nature: {
      bg1: '#021008', bg2: '#010a05',
      aura1: ['rgba(20,120,40,0.55)','rgba(40,160,60,0.35)','rgba(80,200,80,0.15)'],
      aura2: ['rgba(100,180,20,0.40)','rgba(60,140,20,0.25)','rgba(160,220,40,0.15)'],
      border: 'rgba(40,180,60,0.55)', borderGlow: '#28b43c',
      corner: '#40c050', cornerGlow: '#28b43c',
      ringColors: ['#40c050','#80d840','#c0f040','#80d840','#40c050','#20a030','#40c050'],
      barColors: ['#40c050','#80d840','#c0f040','#80d840','#40c050','#20a030','#40c050'],
      levelColors: ['#e0ffe8','#a0f0b0','#40c050','#80d840','#20a030','#a0f0b0','#e0ffe8'],
      levelGlow: '#28b43c',
      panelBg1: 'rgba(3,16,6,0.94)', panelBg2: 'rgba(2,10,4,0.94)',
      panelBorder: 'rgba(40,180,60,0.45)', panelGlow: '#28b43c',
      titleColor: '#a0f0b0', titleGlow: '#28b43c',
      statColor: '#80e890', grid: 'rgba(40,180,60,0.05)',
      gemOverride: ['#a0f0b0','#40c050','#106020','#80d840'],
    },
    dark: {
      bg1: '#050505', bg2: '#020202',
      aura1: ['rgba(80,80,80,0.45)','rgba(40,40,60,0.30)','rgba(100,100,120,0.12)'],
      aura2: ['rgba(60,40,80,0.40)','rgba(40,20,60,0.25)','rgba(80,60,100,0.15)'],
      border: 'rgba(160,140,180,0.40)', borderGlow: '#a08cb4',
      corner: '#c0a8d8', cornerGlow: '#a08cb4',
      ringColors: ['#c0a8d8','#a080c0','#8060a0','#604080','#a080c0','#c0a8d8','#c0a8d8'],
      barColors: ['#c0a8d8','#a080c0','#8060a0','#604080','#a080c0','#c0a8d8','#c0a8d8'],
      levelColors: ['#e8e0f0','#c0a8d8','#a080c0','#8060a0','#604080','#c0a8d8','#e8e0f0'],
      levelGlow: '#a08cb4',
      panelBg1: 'rgba(8,6,10,0.97)', panelBg2: 'rgba(5,4,7,0.97)',
      panelBorder: 'rgba(140,120,160,0.40)', panelGlow: '#a08cb4',
      titleColor: '#c0a8d8', titleGlow: '#a08cb4',
      statColor: '#c0a8d8', grid: 'rgba(100,80,120,0.04)',
      gemOverride: ['#c0a8d8','#8060a0','#402060','#a080c0'],
    },
    gold: {
      bg1: '#100800', bg2: '#0a0500',
      aura1: ['rgba(220,160,0,0.55)','rgba(180,120,0,0.35)','rgba(255,200,40,0.15)'],
      aura2: ['rgba(200,120,0,0.45)','rgba(160,80,0,0.30)','rgba(255,160,0,0.20)'],
      border: 'rgba(220,160,0,0.60)', borderGlow: '#dca000',
      corner: '#ffd700', cornerGlow: '#dca000',
      ringColors: ['#ffd700','#ffaa00','#ff8800','#ffaa00','#ffd700','#ffe860','#ffd700'],
      barColors: ['#ffd700','#ffaa00','#ff8800','#ffaa00','#ffd700','#ffe860','#ffd700'],
      levelColors: ['#fffbe0','#ffe860','#ffd700','#ffaa00','#ff8800','#ffe860','#fffbe0'],
      levelGlow: '#dca000',
      panelBg1: 'rgba(20,12,0,0.96)', panelBg2: 'rgba(14,8,0,0.96)',
      panelBorder: 'rgba(220,160,0,0.50)', panelGlow: '#dca000',
      titleColor: '#ffe860', titleGlow: '#dca000',
      statColor: '#ffd060', grid: 'rgba(220,160,0,0.05)',
      gemOverride: ['#ffe860','#ffd700','#a07000','#ffaa00'],
    },
    argent: {
      bg1: '#0a0c10', bg2: '#060810',
      aura1: ['rgba(160,180,210,0.50)','rgba(120,140,180,0.30)','rgba(200,210,230,0.12)'],
      aura2: ['rgba(100,120,160,0.40)','rgba(80,100,140,0.25)','rgba(160,180,210,0.15)'],
      border: 'rgba(180,200,230,0.55)', borderGlow: '#b4c8e6',
      corner: '#d0e0f8', cornerGlow: '#b4c8e6',
      ringColors: ['#d0e0f8','#b0c8e8','#90a8d0','#b0c8e8','#d0e0f8','#e8f0fc','#d0e0f8'],
      barColors: ['#d0e0f8','#b0c8e8','#90a8d0','#b0c8e8','#d0e0f8','#e8f0fc','#d0e0f8'],
      levelColors: ['#ffffff','#e8f0fc','#d0e0f8','#b0c8e8','#90a8d0','#e8f0fc','#ffffff'],
      levelGlow: '#b4c8e6',
      panelBg1: 'rgba(12,16,22,0.96)', panelBg2: 'rgba(8,10,16,0.96)',
      panelBorder: 'rgba(180,200,230,0.45)', panelGlow: '#b4c8e6',
      titleColor: '#d0e0f8', titleGlow: '#b4c8e6',
      statColor: '#c0d8f0', grid: 'rgba(160,180,220,0.04)',
      gemOverride: ['#e8f0fc','#b0c8e8','#607090','#d0e0f8'],
    },
    bleu: {
      bg1: '#000818', bg2: '#000510',
      aura1: ['rgba(0,80,220,0.55)','rgba(0,120,255,0.35)','rgba(0,180,255,0.15)'],
      aura2: ['rgba(0,60,200,0.45)','rgba(0,100,240,0.30)','rgba(40,160,255,0.20)'],
      border: 'rgba(0,140,255,0.60)', borderGlow: '#008cff',
      corner: '#40b0ff', cornerGlow: '#008cff',
      ringColors: ['#40b0ff','#0080ff','#0050e0','#0080ff','#40b0ff','#80d0ff','#40b0ff'],
      barColors: ['#40b0ff','#0080ff','#0050e0','#0080ff','#40b0ff','#80d0ff','#40b0ff'],
      levelColors: ['#e0f4ff','#80d0ff','#40b0ff','#0080ff','#0050e0','#80d0ff','#e0f4ff'],
      levelGlow: '#008cff',
      panelBg1: 'rgba(0,8,22,0.96)', panelBg2: 'rgba(0,5,15,0.96)',
      panelBorder: 'rgba(0,140,255,0.50)', panelGlow: '#008cff',
      titleColor: '#80d0ff', titleGlow: '#008cff',
      statColor: '#60c0ff', grid: 'rgba(0,140,255,0.05)',
      gemOverride: ['#80d0ff','#0080ff','#002080','#40b0ff'],
    },
    rose: {
      bg1: '#120008', bg2: '#0d0005',
      aura1: ['rgba(255,100,180,0.55)','rgba(220,60,150,0.35)','rgba(255,160,210,0.15)'],
      aura2: ['rgba(200,40,140,0.45)','rgba(160,20,110,0.30)','rgba(255,120,190,0.20)'],
      border: 'rgba(255,100,180,0.60)', borderGlow: '#ff64b4',
      corner: '#ff80c8', cornerGlow: '#ff64b4',
      ringColors: ['#ff80c8','#ff50a8','#ff2090','#ff50a8','#ff80c8','#ffb0de','#ff80c8'],
      barColors: ['#ff80c8','#ff50a8','#ff2090','#ff50a8','#ff80c8','#ffb0de','#ff80c8'],
      levelColors: ['#ffe8f4','#ffb0de','#ff80c8','#ff50a8','#ff2090','#ffb0de','#ffe8f4'],
      levelGlow: '#ff64b4',
      panelBg1: 'rgba(20,0,10,0.96)', panelBg2: 'rgba(14,0,7,0.96)',
      panelBorder: 'rgba(255,100,180,0.50)', panelGlow: '#ff64b4',
      titleColor: '#ffb0de', titleGlow: '#ff64b4',
      statColor: '#ff90d0', grid: 'rgba(255,100,180,0.05)',
      gemOverride: ['#ffb0de','#ff50a8','#880040','#ff80c8'],
    },
  };
  return themes[t] || themes['holographique'];
}

// ─── Helper functions ────────────────────────────────────────────────────────

function gemPalette(name, themeOverride) {
  if (themeOverride) return themeOverride;
  if (name.includes('BRONZE'))     return ['#ffd090','#c07820','#804010','#ffb050'];
  if (name.includes('ARGENT'))     return ['#ffffff','#c0c8d8','#8090a8','#e0e8f8'];
  if (name.includes('OR'))         return ['#fff0a0','#ffd700','#a07800','#ffe860'];
  if (name.includes('PLATINE'))    return ['#e0f4ff','#a0d0f0','#4090c0','#c0e8ff'];
  if (name.includes('DIAMANT'))    return ['#c0f8ff','#60c8ff','#1060c8','#80e8ff'];
  if (name.includes('MAITRE'))     return ['#e8c0ff','#a040e0','#600090','#d080ff'];
  if (name.includes('GRAND'))      return ['#ffc080','#ff4010','#a00000','#ff8040'];
  if (name.includes('CHALLENGER')) return ['#fff080','#ff8020','#cc0000','#ffcc40'];
  return ['#c0e8ff','#6090d0','#304880','#90c0f0'];
}

// Retire les emoji que les polices système ne savent pas afficher
// (regex sans flag u — compatible tous Node.js)
function safeText(s) {
  return String(s == null ? '' : s)
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // paires surrogates (emoji 4 octets)
    .replace(/[\u2600-\u27BF]/g, '')                   // symboles divers / dingbats
    .replace(/[\uFE00-\uFEFF]/g, '')                   // sélecteurs de variation
    .replace(/\s{2,}/g, ' ').trim();
}

// ─── Core drawing functions ───────────────────────────────────────────────────

function drawPanel(ctx, x, y, w, h, theme) {
  ctx.beginPath();
  ctx.moveTo(x + 18, y);
  ctx.lineTo(x + w - 18, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 18);
  ctx.lineTo(x + w, y + h - 18);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 18, y + h);
  ctx.lineTo(x + 18, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 18);
  ctx.lineTo(x, y + 18);
  ctx.quadraticCurveTo(x, y, x + 18, y);
  ctx.closePath();

  const bg = ctx.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, theme.panelBg1);
  bg.addColorStop(1, theme.panelBg2);
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.strokeStyle = theme.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = theme.panelGlow;
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;
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

function drawCrystalGem(ctx, cx, cy, s, pal) {
  const [hi, mid, dark, glow] = pal;
  ctx.shadowColor = glow; ctx.shadowBlur = 28;
  poly(ctx, [[cx,cy-s],[cx-s*0.62,cy-s*0.18],[cx-s*0.28,cy+s*0.10]],
    lerpGrad(ctx, cx-s*0.6,cy-s, cx,cy+s*0.1, [hi,'rgba(255,255,255,0.8)',mid]));
  poly(ctx, [[cx,cy-s],[cx+s*0.62,cy-s*0.18],[cx+s*0.28,cy+s*0.10]],
    lerpGrad(ctx, cx,cy+s*0.1, cx+s*0.6,cy-s, [hi,'rgba(255,255,255,0.8)',mid]));
  poly(ctx, [[cx-s*0.62,cy-s*0.18],[cx+s*0.62,cy-s*0.18],[cx,cy+s*0.10]],
    lerpGrad(ctx, cx-s*0.62,cy-s*0.18, cx+s*0.62,cy-s*0.18, [mid,'rgba(255,255,255,0.6)',dark]));
  poly(ctx, [[cx-s*0.28,cy+s*0.10],[cx+s*0.28,cy+s*0.10],[cx,cy+s*0.10+s*0.5]],
    lerpGrad(ctx, cx-s*0.28,cy+s*0.10, cx+s*0.28,cy+s*0.10, [dark,mid,hi]));
  ctx.shadowBlur = 0;
}

// ─── Main rendering function ─────────────────────────────────────────────────

async function run() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  const { username, discriminator, avatarUrl, data, theme: themeName } = JSON.parse(raw);

  const theme = getTheme(themeName);
  const W = 1400, H = 800;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const level = data.level || 0;
  const xp = data.xp || 0;
  const required = data.required || 100;
  const messages = data.messages || 0;
  const voiceMin = data.voiceMinutes || 0;
  const streak = data.streak || 0;
  const karma = data.karma || 0;
  const rankName = data.rankName || data.rankDisplay || 'BRONZE I';
  const nextLvl = data.nextPanelBig || level + 1;
  const xpLeft = data.nextPanelSub ? parseInt(data.nextPanelSub.replace(/[^0-9]/g, '')) || required - xp : required - xp;
  const pal = gemPalette(rankName, theme.gemOverride);

  // ── Dynamic mode labels (all optional, keep full backward-compat) ────────
  const panelTitle      = (data.panelTitle || 'NIVEAU').toUpperCase();
  const displayNumStr   = data.displayNumStr != null ? String(data.displayNumStr) : String(level);
  const nextPanelTitle  = data.nextPanelTitle  || 'PROCHAIN NIVEAU';
  const nextPanelSub    = data.nextPanelSub    || `${xpLeft.toLocaleString('fr-FR')} XP`;
  const nextPanelSubSub = data.nextPanelSubSub || 'RESTANTES';

  // Background
  ctx.fillStyle = theme.bg1;
  ctx.fillRect(0, 0, W, H);

  const a1 = ctx.createRadialGradient(120, 80, 0, 120, 80, 420);
  a1.addColorStop(0, theme.aura1[0]);
  a1.addColorStop(0.3, theme.aura1[1]);
  a1.addColorStop(0.6, theme.aura1[2]);
  a1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = a1;
  ctx.fillRect(0, 0, W, H);

  // Aura2 (opposite corner)
  const a2 = ctx.createRadialGradient(W-120, H-80, 0, W-120, H-80, 420);
  a2.addColorStop(0, theme.aura2[0]);
  a2.addColorStop(0.3, theme.aura2[1]);
  a2.addColorStop(0.6, theme.aura2[2]);
  a2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = a2;
  ctx.fillRect(0, 0, W, H);

  // Grid overlay
  ctx.save();
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 40) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += 40) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }
  ctx.restore();

  // Avatar — with fallback if CDN fails
  let avatar = null;
  try { avatar = await loadImage(avatarUrl); } catch (_) { /* fallback below */ }
  const ax = 180, ay = 270, ar = 108;
  ctx.save();
  ctx.beginPath();
  ctx.arc(ax, ay, ar, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, ax - ar, ay - ar, ar * 2, ar * 2);
  } else {
    // Colored circle + first letter
    const fbg = ctx.createRadialGradient(ax, ay, 0, ax, ay, ar);
    fbg.addColorStop(0, theme.titleColor); fbg.addColorStop(1, theme.panelBg1);
    ctx.fillStyle = fbg; ctx.fillRect(ax - ar, ay - ar, ar * 2, ar * 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${ar}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((username[0] || '?').toUpperCase(), ax, ay);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();

  // Avatar ring (theme ringColors)
  const ringColors = theme.ringColors || [];
  const ringN = ringColors.length;
  if (ringN > 0) {
    for (let ri = 0; ri < ringN; ri++) {
      const sa = (ri / ringN) * Math.PI * 2 - Math.PI / 2;
      const ea = ((ri + 1) / ringN) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(ax, ay, ar + 10, sa, ea);
      ctx.strokeStyle = ringColors[ri];
      ctx.lineWidth = 5;
      ctx.shadowColor = ringColors[ri];
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // Username
  ctx.font = 'bold 68px "DejaVu Sans", "Liberation Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = theme.titleGlow;
  ctx.shadowBlur = 16;
  ctx.fillText(safeText(username), 324, 220);
  ctx.shadowBlur = 0;

  // Niveau panel
  const NX = 860, NY = 40, NW = 510, NH = 350;
  drawPanel(ctx, NX, NY, NW, NH, theme);

  ctx.font = 'bold 44px Arial';
  ctx.fillStyle = theme.titleColor;
  ctx.shadowColor = theme.panelGlow;
  ctx.shadowBlur = 10;
  ctx.fillText(safeText(panelTitle), NX + 36, NY + 76);
  ctx.shadowBlur = 0;

  const lvlStr = displayNumStr;
  const lvlPx = lvlStr.length > 7 ? 70 : lvlStr.length > 5 ? 100 : lvlStr.length > 3 ? 150 : 210;
  ctx.font = `bold ${lvlPx}px Arial`;
  const lvlMw = ctx.measureText(lvlStr).width;
  const lvlStartX = NX + (NW - lvlMw) / 2;
  const lvlGrad = ctx.createLinearGradient(lvlStartX, NY + 100, lvlStartX + lvlMw, NY + NH - 20);
  theme.levelColors.forEach((c, i) => lvlGrad.addColorStop(i / (theme.levelColors.length - 1), c));
  ctx.fillStyle = lvlGrad;
  ctx.shadowColor = theme.levelGlow;
  ctx.shadowBlur = 50;
  ctx.fillText(safeText(lvlStr), lvlStartX, NY + NH - 30);
  ctx.shadowBlur = 0;

  // EXP bar
  const EX = 42, EY = 418, EW = W - 84, EH = 62;
  drawPanel(ctx, EX, EY, EW, EH, theme);

  ctx.font = 'bold 26px "DejaVu Sans", "Liberation Sans", sans-serif';
  ctx.fillStyle = theme.statColor;
  ctx.fillText('EXP', EX + 18, EY + 40);

  const expLabel = data.expBarLabel || `${xp} / ${required} EXP`;
  ctx.textAlign = 'right';
  ctx.fillText(expLabel, EX + EW - 18, EY + 40);
  ctx.textAlign = 'left';

  // Stats panels
  const PY = 506, PH = H - PY - 48;
  const PW = (W - 84 - 24) / 3;
  const p1x = 42, p2x = p1x + PW + 12, p3x = p2x + PW + 12;

  drawPanel(ctx, p1x, PY, PW, PH, theme);
  drawPanel(ctx, p2x, PY, PW, PH, theme);
  drawPanel(ctx, p3x, PY, PW, PH, theme);

  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = theme.titleColor;
  ctx.shadowColor = theme.panelGlow;
  ctx.shadowBlur = 6;
  ctx.fillText('STATISTIQUES', p1x + 18, PY + 34);
  ctx.shadowBlur = 0;

  // Stats panel - 3 columns with icons
  const voiceStr = voiceMin >= 60 ? `${Math.floor(voiceMin/60)}h` : `${voiceMin}m`;
  const msgStr   = messages >= 10000 ? `${Math.floor(messages/1000)}K`
                 : messages >= 1000  ? `${(messages/1000).toFixed(1)}K` : String(messages);
  const fireStr  = streak >= 1000 ? `${Math.floor(streak/1000)}K` : String(streak);
  const statsData = Array.isArray(data.statsItems) ? data.statsItems : [
    { icon:'MSG', label:'MESSAGES', value: msgStr },
    { icon:'VOC', label:'VOCAL',    value: voiceStr },
    { icon:'FEU', label:'FEU',      value: fireStr }
  ];
  const colW = PW / Math.max(1, statsData.length);
  statsData.forEach((s,i) => {
    const sx = p1x+14+i*colW;
    ctx.font = 'bold 24px "DejaVu Sans"';
    ctx.fillStyle = theme.statColor;
    ctx.shadowColor = theme.panelGlow;
    ctx.shadowBlur = 4;
    ctx.fillText(safeText(s.icon), sx, PY+74);
    ctx.shadowBlur = 0;
    ctx.font = '13px "DejaVu Sans"';
    ctx.fillStyle = theme.statColor;
    ctx.globalAlpha = 0.7;
    ctx.fillText(safeText(s.label), sx, PY+98);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 30px "DejaVu Sans"';
    const sg = ctx.createLinearGradient(sx, PY+100, sx+colW-10, PY+140);
    theme.barColors.slice(0,2).forEach((c,ii) => sg.addColorStop(ii, c));
    ctx.fillStyle = sg;
    ctx.fillText(safeText(s.value), sx, PY+136);
  });

  // Rang panel
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = theme.titleColor;
  ctx.shadowColor = theme.panelGlow;
  ctx.shadowBlur = 6;
  const rangLabel = 'RANG ACTUEL';
  const _rl=safeText(rangLabel); ctx.fillText(_rl, p2x+PW/2-ctx.measureText(_rl).width/2, PY+34);
  ctx.shadowBlur = 0;
  const gemCx = p2x+PW/2, gemCy = PY+PH/2-12;
  drawCrystalGem(ctx, gemCx, gemCy, 60, pal);
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px Arial';
  const rnG = ctx.createLinearGradient(p2x, PY+PH-48, p2x+PW, PY+PH-28);
  rnG.addColorStop(0, pal[0]);
  rnG.addColorStop(1, pal[1]);
  ctx.fillStyle = rnG;
  ctx.shadowColor = pal[0];
  ctx.shadowBlur = 14;
  ctx.fillText(safeText(rankName), gemCx, PY+PH-26);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';

  // Prochain niveau panel
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = theme.titleColor;
  ctx.shadowColor = theme.panelGlow;
  ctx.shadowBlur = 6;
  ctx.fillText(safeText(nextPanelTitle), p3x+18, PY+34);
  ctx.shadowBlur = 0;
  drawCrystalGem(ctx, p3x+60, PY+PH/2-8, 34, pal);
  ctx.font = 'bold 36px Arial';
  const nlG = ctx.createLinearGradient(p3x+98, PY+80, p3x+PW, PY+130);
  nlG.addColorStop(0, theme.titleColor);
  nlG.addColorStop(1, theme.statColor);
  ctx.fillStyle = nlG;
  const _nextBig = typeof nextLvl === 'number' ? `NIV. ${nextLvl}` : String(nextLvl);
  ctx.fillText(safeText(_nextBig), p3x+98, PY+118);
  ctx.font = 'bold 26px Arial';
  ctx.fillStyle = theme.statColor;
  ctx.fillText(safeText(nextPanelSub), p3x+98, PY+158);
  ctx.font = '18px Arial';
  ctx.fillStyle = theme.statColor;
  ctx.globalAlpha = 0.65;
  ctx.fillText(safeText(nextPanelSubSub), p3x+98, PY+188);
  ctx.globalAlpha = 1;

  // Card border
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 3;
  ctx.shadowColor = theme.borderGlow;
  ctx.shadowBlur = 22;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.shadowBlur = 0;

  // Corner accents
  const CL = 60;
  ctx.strokeStyle = theme.corner;
  ctx.lineWidth = 4;
  ctx.shadowColor = theme.cornerGlow;
  ctx.shadowBlur = 16;
  [[16, 16, CL, 0, 0, CL], [W-16-CL, 16, CL, 0, 0, CL],
   [16, H-16-CL, 0, CL, CL, 0], [W-16-CL, H-16-CL, 0, CL, CL, 0]].forEach(([x,y,dx1,dy1,dx2,dy2], idx) => {
    const ox = idx >= 2 ? x + (idx === 3 ? CL : 0) : x;
    const oy = idx >= 2 ? y + CL : y;
    ctx.beginPath();
    if (idx === 0) { ctx.moveTo(x, y + CL); ctx.lineTo(x, y); ctx.lineTo(x + CL, y); }
    if (idx === 1) { ctx.moveTo(W-16-CL, 16); ctx.lineTo(W-16, 16); ctx.lineTo(W-16, 16+CL); }
    if (idx === 2) { ctx.moveTo(16, H-16-CL); ctx.lineTo(16, H-16); ctx.lineTo(16+CL, H-16); }
    if (idx === 3) { ctx.moveTo(W-16-CL, H-16); ctx.lineTo(W-16, H-16); ctx.lineTo(W-16, H-16-CL); }
    ctx.stroke();
  });
  ctx.shadowBlur = 0;

  // Render to PNG
  const buf = canvas.toBuffer('image/png');
  process.stdout.write(buf);
  process.exit(0);
}

run().catch(err => {
  process.stderr.write('card-worker error: ' + err.message + '\n');
  process.exit(1);
});
