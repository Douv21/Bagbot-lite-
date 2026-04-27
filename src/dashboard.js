require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

// Variable globale pour le client Discord (sera partagée avec le bot)
let botClient = null;

const app = express();
const PORT = process.env.PORT || 49501;

// Configuration de la session
app.use(session({
  secret: process.env.SESSION_SECRET || 'bagbot-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24h
}));

// Configuration de Passport
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL || 'http://localhost:49501/auth/callback',
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  profile.refreshToken = refreshToken;
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

// Middleware d'authentification
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Non authentifié' });
}

// API pour définir le client Discord (appelée par le bot au démarrage)
app.post('/api/set-bot-client', (req, res) => {
  // Cette API sera appelée par le bot pour partager son client
  // Pour l'instant, nous allons utiliser une approche différente
  // Le bot et le dashboard doivent être séparés pour éviter les conflits
  res.json({ success: false, message: 'Non implémenté - utiliser API REST à la place' });
});

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
app.get('/', ensureAuthenticated, (req, res) => {
  // Si aucun serveur n'est sélectionné, rediriger vers la sélection
  if (!req.session.selectedGuild) {
    res.sendFile(path.join(__dirname, '../public/select-server.html'));
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Routes d'authentification Discord
app.get('/auth/login', passport.authenticate('discord'));

app.get('/auth/callback', passport.authenticate('discord', {
  failureRedirect: '/auth/login'
}), (req, res) => {
  res.redirect('/');
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erreur logout:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

// API pour obtenir les infos de l'utilisateur connecté
app.get('/api/user', ensureAuthenticated, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      discriminator: req.user.discriminator,
      avatar: req.user.avatar,
      guilds: req.user.guilds
    }
  });
});

// API pour sélectionner un serveur
app.post('/api/select-guild', ensureAuthenticated, (req, res) => {
  const { guildId } = req.body;
  
  if (!guildId) {
    return res.status(400).json({ error: 'Guild ID requis' });
  }
  
  // Vérifier si l'utilisateur est admin de ce serveur
  const userGuilds = req.user.guilds || [];
  const guild = userGuilds.find(g => g.id === guildId);
  
  if (!guild) {
    return res.status(403).json({ error: 'Vous n\'êtes pas membre de ce serveur' });
  }
  
  const isAdmin = guild.permissions & 0x8 || guild.owner === true;
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Vous n\'êtes pas administrateur de ce serveur' });
  }
  
  // Sauvegarder le serveur sélectionné dans la session
  req.session.selectedGuild = guild;
  
  res.json({ success: true, guild });
});

// API pour obtenir le serveur sélectionné
app.get('/api/selected-guild', ensureAuthenticated, (req, res) => {
  res.json({ guild: req.session.selectedGuild || null });
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

// API pour obtenir les channels d'un serveur (via Discord REST API)
app.get('/api/guilds/:guildId/channels', ensureAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const accessToken = req.user.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token non disponible' });
    }
    
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erreur Discord API' });
    }
    
    const channels = await response.json();
    
    // Filtrer seulement les channels textuels et trier par nom
    const textChannels = channels
      .filter(channel => channel.type === 0)
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({ channels: textChannels });
  } catch (error) {
    console.error('Erreur récupération channels:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des channels' });
  }
});

// API pour obtenir les rôles d'un serveur (via Discord REST API)
app.get('/api/guilds/:guildId/roles', ensureAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const accessToken = req.user.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token non disponible' });
    }
    
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erreur Discord API' });
    }
    
    const roles = await response.json();
    
    // Filtrer @everyone et trier par position
    const filteredRoles = roles
      .filter(role => role.name !== '@everyone')
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : null
      }))
      .sort((a, b) => b.position - a.position);
    
    res.json({ roles: filteredRoles });
  } catch (error) {
    console.error('Erreur récupération rôles:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des rôles' });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Dashboard running on port ${PORT}`);
});
