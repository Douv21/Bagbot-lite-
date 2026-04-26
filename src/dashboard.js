require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 49501;

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers JPEG, PNG, GIF et WebP sont autorisés'));
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Route principale
app.get('/', (req, res) => {
  // Si aucun serveur n'est sélectionné, rediriger vers la sélection
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Route pour le pull depuis GitHub
app.post('/api/pull', async (req, res) => {
  try {
    console.log('🔄 Pull depuis GitHub...');
    
    exec('git pull origin main', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('Erreur git pull:', error);
        return res.status(500).json({ error: 'Erreur lors du pull', details: stderr });
      }
      
      console.log('Pull réussi:', stdout);
      
      // Installer les dépendances si package.json a changé
      exec('npm install', { cwd: path.join(__dirname, '..') }, (installError, installStdout, installStderr) => {
        if (installError) {
          console.error('Erreur npm install:', installError);
          return res.status(500).json({ error: 'Erreur lors de npm install', details: installStderr });
        }
        
        console.log('npm install réussi');
        
        // Redémarrer PM2
        exec('pm2 restart all', (pm2Error, pm2Stdout, pm2Stderr) => {
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
    const logPath = path.join(__dirname, '../logs', 'bagbot-out.log');
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
    const logPath = path.join(__dirname, '../logs', 'dashboard-out.log');
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

// Route pour l'upload d'images
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// Route pour la configuration de bienvenue/départ
app.get('/api/welcome-depart/:guildId', (req, res) => {
  try {
    const configPath = path.join(__dirname, '../data/welcome-depart.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const guildConfig = config.guilds[req.params.guildId] || null;
      res.json({ config: guildConfig });
    } else {
      res.json({ config: null });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur lecture configuration' });
  }
});

app.post('/api/welcome-depart/:guildId', (req, res) => {
  try {
    const configPath = path.join(__dirname, '../data/welcome-depart.json');
    let config = { guilds: {} };
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    if (!config.guilds[req.params.guildId]) {
      config.guilds[req.params.guildId] = {};
    }
    
    config.guilds[req.params.guildId] = req.body;
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde configuration:', error);
    res.status(500).json({ error: 'Erreur sauvegarde configuration' });
  }
});

// API pour obtenir les channels d'un serveur (placeholder)
app.get('/api/guilds/:guildId/channels', (req, res) => {
  // Pour l'instant, retourne une liste vide
  // Cette fonctionnalité nécessitera d'accéder au client Discord du bot
  res.json({ channels: [] });
});

// API pour obtenir les rôles d'un serveur (placeholder)
app.get('/api/guilds/:guildId/roles', (req, res) => {
  // Pour l'instant, retourne une liste vide
  // Cette fonctionnalité nécessitera d'accéder au client Discord du bot
  res.json({ roles: [] });
});

app.listen(PORT, () => {
  console.log(`✓ Dashboard running on port ${PORT}`);
});
