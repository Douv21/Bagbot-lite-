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
          message: 'Bienvenue {user} !',
          channel: ''
        },
        depart: {
          enabled: true,
          message: 'Au revoir {user} !',
          channel: ''
        }
      });
    }
  } catch (error) {
    console.error('Erreur chargement:', error);
    res.status(500).json({ error: 'Erreur chargement' });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Dashboard running on port ${PORT}`);
});
