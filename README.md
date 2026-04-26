# BAG Bot Lite

Un bot Discord simple et léger avec dashboard et déploiement automatique.

## Installation locale

1. Cloner le dépôt
2. Installer les dépendances : `npm install`
3. Créer un fichier `.env` avec vos variables d'environnement (voir `.env.example`)
4. Déployer les commandes : `npm run register`
5. Démarrer le bot : `npm start`

## Installation sur Debian avec PM2

1. Cloner le dépôt sur le serveur :
```bash
cd /home/maison
git clone https://github.com/Douv21/Bagbot-lite-.git bagbot
cd bagbot
```

2. Installer les dépendances :
```bash
npm install
```

3. Créer le fichier `.env` :
```bash
cp .env.example .env
nano .env
```
Ajoutez vos valeurs :
```
DISCORD_TOKEN=votre_token
CLIENT_ID=votre_client_id
GUILD_ID=votre_guild_id
PORT=49501
WEBHOOK_PORT=49502
WEBHOOK_SECRET=votre_secret_aleatoire
```

4. Créer le dossier logs :
```bash
mkdir logs
```

5. Déployer les commandes :
```bash
npm run register
```

6. Démarrer avec PM2 :
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Variables d'environnement

- `DISCORD_TOKEN` : Token de votre bot Discord
- `CLIENT_ID` : ID de votre application Discord
- `GUILD_ID` : ID de votre serveur de test
- `PORT` : Port du dashboard (défaut: 49501)
- `WEBHOOK_PORT` : Port du webhook GitHub (défaut: 49502)
- `WEBHOOK_SECRET` : Secret pour sécuriser le webhook GitHub

## Commandes

- `/ping` : Répond Pong!
- `/bonjour` : Dit bonjour

## Dashboard

Le dashboard est accessible sur `http://votre_ip:49501`

Routes API :
- `POST /api/pull` : Pull depuis GitHub et redémarrage
- `GET /api/logs/bot` : Logs du bot
- `GET /api/logs/dashboard` : Logs du dashboard
- `GET /api/status` : Statut PM2

## Webhook GitHub (Auto-pull)

Pour activer le pull automatique depuis GitHub :

1. Allez sur votre dépôt GitHub
2. Settings > Webhooks > Add webhook
3. Payload URL : `http://votre_ip:49502/webhook/github`
4. Secret : votre `WEBHOOK_SECRET`
5. Content type : `application/json`
6. Events : Push events

Chaque push sur la branche `main` déclenchera automatiquement :
- Git pull
- npm install
- Redémarrage PM2
