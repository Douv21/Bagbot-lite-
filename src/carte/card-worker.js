// Standalone card worker — runs as a child process.
// Reads JSON from stdin, writes PNG buffer to stdout.
// Uses @napi-rs/canvas — prebuilt binaries, no native compilation required.

const { createCanvas, loadImage } = require('@napi-rs/canvas');

// ─── Themes ──────────────────────────────────────────────────────────────────

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

// ─── Themed background decorations ───────────────────────────────────────────

function drawHeart(ctx, hx, hy, hs) {
  ctx.beginPath();
  ctx.moveTo(hx, hy + hs * 0.35);
  ctx.bezierCurveTo(hx, hy - hs*0.05, hx - hs, hy - hs*0.05, hx - hs, hy + hs*0.35);
  ctx.bezierCurveTo(hx - hs, hy + hs*0.8, hx, hy + hs*1.2, hx, hy + hs*1.4);
  ctx.bezierCurveTo(hx, hy + hs*1.2, hx + hs, hy + hs*0.8, hx + hs, hy + hs*0.35);
  ctx.bezierCurveTo(hx + hs, hy - hs*0.05, hx, hy - hs*0.05, hx, hy + hs*0.35);
  ctx.closePath();
}

function drawLeaf(ctx, lx, ly, ls, rot) {
  ctx.save(); ctx.translate(lx, ly); ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -ls);
  ctx.bezierCurveTo(ls*0.85, -ls*0.4, ls*0.85, ls*0.4, 0, ls);
  ctx.bezierCurveTo(-ls*0.85, ls*0.4, -ls*0.85, -ls*0.4, 0, -ls);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawThemeBackground(ctx, W, H, theme, themeName) {
  ctx.save();
  const t = (themeName || 'holographique').toLowerCase();

  if (t === 'holographique') {
    // Large prismatic light beams from top-center
    for (let i = 0; i < 10; i++) {
      const angle = -0.5 + i * 0.11;
      const g = ctx.createLinearGradient(W/2, 0, W/2 + Math.cos(angle)*W*2, Math.sin(angle)*H*2);
      const colors = ['rgba(0,240,255,0.18)','rgba(180,80,255,0.12)','rgba(0,200,255,0.15)'];
      g.addColorStop(0, colors[i % 3]); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.moveTo(W/2, 0);
      ctx.lineTo(W/2 + Math.cos(angle - 0.05)*W*2, Math.sin(angle - 0.05)*H*2);
      ctx.lineTo(W/2 + Math.cos(angle + 0.05)*W*2, Math.sin(angle + 0.05)*H*2);
      ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    }
    // Big lens flare circles
    [[160,120,90,'rgba(0,240,255,0.22)'],[520,180,50,'rgba(180,100,255,0.18)'],
     [1050,100,70,'rgba(0,200,255,0.20)'],[850,600,60,'rgba(100,200,255,0.15)']].forEach(([x,y,r,c]) => {
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, c); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle = g; ctx.fill();
    });
    // Iridescent diagonal sweep
    const sweep = ctx.createLinearGradient(0, 0, W, H*0.6);
    sweep.addColorStop(0,'rgba(0,0,0,0)');
    sweep.addColorStop(0.3,'rgba(0,220,255,0.06)');
    sweep.addColorStop(0.5,'rgba(200,100,255,0.09)');
    sweep.addColorStop(0.7,'rgba(0,255,200,0.06)');
    sweep.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = sweep; ctx.fillRect(0,0,W,H);

  } else if (t === 'gaming') {
    // Bold scanlines across full card
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#00ff50';
    for (let y = 0; y < H; y += 5) { ctx.fillRect(0, y, W, 2); }
    // Large HUD crosshair top-right
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#00ff50'; ctx.lineWidth = 2.5;
    const cx = W - 110, cy = 110, cr = 60;
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, cr*0.35, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, cr*1.35, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(0,255,80,0.18)'; ctx.lineWidth = 1; ctx.stroke();
    [[cx-cr*1.6,cy,cx-cr*1.05,cy],[cx+cr*1.05,cy,cx+cr*1.6,cy],
     [cx,cy-cr*1.6,cx,cy-cr*1.05],[cx,cy+cr*1.05,cx,cy+cr*1.6]].forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
      ctx.strokeStyle = '#00ff50'; ctx.lineWidth = 2.5; ctx.stroke();
    });
    // Health & mana bars (top-left area, game HUD)
    ctx.globalAlpha = 0.30;
    const barData = [['#00ff50',40,44,220,14],['#4488ff',40,66,160,14]];
    barData.forEach(([col,bx,by,bw,bh]) => {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx-2,by-2,bw+4,bh+4);
      ctx.fillStyle = col; ctx.fillRect(bx,by,bw,bh);
    });
    // Pixel blocks (retro style)
    ctx.globalAlpha = 0.25;
    [[1260,560,16,'#00ff50'],[1290,545,10,'#ffff00'],[1275,578,12,'#ff4000'],
     [700,50,14,'#00ff50'],[720,40,8,'#80ff00']].forEach(([x,y,s,c]) => {
      ctx.fillStyle = c; ctx.fillRect(x, y, s, s);
    });
    // Corner bracket HUD decorations (bottom-left)
    ctx.globalAlpha = 0.30;
    ctx.strokeStyle = '#00ff50'; ctx.lineWidth = 2;
    [[48,H-48,1,1],[48+120,H-48,-1,1]].forEach(([bx,by,dx,dy]) => {
      ctx.beginPath(); ctx.moveTo(bx,by+dy*30); ctx.lineTo(bx,by); ctx.lineTo(bx+dx*30,by); ctx.stroke();
    });

  } else if (t === 'love') {
    // Many large bright hearts at varied positions and sizes
    const heartPos = [
      [90,55,32],[280,40,22],[500,70,28],[740,45,24],[960,65,30],[1180,50,20],[1340,80,26],
      [55,300,18],[1360,280,22],[60,600,24],[400,720,20],[700,740,28],[1000,730,18],[1310,660,22],
      [220,180,14],[580,160,16],[920,150,14],[1200,190,18],
      [160,460,16],[850,480,12],[1250,430,14]
    ];
    heartPos.forEach(([hx, hy, hs]) => {
      // Glow
      const hg = ctx.createRadialGradient(hx, hy+hs*0.7, 0, hx, hy+hs*0.7, hs*2.2);
      hg.addColorStop(0,'rgba(255,80,160,0.22)'); hg.addColorStop(1,'rgba(255,80,160,0)');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(hx, hy+hs*0.7, hs*2.2, 0, Math.PI*2); ctx.fill();
      // Heart
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = theme.corner;
      drawHeart(ctx, hx, hy, hs);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

  } else if (t === 'sensuel') {
    // Flowing silk drape curves (wide, visible)
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 10; i++) {
      const ox = -100 + i * 160;
      const g = ctx.createLinearGradient(ox, 0, ox+120, H);
      g.addColorStop(0,'rgba(200,0,120,0.0)');
      g.addColorStop(0.3, theme.corner);
      g.addColorStop(0.7,'rgba(200,0,120,0.5)');
      g.addColorStop(1,'rgba(200,0,120,0.0)');
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(ox, 0);
      ctx.bezierCurveTo(ox+80, H*0.25, ox+30, H*0.55, ox+100, H);
      ctx.stroke();
    }
    // Large rose petals scattered
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = theme.corner;
    [[180,90,50,24,0.5],[460,70,38,18,1.1],[1080,60,46,22,0.2],
     [940,680,42,20,1.9],[280,700,36,17,0.8],[1240,380,40,19,1.5],
     [700,120,30,14,2.2],[1340,600,34,16,0.4]].forEach(([px,py,rw,rh,angle]) => {
      ctx.save(); ctx.translate(px, py); ctx.rotate(angle);
      ctx.beginPath(); ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI*2);
      ctx.fill(); ctx.restore();
    });
    // Diagonal vignette glow
    const sv = ctx.createLinearGradient(0, H, W, 0);
    sv.addColorStop(0,'rgba(200,0,100,0.12)'); sv.addColorStop(1,'rgba(100,0,60,0.06)');
    ctx.globalAlpha = 1; ctx.fillStyle = sv; ctx.fillRect(0,0,W,H);

  } else if (t === 'cosmos') {
    // Dense starfield — 350 stars at full brightness
    const rng = s => { let x = Math.sin(s)*10000; return x - Math.floor(x); };
    for (let i = 0; i < 350; i++) {
      const sx = rng(i*3+1)*W, sy = rng(i*3+2)*H;
      const sr = rng(i*3+3)*2.2 + 0.3;
      const bright = rng(i*3)*0.6 + 0.4;
      ctx.globalAlpha = bright * 0.75;
      // Big stars get a cross flare
      if (sr > 2) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8;
        ctx.globalAlpha = bright * 0.4;
        [[sx-sr*3,sy,sx+sr*3,sy],[sx,sy-sr*3,sx,sy+sr*3]].forEach(([x1,y1,x2,y2]) => {
          ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        });
        ctx.globalAlpha = bright * 0.75;
      }
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    // Nebula cloud (right side)
    ctx.globalAlpha = 1;
    [[1100,200,280,'rgba(100,40,200,0.18)'],[1200,350,200,'rgba(60,0,180,0.14)'],
     [900,150,180,'rgba(140,60,255,0.12)'],[1300,500,160,'rgba(80,20,160,0.10)']].forEach(([nx,ny,nr,nc]) => {
      const ng = ctx.createRadialGradient(nx,ny,0,nx,ny,nr);
      ng.addColorStop(0, nc); ng.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(nx,ny,nr,0,Math.PI*2); ctx.fill();
    });
    // Bright constellations
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = theme.corner; ctx.lineWidth = 1.2;
    const conStars = [[120,90],[320,60],[260,160],[480,90],[420,200],[640,80],[750,170],[680,280]];
    for (let i = 0; i < conStars.length - 1; i++) {
      ctx.beginPath(); ctx.moveTo(...conStars[i]); ctx.lineTo(...conStars[i+1]); ctx.stroke();
    }
    conStars.forEach(([sx,sy]) => {
      ctx.beginPath(); ctx.arc(sx,sy,3,0,Math.PI*2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
    });
    // Shooting star
    ctx.globalAlpha = 0.55;
    const ssg = ctx.createLinearGradient(1100,30,1380,130);
    ssg.addColorStop(0,'rgba(200,150,255,0)'); ssg.addColorStop(0.6, theme.corner); ssg.addColorStop(1,'#ffffff');
    ctx.strokeStyle = ssg; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(1100, 30); ctx.lineTo(1380, 130); ctx.stroke();

  } else if (t === 'nature') {
    // Ground gradient (green mist bottom)
    const gnd = ctx.createLinearGradient(0, H*0.6, 0, H);
    gnd.addColorStop(0,'rgba(20,100,30,0)'); gnd.addColorStop(1,'rgba(20,100,30,0.20)');
    ctx.fillStyle = gnd; ctx.fillRect(0,0,W,H);
    // Large leaves all around border
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = theme.corner;
    const leafData = [
      [80,60,55,0.3],[220,40,42,1.2],[420,55,48,2.0],[650,40,38,0.7],
      [900,50,52,1.5],[1100,60,44,0.2],[1280,80,40,1.9],[1380,160,36,2.5],
      [55,580,50,1.1],[1390,560,46,0.5],[80,720,44,1.8],[400,750,36,0.4],
      [750,760,42,2.3],[1050,740,40,1.0],[1320,700,38,1.6]
    ];
    leafData.forEach(([lx,ly,ls,rot]) => { drawLeaf(ctx, lx, ly, ls, rot); });
    // Vein lines on bigger leaves
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#c0f040'; ctx.lineWidth = 1.5;
    [[80,60,55,0.3],[900,50,52,1.5],[1100,60,44,0.2]].forEach(([lx,ly,ls,rot]) => {
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(rot);
      ctx.beginPath(); ctx.moveTo(0,-ls); ctx.lineTo(0,ls); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-ls*0.3); ctx.lineTo(ls*0.5,ls*0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,ls*0.2); ctx.lineTo(-ls*0.5,ls*0.5); ctx.stroke();
      ctx.restore();
    });
    // Flowing branch curves
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#60a040'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, H*0.35); ctx.bezierCurveTo(W*0.15,H*0.15, W*0.35,H*0.55, W*0.55,H*0.25);
    ctx.bezierCurveTo(W*0.75,H*0.05, W*0.9,H*0.45, W, H*0.3); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, H*0.7); ctx.bezierCurveTo(W*0.2,H*0.9, W*0.5,H*0.75, W*0.7,H*0.9);
    ctx.bezierCurveTo(W*0.85,H*0.98, W*0.95,H*0.85, W, H*0.9); ctx.stroke();

  } else if (t === 'dark') {
    // Full hexagon grid, clearly visible
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = theme.corner; ctx.lineWidth = 1.5;
    const hexR = 50, hexH = hexR * Math.sqrt(3);
    for (let col = -1; col < W / (hexR * 1.5) + 2; col++) {
      for (let row = -1; row < H / hexH + 2; row++) {
        const hcx = col * hexR * 3 + (row % 2 === 0 ? 0 : hexR * 1.5);
        const hcy = row * hexH;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI/180) * (60*i - 30);
          i === 0 ? ctx.moveTo(hcx+hexR*Math.cos(a), hcy+hexR*Math.sin(a))
                  : ctx.lineTo(hcx+hexR*Math.cos(a), hcy+hexR*Math.sin(a));
        }
        ctx.closePath(); ctx.stroke();
      }
    }
    // Glowing hex accents (a few filled)
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = theme.corner;
    [[200,200],[600,120],[1100,300],[900,600],[300,500]].forEach(([hx,hy]) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI/180)*(60*i-30);
        i===0?ctx.moveTo(hx+hexR*Math.cos(a),hy+hexR*Math.sin(a)):ctx.lineTo(hx+hexR*Math.cos(a),hy+hexR*Math.sin(a));
      }
      ctx.closePath(); ctx.fill();
    });
    // Dark fog layers
    [[0,0,300,'rgba(40,0,60,0.18)'],[W,0,280,'rgba(20,0,40,0.14)'],
     [W/2,H,350,'rgba(60,20,80,0.12)']].forEach(([fx,fy,fr,fc]) => {
      const fg2 = ctx.createRadialGradient(fx,fy,0,fx,fy,fr);
      fg2.addColorStop(0,fc); fg2.addColorStop(1,'rgba(0,0,0,0)');
      ctx.globalAlpha=1; ctx.fillStyle=fg2; ctx.beginPath(); ctx.arc(fx,fy,fr,0,Math.PI*2); ctx.fill();
    });

  } else if (t === 'gold') {
    // Bold diagonal metallic stripes
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
    for (let i = -H; i < W + H; i += 22) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
    }
    // Large diamond pattern
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#ffe860'; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 5; j++) {
        const dx = 80 + i*150, dy = 80 + j*150, ds = 55;
        ctx.beginPath();
        ctx.moveTo(dx,dy-ds); ctx.lineTo(dx+ds,dy);
        ctx.lineTo(dx,dy+ds); ctx.lineTo(dx-ds,dy);
        ctx.closePath(); ctx.stroke();
      }
    }
    // Bright golden glow orbs
    [[160,120,130,'rgba(255,215,0,0.22)'],[W/2,H/2,200,'rgba(255,180,0,0.10)'],
     [1200,160,110,'rgba(255,200,0,0.20)'],[1000,650,100,'rgba(255,220,0,0.18)'],
     [300,600,90,'rgba(255,200,0,0.14)']].forEach(([gx,gy,gr,gc]) => {
      const gg = ctx.createRadialGradient(gx,gy,0,gx,gy,gr);
      gg.addColorStop(0, gc); gg.addColorStop(1,'rgba(255,200,0,0)');
      ctx.globalAlpha=1; ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(gx,gy,gr,0,Math.PI*2); ctx.fill();
    });
    // Shimmering diagonal sheen
    const gs = ctx.createLinearGradient(0,0,W,H*0.5);
    gs.addColorStop(0,'rgba(255,255,200,0)');
    gs.addColorStop(0.45,'rgba(255,240,100,0.12)');
    gs.addColorStop(0.5,'rgba(255,255,255,0.20)');
    gs.addColorStop(0.55,'rgba(255,240,100,0.12)');
    gs.addColorStop(1,'rgba(255,255,200,0)');
    ctx.fillStyle=gs; ctx.fillRect(0,0,W,H);

  } else if (t === 'argent') {
    // Metallic horizontal bands
    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = '#d0e0f8'; ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + Math.sin(y*0.04)*10); ctx.stroke();
    }
    // Large sheen streaks (diagonal silver glints)
    [[0,0,W*0.5,H*0.35,'rgba(255,255,255,0.18)'],
     [W*0.3,0,W*0.8,H*0.4,'rgba(200,220,255,0.12)'],
     [W*0.6,H*0.3,W,H*0.7,'rgba(255,255,255,0.14)']].forEach(([x1,y1,x2,y2,c]) => {
      const ag = ctx.createLinearGradient(x1,y1,x2,y2);
      ag.addColorStop(0,'rgba(255,255,255,0)'); ag.addColorStop(0.4,c);
      ag.addColorStop(0.5,'rgba(255,255,255,0.30)'); ag.addColorStop(0.6,c);
      ag.addColorStop(1,'rgba(255,255,255,0)');
      ctx.globalAlpha=1; ctx.fillStyle=ag; ctx.fillRect(0,0,W,H);
    });
    // Silver circle accents
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#e0f0ff'; ctx.lineWidth = 2;
    [[W-180,60,80],[W-120,120,40],[W-220,140,30]].forEach(([cx,cy,cr]) => {
      ctx.beginPath(); ctx.arc(cx,cy,cr,0,Math.PI*2); ctx.stroke();
    });

  } else if (t === 'bleu') {
    // Bold ocean waves across full width
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 3;
    const waveColors = ['#40b0ff','#0080ff','#80d0ff','#0060e0','#60c0ff'];
    for (let w = 0; w < 8; w++) {
      ctx.strokeStyle = waveColors[w % waveColors.length];
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const wy = H*0.55 + w*52 + Math.sin(x*0.012 + w*0.9)*35 + Math.sin(x*0.025 + w*0.4)*18;
        x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
    // Large concentric ripples (top-right)
    ctx.globalAlpha = 0.20;
    ctx.strokeStyle = '#40b0ff';
    for (let r = 60; r < 500; r += 55) {
      ctx.lineWidth = r > 250 ? 1 : 2;
      ctx.beginPath(); ctx.arc(W-80, 80, r, 0, Math.PI*2); ctx.stroke();
    }
    // Deep water glow (bottom)
    const bwg = ctx.createLinearGradient(0, H*0.5, 0, H);
    bwg.addColorStop(0,'rgba(0,60,180,0)'); bwg.addColorStop(1,'rgba(0,40,160,0.22)');
    ctx.globalAlpha=1; ctx.fillStyle=bwg; ctx.fillRect(0,0,W,H);

  } else if (t === 'rose') {
    // Sakura petals (large, clearly visible)
    ctx.globalAlpha = 0.30;
    const sakura = [
      [100,70,28,12,0.4],[280,50,24,10,1.2],[500,80,32,14,2.1],[740,55,26,11,0.7],
      [960,70,30,13,1.5],[1180,55,22,9,2.4],[1340,90,28,12,0.2],
      [60,400,24,10,1.8],[1370,380,26,11,0.6],
      [180,720,28,12,2.0],[500,740,22,9,0.9],[780,750,30,13,1.4],
      [1060,730,24,10,1.1],[1320,710,26,11,2.3],
      [340,200,20,8,1.6],[680,160,24,10,0.3],[1000,190,22,9,2.0],[1240,220,20,8,1.0]
    ];
    sakura.forEach(([px,py,rw,rh,angle]) => {
      ctx.save(); ctx.translate(px, py); ctx.rotate(angle);
      ctx.fillStyle = theme.corner;
      ctx.beginPath(); ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI*2); ctx.fill();
      // Petal highlight
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(-rw*0.2, -rh*0.2, rw*0.4, rh*0.3, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 0.30;
    });
    // Flower clusters in corners
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = theme.corner;
    [[100,100],[1310,100],[100,700],[1310,700]].forEach(([fcx,fcy]) => {
      for (let p = 0; p < 5; p++) {
        const pa = (Math.PI*2/5)*p - Math.PI/2;
        ctx.save(); ctx.translate(fcx+Math.cos(pa)*28, fcy+Math.sin(pa)*28); ctx.rotate(pa);
        ctx.beginPath(); ctx.ellipse(0,0,18,9,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      // Flower center
      ctx.beginPath(); ctx.arc(fcx,fcy,8,0,Math.PI*2);
      ctx.fillStyle = '#fffbe0'; ctx.fill(); ctx.fillStyle = theme.corner;
    });
    // Pink mist overlay (corners)
    [[0,0,'rgba(255,100,180,0.10)'],[W,0,'rgba(255,80,160,0.08)'],
     [0,H,'rgba(255,120,190,0.09)'],[W,H,'rgba(255,100,170,0.07)']].forEach(([mx,my,mc]) => {
      const mg = ctx.createRadialGradient(mx,my,0,mx,my,400);
      mg.addColorStop(0,mc); mg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.globalAlpha=1; ctx.fillStyle=mg; ctx.fillRect(0,0,W,H);
    });
  }

  ctx.restore();
}

// ─── Rank helpers ─────────────────────────────────────────────────────────────

function getRankName(level) {
  if (level < 5)  return 'NOVICE';
  if (level < 10) return 'BRONZE '  + romanTier(level - 5,  5,  3);
  if (level < 20) return 'ARGENT '  + romanTier(level - 10, 10, 3);
  if (level < 30) return 'OR '      + romanTier(level - 20, 10, 3);
  if (level < 40) return 'PLATINE ' + romanTier(level - 30, 10, 3);
  if (level < 50) return 'DIAMANT ' + romanTier(level - 40, 10, 3);
  if (level < 60) return 'MAITRE';
  if (level < 75) return 'GRAND MAITRE';
  return 'CHALLENGER';
}
function romanTier(d, r, s) {
  return ['III','II','I'][Math.min(s - 1, Math.floor(d / (r / s)))];
}
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

// ─── Drawing helpers ──────────────────────────────────────────────────────────

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
function drawPanel(ctx, x, y, w, h, theme) {
  roundedRect(ctx, x, y, w, h, 18);
  const bg = ctx.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, theme.panelBg1);
  bg.addColorStop(1, theme.panelBg2);
  ctx.fillStyle = bg; ctx.fill();
  roundedRect(ctx, x, y, w, h, 18);
  ctx.strokeStyle = theme.panelBorder; ctx.lineWidth = 1.5;
  ctx.shadowColor = theme.panelGlow; ctx.shadowBlur = 10;
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
function drawBarcode(ctx, x, y, theme) {
  const ws = [2,4,2,6,2,3,5,2,4,2,6,3,2,4,2,3,5,2,3,4];
  const c1 = theme.panelBorder.replace(/[\d.]+\)$/, '0.6)');
  const c2 = theme.panelBorder.replace(/[\d.]+\)$/, '0.4)');
  const cs = [c1, c2, theme.panelBorder.replace(/[\d.]+\)$/, '0.3)')];
  let bx = x - ws.reduce((a,b) => a+b,0) - ws.length * 2;
  ws.forEach((w, i) => {
    ctx.fillStyle = cs[i % cs.length];
    ctx.fillRect(bx, y - 22, w, 16); bx += w + 2;
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  const { username, discriminator, avatarUrl, data, theme: themeName } = JSON.parse(raw);

  const theme = getTheme(themeName);

  const W = 1400, H = 800;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

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
  const pal      = gemPalette(rankName, theme.gemOverride);

  const avatar = await loadImage(avatarUrl);

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = theme.bg1; ctx.fillRect(0, 0, W, H);
  const a1 = ctx.createRadialGradient(120, 80, 0, 120, 80, 420);
  a1.addColorStop(0, theme.aura1[0]); a1.addColorStop(0.3, theme.aura1[1]);
  a1.addColorStop(0.6, theme.aura1[2]); a1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = a1; ctx.fillRect(0, 0, W, H);
  const a2 = ctx.createRadialGradient(W-200, 100, 0, W-200, 100, 500);
  a2.addColorStop(0, theme.aura2[0]); a2.addColorStop(0.25, theme.aura2[1]);
  a2.addColorStop(0.5, theme.aura2[2]); a2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = a2; ctx.fillRect(0, 0, W, H);
  const a3 = ctx.createRadialGradient(W*0.5, H, 0, W*0.5, H, 300);
  a3.addColorStop(0, theme.aura1[1]); a3.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = a3; ctx.fillRect(0, 0, W, H);

  // ── Theme-specific background decorations ─────────────────────────────────
  drawThemeBackground(ctx, W, H, theme, themeName);

  // ── Grid overlay ──────────────────────────────────────────────────────────
  ctx.save(); ctx.strokeStyle = theme.grid; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 38) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 38) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.restore();

  // ── Card border + corners ─────────────────────────────────────────────────
  const dirs = [[1,1],[-1,1],[1,-1],[-1,-1]];
  const CX = 22, CY = 22, CW = W - 44, CH = H - 44, CR = 24;
  ctx.save(); roundedRect(ctx, CX, CY, CW, CH, CR);
  ctx.strokeStyle = theme.border; ctx.lineWidth = 3;
  ctx.shadowColor = theme.borderGlow; ctx.shadowBlur = 30; ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
  const bLen = 38, bT = 3;
  const corners = [[CX,CY],[CX+CW,CY],[CX,CY+CH],[CX+CW,CY+CH]];
  ctx.strokeStyle = theme.corner; ctx.lineWidth = bT;
  ctx.shadowColor = theme.cornerGlow; ctx.shadowBlur = 10;
  corners.forEach(([cx,cy],i) => {
    const [dx,dy] = dirs[i];
    ctx.beginPath();
    ctx.moveTo(cx+dx*bLen,cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+dy*bLen); ctx.stroke();
  }); ctx.shadowBlur = 0;

  // ── Theme label (top-left) ────────────────────────────────────────────────
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = theme.titleColor;
  ctx.shadowColor = theme.titleGlow; ctx.shadowBlur = 8;
  ctx.fillText(themeName ? themeName.toUpperCase() : 'HOLOGRAPHIQUE', 48, 76);
  ctx.shadowBlur = 0;

  // ── Avatar ────────────────────────────────────────────────────────────────
  const ax = 180, ay = 270, ar = 108;
  const ringGrad = ctx.createLinearGradient(ax-ar-12,ay-ar-12,ax+ar+12,ay+ar+12);
  theme.ringColors.forEach((c, i) => ringGrad.addColorStop(i / (theme.ringColors.length - 1), c));
  ctx.beginPath(); ctx.arc(ax, ay, ar+14, 0, Math.PI*2);
  ctx.strokeStyle = ringGrad; ctx.lineWidth = 14;
  ctx.shadowColor = theme.borderGlow; ctx.shadowBlur = 22; ctx.stroke(); ctx.shadowBlur = 0;
  [Math.PI*0.25,Math.PI*0.75,Math.PI*1.25,Math.PI*1.75].forEach(angle => {
    const r1 = ar+6, r2 = ar+22;
    ctx.beginPath();
    ctx.moveTo(ax+Math.cos(angle)*r1, ay+Math.sin(angle)*r1);
    ctx.lineTo(ax+Math.cos(angle)*r2, ay+Math.sin(angle)*r2);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
    ctx.shadowColor = theme.cornerGlow; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
  });
  ctx.save(); ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI*2); ctx.clip();
  ctx.drawImage(avatar, ax-ar, ay-ar, ar*2, ar*2); ctx.restore();
  ctx.beginPath(); ctx.arc(ax+74, ay+72, 15, 0, Math.PI*2);
  ctx.fillStyle = '#2ecc71'; ctx.shadowColor = '#2ecc71'; ctx.shadowBlur = 14;
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(ax+74, ay+72, 15, 0, Math.PI*2);
  ctx.strokeStyle = theme.bg1; ctx.lineWidth = 3; ctx.stroke();

  // ── Username + role ───────────────────────────────────────────────────────
  const nameX = 324;
  let namePx = 68; ctx.font = `bold ${namePx}px Arial`;
  while (ctx.measureText(username).width > 480 && namePx > 30) {
    namePx -= 2; ctx.font = `bold ${namePx}px Arial`;
  }
  ctx.fillStyle = '#ffffff'; ctx.shadowColor = theme.titleGlow; ctx.shadowBlur = 16;
  ctx.fillText(username, nameX, 220); ctx.shadowBlur = 0;
  ctx.font = '30px Arial'; ctx.fillStyle = theme.statColor;
  ctx.fillText(discriminator && discriminator !== '0' ? `#${discriminator}` : '', nameX+2, 268);
  ctx.font = 'bold 21px Arial';
  const badgeTxt = `  +  ${roleName}  `;
  const bw = ctx.measureText(badgeTxt).width;
  roundedRect(ctx, nameX, 282, bw, 40, 20);
  const bg2 = ctx.createLinearGradient(nameX, 282, nameX+bw, 322);
  bg2.addColorStop(0, theme.panelBg1.replace('0.94','0.35').replace('0.96','0.35').replace('0.97','0.35'));
  bg2.addColorStop(1, theme.panelBg2.replace('0.94','0.35').replace('0.96','0.35').replace('0.97','0.35'));
  ctx.fillStyle = bg2; ctx.fill();
  roundedRect(ctx, nameX, 282, bw, 40, 20);
  ctx.strokeStyle = theme.panelBorder; ctx.lineWidth = 1.5;
  ctx.shadowColor = theme.panelGlow; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = theme.titleColor; ctx.fillText(badgeTxt, nameX, 310);

  // ── Niveau panel ──────────────────────────────────────────────────────────
  const NX = 860, NY = 40, NW = 510, NH = 350;
  roundedRect(ctx, NX, NY, NW, NH, 20);
  const nbg = ctx.createLinearGradient(NX, NY, NX+NW, NY+NH);
  nbg.addColorStop(0, theme.panelBg1); nbg.addColorStop(1, theme.panelBg2);
  ctx.fillStyle = nbg; ctx.fill();
  const nBLen = 50;
  ctx.strokeStyle = theme.panelBorder; ctx.lineWidth = 1.5;
  ctx.shadowColor = theme.panelGlow; ctx.shadowBlur = 12;
  [[NX,NY],[NX+NW,NY],[NX,NY+NH],[NX+NW,NY+NH]].forEach(([cx,cy],i) => {
    const [dx,dy] = dirs[i];
    ctx.beginPath();
    ctx.moveTo(cx+dx*nBLen,cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+dy*nBLen); ctx.stroke();
  }); ctx.shadowBlur = 0;
  ctx.font = 'bold 44px Arial'; ctx.fillStyle = theme.titleColor;
  ctx.shadowColor = theme.panelGlow; ctx.shadowBlur = 10;
  ctx.fillText('NIVEAU', NX+36, NY+76); ctx.shadowBlur = 0;

  const lvlStr = String(level);
  const lvlPx = lvlStr.length > 2 ? 160 : 210;
  ctx.font = `bold ${lvlPx}px Arial`;
  const lvlMw = ctx.measureText(lvlStr).width;
  const lvlStartX = NX + (NW - lvlMw) / 2;
  const lvlGrad = ctx.createLinearGradient(lvlStartX, NY+100, lvlStartX+lvlMw, NY+NH-20);
  theme.levelColors.forEach((c, i) => lvlGrad.addColorStop(i / (theme.levelColors.length - 1), c));
  ctx.fillStyle = lvlGrad; ctx.shadowColor = theme.levelGlow; ctx.shadowBlur = 50;
  ctx.fillText(lvlStr, lvlStartX, NY+NH-30); ctx.shadowBlur = 0;

  // ── EXP bar ───────────────────────────────────────────────────────────────
  const EX = 42, EY = 418, EW = W-84, EH = 62;
  roundedRect(ctx, EX, EY, EW, EH, 14);
  const ebg = ctx.createLinearGradient(EX, EY, EX+EW, EY+EH);
  ebg.addColorStop(0, theme.panelBg1); ebg.addColorStop(1, theme.panelBg2);
  ctx.fillStyle = ebg; ctx.fill();
  roundedRect(ctx, EX, EY, EW, EH, 14);
  ctx.strokeStyle = theme.panelBorder; ctx.lineWidth = 1.5;
  ctx.shadowColor = theme.panelGlow; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.font = 'bold 26px Arial'; ctx.fillStyle = theme.statColor;
  ctx.fillText('EXP', EX+18, EY+40);
  const bX = EX+80, bY = EY+14, bW = EW-90-320, bH = EH-28;
  roundedRect(ctx, bX, bY, bW, bH, bH/2);
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fill();
  if (pct > 0) {
    const fw = Math.max(bH, bW*pct);
    const fg = ctx.createLinearGradient(bX, 0, bX+fw, 0);
    theme.barColors.forEach((c, i) => fg.addColorStop(i / (theme.barColors.length - 1), c));
    roundedRect(ctx, bX, bY, fw, bH, bH/2);
    ctx.fillStyle = fg; ctx.shadowColor = theme.borderGlow; ctx.shadowBlur = 20;
    ctx.fill(); ctx.shadowBlur = 0;
  }
  ctx.font = 'bold 26px Arial'; ctx.fillStyle = theme.statColor;
  ctx.textAlign = 'right';
  ctx.fillText(`${xp.toLocaleString('fr-FR')} / ${required.toLocaleString('fr-FR')} EXP`, EX+EW-18, EY+40);
  ctx.textAlign = 'left';

  // ── Bottom 3 panels ───────────────────────────────────────────────────────
  const PY = 506, PH = H-PY-48;
  const PW = (W-84-24)/3;
  const p1x = 42, p2x = p1x+PW+12, p3x = p2x+PW+12;

  // Stats panel
  drawPanel(ctx, p1x, PY, PW, PH, theme);
  ctx.font = 'bold 22px Arial'; ctx.fillStyle = theme.titleColor;
  ctx.shadowColor = theme.panelGlow; ctx.shadowBlur = 6;
  ctx.fillText('STATISTIQUES', p1x+18, PY+34); ctx.shadowBlur = 0;
  const voiceStr = voiceMin >= 60 ? `${Math.floor(voiceMin/60)}h` : `${voiceMin}m`;
  const msgStr   = messages >= 10000 ? `${Math.floor(messages/1000)}K`
                 : messages >= 1000  ? `${(messages/1000).toFixed(1)}K` : String(messages);
  const statsData = [
    { icon:'MSG', label:'MESSAGES', value: msgStr },
    { icon:'VOC', label:'VOCAL',    value: voiceStr },
    { icon:'FEU', label:'SERIE',    value: `${streak}J` }
  ];
  const colW = PW/3;
  statsData.forEach((s,i) => {
    const sx = p1x+14+i*colW;
    ctx.font = 'bold 16px Arial'; ctx.fillStyle = theme.statColor;
    ctx.shadowColor = theme.panelGlow; ctx.shadowBlur = 4;
    ctx.fillText(s.icon, sx, PY+74); ctx.shadowBlur = 0;
    ctx.font = '14px Arial'; ctx.fillStyle = theme.statColor; ctx.globalAlpha = 0.7;
    ctx.fillText(s.label, sx, PY+98); ctx.globalAlpha = 1;
    ctx.font = 'bold 30px Arial';
    const sg = ctx.createLinearGradient(sx, PY+100, sx+colW-10, PY+140);
    theme.barColors.slice(0,2).forEach((c,i) => sg.addColorStop(i, c));
    ctx.fillStyle = sg;
    ctx.fillText(s.value, sx, PY+136);
  });

  // Rang panel
  drawPanel(ctx, p2x, PY, PW, PH, theme);
  ctx.font = 'bold 22px Arial'; ctx.fillStyle = theme.titleColor;
  ctx.shadowColor = theme.panelGlow; ctx.shadowBlur = 6;
  const rangLabel = 'RANG ACTUEL';
  ctx.fillText(rangLabel, p2x+PW/2-ctx.measureText(rangLabel).width/2, PY+34);
  ctx.shadowBlur = 0;
  const gemCx = p2x+PW/2, gemCy = PY+PH/2-12;
  drawCrystalGem(ctx, gemCx, gemCy, 60, pal);
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px Arial';
  const rnG = ctx.createLinearGradient(p2x, PY+PH-48, p2x+PW, PY+PH-28);
  rnG.addColorStop(0, pal[0]); rnG.addColorStop(1, pal[1]);
  ctx.fillStyle = rnG; ctx.shadowColor = pal[0]; ctx.shadowBlur = 14;
  ctx.fillText(rankName, gemCx, PY+PH-26); ctx.shadowBlur = 0;
  ctx.textAlign = 'left';

  // Prochain niveau panel
  drawPanel(ctx, p3x, PY, PW, PH, theme);
  ctx.font = 'bold 22px Arial'; ctx.fillStyle = theme.titleColor;
  ctx.shadowColor = theme.panelGlow; ctx.shadowBlur = 6;
  ctx.fillText('PROCHAIN NIVEAU', p3x+18, PY+34); ctx.shadowBlur = 0;
  drawCrystalGem(ctx, p3x+60, PY+PH/2-8, 34, pal);
  ctx.font = 'bold 36px Arial';
  const nlG = ctx.createLinearGradient(p3x+98, PY+80, p3x+PW, PY+130);
  nlG.addColorStop(0, theme.titleColor); nlG.addColorStop(1, theme.statColor);
  ctx.fillStyle = nlG; ctx.fillText(`NIV. ${nextLvl}`, p3x+98, PY+118);
  ctx.font = 'bold 26px Arial'; ctx.fillStyle = theme.statColor;
  ctx.fillText(`${xpLeft.toLocaleString('fr-FR')} XP`, p3x+98, PY+158);
  ctx.font = '18px Arial'; ctx.fillStyle = theme.statColor; ctx.globalAlpha = 0.65;
  ctx.fillText('RESTANTES', p3x+98, PY+188); ctx.globalAlpha = 1;

  // Barcode
  drawBarcode(ctx, W-48, H-30, theme);

  // ── Export ────────────────────────────────────────────────────────────────
  const buf = await canvas.encode('png');
  process.stdout.write(buf);
  process.exit(0);
}

run().catch(err => {
  process.stderr.write('card-worker error: ' + err.message + '\n');
  process.exit(1);
});
