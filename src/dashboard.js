require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 49501;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API pour sauvegarder la configuration
app.post('/api/config', (req, res) => {
  try {
    const configPath = path.join(__dirname, '../config.json');
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    res.status(500).json({ error: 'Erreur sauvegarde' });
  }
});

// API pour charger la configuration
app.get('/api/config', (req, res) => {
  try {
    const configPath = path.join(__dirname, '../config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      res.json(config);
    } else {
      res.json({
        welcome: {
          enabled: true,
          title: '👋 Bienvenue',
          message: 'Bienvenue {user} sur le serveur !',
          color: '#C41E3A',
          image: '',
          thumbnail: '',
          authorName: '',
          authorIcon: '',
          footerText: '',
          footerIcon: '',
          channel: ''
        },
        depart: {
          enabled: true,
          title: '👋 Au revoir',
          message: 'Au revoir {user} !',
          color: '#C41E3A',
          image: '',
          thumbnail: '',
          authorName: '',
          authorIcon: '',
          footerText: '',
          footerIcon: '',
          channel: ''
        }
      });
    }
  } catch (error) {
    console.error('Erreur chargement:', error);
    res.status(500).json({ error: 'Erreur chargement' });
  }
});

// API pour récupérer les channels (mock pour l'instant)
app.get('/api/channels', (req, res) => {
  try {
    // Pour l'instant, retourne des channels mockés
    // Plus tard, cela utilisera le bot Discord pour récupérer les vrais channels
    const channels = [
      { id: 'general', name: 'général' },
      { id: 'welcome', name: 'bienvenue' },
      { id: 'announcements', name: 'annonces' },
      { id: 'rules', name: 'règlement' }
    ];
    res.json(channels);
  } catch (error) {
    console.error('Erreur chargement channels:', error);
    res.status(500).json({ error: 'Erreur chargement channels' });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Dashboard running on port ${PORT}`);
});
