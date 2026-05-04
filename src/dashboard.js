require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 49501;

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'bagbot-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 heures
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Route de connexion Discord
app.get('/login', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.DISCORD_CALLBACK_URL || `http://localhost:${PORT}/callback`);
  const scope = encodeURIComponent('identify guilds guilds.members.read');
  res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`);
});

// Callback Discord OAuth2
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // Échanger le code contre un token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.DISCORD_CALLBACK_URL || `http://localhost:${PORT}/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error);
    }

    // Récupérer les infos utilisateur
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Récupérer les serveurs de l'utilisateur
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const guildsData = await guildsResponse.json();

    // Sauvegarder en session
    req.session.user = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      guilds: guildsData
    };

    res.redirect('/');
  } catch (error) {
    console.error('Erreur OAuth2:', error);
    res.redirect('/?error=oauth_failed');
  }
});

// Route de déconnexion
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// API pour obtenir l'utilisateur connecté
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ 
      authenticated: true, 
      user: {
        id: req.session.user.id,
        username: req.session.user.username,
        discriminator: req.session.user.discriminator,
        avatar: req.session.user.avatar,
        guilds: req.session.user.guilds
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// API pour obtenir les serveurs (filtrés)
app.get('/api/guilds', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.guilds) {
      return res.json([]);
    }

    const userGuilds = req.session.user.guilds;
    const filteredGuilds = [];

    // Récupérer les serveurs où le bot est présent via l'API locale du bot
    const botApiPort = process.env.BOT_API_PORT || 49502;
    const botGuildsResponse = await fetch(`http://localhost:${botApiPort}/guilds`);

    let botGuilds = [];
    if (botGuildsResponse.ok) {
      botGuilds = await botGuildsResponse.json();
    } else {
      console.error('Error fetching bot guilds:', botGuildsResponse.status, botGuildsResponse.statusText);
    }

    const botGuildIds = new Set(botGuilds.map(g => g.id));

    console.log('Bot guilds:', botGuildIds);
    console.log('User guilds:', userGuilds.map(g => ({ id: g.id, name: g.name, owner: g.owner, permissions: g.permissions })));

    // Filtrer les serveurs
    for (const guild of userGuilds) {
      // Vérifier si le bot est sur le serveur
      if (!botGuildIds.has(guild.id)) {
        console.log(`Guild ${guild.name} (${guild.id}): Bot not present`);
        continue;
      }

      // Vérifier les permissions (owner, admin, ou modo)
      // Les permissions sont une chaîne hexadécimale
      const permissions = parseInt(guild.permissions, 16);
      
      // 0x8 = Administrator, 0x20 = Manage Server, 0x10000000 = Kick Members, 0x20000000 = Ban Members
      const hasPermissions = guild.owner || 
        (permissions & 0x8) || // Administrator
        (permissions & 0x20) || // Manage Server
        (permissions & 0x10000000) || // Kick Members
        (permissions & 0x20000000); // Ban Members

      console.log(`Guild ${guild.name} (${guild.id}): Owner=${guild.owner}, Permissions=${permissions}, HasPermissions=${hasPermissions}`);

      if (hasPermissions) {
        filteredGuilds.push(guild);
      }
    }

    console.log('Filtered guilds:', filteredGuilds.map(g => g.name));
    res.json(filteredGuilds);
  } catch (error) {
    console.error('Error filtering guilds:', error);
    res.json([]);
  }
});

// API pour sélectionner un serveur
app.post('/api/select-guild', (req, res) => {
  const { guildId } = req.body;
  if (req.session.user) {
    req.session.selectedGuild = guildId;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// API pour obtenir le serveur sélectionné
app.get('/api/selected-guild', (req, res) => {
  if (req.session.selectedGuild) {
    res.json({ guildId: req.session.selectedGuild });
  } else {
    res.json({ guildId: null });
  }
});

// API pour sauvegarder la configuration (par serveur)
app.post('/api/config', (req, res) => {
  try {
    if (!req.session.selectedGuild) {
      return res.status(400).json({ error: 'No guild selected' });
    }
    
    const configDir = path.join(__dirname, '../configs');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
    
    const configPath = path.join(configDir, `${req.session.selectedGuild}.json`);
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    res.status(500).json({ error: 'Erreur sauvegarde' });
  }
});

// API pour charger la configuration (par serveur)
app.get('/api/config', (req, res) => {
  try {
    if (!req.session.selectedGuild) {
      return res.json({
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
    
    const configPath = path.join(__dirname, '../configs', `${req.session.selectedGuild}.json`);
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

// API pour récupérer les channels (via API locale du bot)
app.get('/api/channels', async (req, res) => {
  try {
    if (!req.session.user || !req.session.selectedGuild) {
      return res.json([]);
    }

    const botApiPort = process.env.BOT_API_PORT || 49502;
    const response = await fetch(`http://localhost:${botApiPort}/guilds/${req.session.selectedGuild}/channels`);

    if (!response.ok) {
      console.error('Error fetching channels:', response.status, response.statusText);
      return res.json([]);
    }

    const channels = await response.json();
    // Filtrer seulement les channels textuels
    const textChannels = channels.filter(ch => ch.type === 0).map(ch => ({
      id: ch.id,
      name: ch.name
    }));
    res.json(textChannels);
  } catch (error) {
    console.error('Erreur chargement channels:', error);
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`✓ Dashboard running on port ${PORT}`);
});
