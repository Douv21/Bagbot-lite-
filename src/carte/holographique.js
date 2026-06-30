// holographique.js — thin launcher.
// All canvas work runs in card-worker.js (child process).
// If canvas causes SIGILL on this machine, only the child dies; the bot survives.

const { spawn }             = require('child_process');
const path                  = require('path');
const { AttachmentBuilder } = require('discord.js');

const WORKER     = path.join(__dirname, 'card-worker.js');
const TIMEOUT_MS = 30_000; // 30s — CDN peut être lent

module.exports = async (memberOrUser, data, theme) => {
  try {
    // Accept GuildMember, User, or null (fallback gracefully)
    const user = memberOrUser?.user ?? memberOrUser;
    if (!user) throw new Error('No user provided to genCard');

    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true });
    const username  = user.username || user.globalName || 'Membre';

    const payload = JSON.stringify({
      username,
      discriminator: user.discriminator || '0',
      avatarUrl,
      data,
      theme: theme || 'holographique'
    });

    const buf = await new Promise((resolve, reject) => {
      const child  = spawn(process.execPath, [WORKER], { stdio: ['pipe','pipe','pipe'], cwd: __dirname });
      const chunks = [];

      child.stdout.on('data', c => chunks.push(c));
      child.stderr.on('data', d => process.stderr.write('[card-worker] ' + d));

      child.on('close', code => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`card-worker exited with code ${code}`));
        }
      });
      child.on('error', reject);

      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('card-worker timeout'));
      }, TIMEOUT_MS);
      child.on('close', () => clearTimeout(timer));

      child.stdin.write(payload);
      child.stdin.end();
    });

    return new AttachmentBuilder(buf, { name: 'niveau-card.png' });
  } catch (err) {
    console.error('❌ Carte indisponible:', err.message);
    return null;
  }
};
