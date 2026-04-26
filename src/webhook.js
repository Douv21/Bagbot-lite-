require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 49502;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key';

app.use(express.json());

// Webhook GitHub pour le pull automatique
app.post('/webhook/github', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  
  if (!signature) {
    console.log('⚠️ Webhook sans signature');
    return res.status(401).json({ error: 'No signature' });
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

  if (signature !== digest) {
    console.log('⚠️ Signature invalide');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('✅ Webhook GitHub reçu');
  
  // Vérifier que c'est un push sur main
  if (req.body.ref === 'refs/heads/main') {
    console.log('🔄 Pull depuis GitHub...');
    
    exec('git pull origin main', { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erreur git pull:', error);
        return;
      }
      
      console.log('✅ Pull réussi:', stdout);
      
      // Installer les dépendances
      exec('npm install', { cwd: process.cwd() }, (installError, installStdout, installStderr) => {
        if (installError) {
          console.error('❌ Erreur npm install:', installError);
          return;
        }
        
        console.log('✅ npm install réussi');
        
        // Redémarrer PM2
        exec('pm2 restart all', (pm2Error, pm2Stdout, pm2Stderr) => {
          if (pm2Error) {
            console.error('❌ Erreur PM2 restart:', pm2Error);
            return;
          }
          
          console.log('✅ PM2 restart réussi');
        });
      });
    });
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✓ Webhook server running on port ${PORT}`);
});
