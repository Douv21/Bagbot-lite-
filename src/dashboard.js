require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 49501;

app.use(express.json());
app.use(express.static('public'));

// Route pour le pull depuis GitHub
app.post('/api/pull', async (req, res) => {
  try {
    console.log('🔄 Pull depuis GitHub...');
    
    exec('git pull origin main', { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error('Erreur git pull:', error);
        return res.status(500).json({ error: 'Erreur lors du pull', details: stderr });
      }
      
      console.log('Pull réussi:', stdout);
      
      // Installer les dépendances si package.json a changé
      exec('npm install', { cwd: process.cwd() }, (installError, installStdout, installStderr) => {
        if (installError) {
          console.error('Erreur npm install:', installError);
          return res.status(500).json({ error: 'Erreur lors de npm install', details: installStderr });
        }
        
        console.log('npm install réussi');
        
        // Redémarrer PM2
        exec('pm2 restart bagbot', (pm2Error, pm2Stdout, pm2Stderr) => {
          if (pm2Error) {
            console.error('Erreur PM2 restart:', pm2Error);
            return res.status(500).json({ error: 'Erreur lors du redémarrage PM2', details: pm2Stderr });
          }
          
          console.log('PM2 restart réussi');
          res.json({ success: true, message: 'Pull et redémarrage réussis' });
        });
      });
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour voir les logs du bot
app.get('/api/logs/bot', (req, res) => {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'bagbot-out.log');
    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf8');
      res.json({ logs: logs.slice(-5000) }); // Derniers 5000 caractères
    } else {
      res.json({ logs: 'Aucun log disponible' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur lecture des logs' });
  }
});

// Route pour voir les logs du dashboard
app.get('/api/logs/dashboard', (req, res) => {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'dashboard-out.log');
    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf8');
      res.json({ logs: logs.slice(-5000) });
    } else {
      res.json({ logs: 'Aucun log disponible' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur lecture des logs' });
  }
});

// Route pour le statut PM2
app.get('/api/status', (req, res) => {
  exec('pm2 status', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur PM2 status' });
    }
    res.json({ status: stdout });
  });
});

app.listen(PORT, () => {
  console.log(`✓ Dashboard running on port ${PORT}`);
});
