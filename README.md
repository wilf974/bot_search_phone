# 🔍 Bot Recherche iPhone

Bot de recherche d'annonces iPhone sur **Leboncoin** et **Vinted**. Architecture full Docker avec HTTPS.

## 📋 Fonctionnalités

- ✅ Scraping automatique de Leboncoin et Vinted
- ✅ Interface web moderne et responsive (React + TailwindCSS)
- ✅ Cache Redis pour des performances optimales
- ✅ Déploiement full Docker
- ✅ HTTPS automatique avec Let's Encrypt
- ✅ Filtrage et tri des résultats
- ✅ API REST robuste avec rate limiting

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│     monbot.woutils.com (HTTPS)          │
└───────────────┬─────────────────────────┘
                │
       ┌────────▼──────────┐
       │  nginx-proxy      │ (Ports 80, 443)
       │  + certbot        │
       └────────┬──────────┘
                │
       ┌────────▼──────────┐
       │  frontend         │ (React + Vite)
       └───────────────────┘
                │
       ┌────────▼──────────┐
       │  backend          │ (Node.js + Express)
       │  + Puppeteer      │
       └────────┬──────────┘
                │
       ┌────────▼──────────┐
       │  redis            │ (Cache)
       └───────────────────┘
```

**5 containers Docker:**
- `nginx-proxy`: Reverse proxy + SSL termination
- `certbot`: Gestion automatique des certificats SSL
- `frontend`: Application React (build statique)
- `backend`: API Node.js avec scrapers Puppeteer
- `redis`: Cache des résultats

## 🚀 Démarrage Rapide

### Prérequis

- Docker v24+ installé
- Docker Compose v2+ installé
- Domaine configuré pointant vers votre VPS
- Ports 80 et 443 ouverts

### Installation

1. **Cloner le projet**
```bash
git clone <repo-url>
cd bot_search_phone
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Modifier .env si nécessaire
```

3. **Configurer le domaine et l'email pour SSL**
```bash
# Éditer scripts/init-letsencrypt.sh
nano scripts/init-letsencrypt.sh
# Modifier:
# - domains=(monbot.woutils.com)  # Votre domaine
# - email="your-email@example.com"  # Votre email
```

4. **Initialiser SSL (première fois uniquement)**
```bash
./scripts/init-letsencrypt.sh
```

5. **Déployer l'application**
```bash
./scripts/deploy.sh
```

6. **Vérifier le déploiement**
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

🎉 Votre application est maintenant accessible à : `https://monbot.woutils.com`

## 💻 Développement Local

### Démarrage

```bash
# Installer les dépendances backend
cd backend && npm install

# Installer les dépendances frontend
cd frontend && npm install

# Démarrer tous les services
docker compose up -d

# Accéder à l'application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# Redis: localhost:6379
```

### Logs en temps réel

```bash
docker compose logs -f
docker compose logs -f backend  # Backend uniquement
docker compose logs -f frontend # Frontend uniquement
```

## 📡 API Endpoints

### `GET /api/health`
Health check de l'API

**Réponse:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-12T10:00:00.000Z",
  "uptime": 3600
}
```

### `GET /api/search`
Rechercher des annonces

**Paramètres:**
- `query` (string, optionnel): Terme de recherche (défaut: "iphone")
- `maxResults` (number, optionnel): Nombre max de résultats par source (défaut: 50, max: 100)

**Exemple:**
```bash
curl "https://monbot.woutils.com/api/search?query=iphone%2014&maxResults=50"
```

**Réponse:**
```json
{
  "success": true,
  "cached": false,
  "total": 87,
  "leboncoin": {
    "count": 45,
    "success": true
  },
  "vinted": {
    "count": 42,
    "success": true
  },
  "results": [
    {
      "title": "iPhone 14 Pro 128Go",
      "price": "850€",
      "link": "https://www.leboncoin.fr/...",
      "image": "https://...",
      "location": "Paris",
      "date": "Aujourd'hui",
      "source": "leboncoin"
    },
    ...
  ],
  "query": "iphone 14",
  "timestamp": "2025-01-12T10:00:00.000Z"
}
```

## 🔧 Commandes Docker Utiles

```bash
# Démarrer les services
docker compose -f docker-compose.prod.yml up -d

# Arrêter les services
docker compose -f docker-compose.prod.yml down

# Rebuild et redémarrer
docker compose -f docker-compose.prod.yml up -d --build

# Logs
docker compose -f docker-compose.prod.yml logs -f

# Status des containers
docker compose -f docker-compose.prod.yml ps

# Exécuter une commande dans un container
docker exec -it bot_backend sh
docker exec -it bot_frontend sh

# Redémarrer un service spécifique
docker compose -f docker-compose.prod.yml restart backend

# Voir l'utilisation des ressources
docker stats
```

## 🔐 SSL / HTTPS

Les certificats SSL sont gérés automatiquement par Let's Encrypt via Certbot.

### Renouvellement manuel

```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml restart nginx-proxy
```

Le renouvellement automatique est configuré pour se faire tous les 12h via le container `certbot`.

## 💾 Backup

### Créer un backup

```bash
./scripts/backup.sh
```

Sauvegarde:
- Les données Redis
- Les certificats SSL
- Le fichier .env

Les backups sont stockés dans `./backups/` et seuls les 7 derniers sont conservés.

## 🐛 Dépannage

### Les services ne démarrent pas

```bash
# Vérifier les logs
docker compose -f docker-compose.prod.yml logs

# Vérifier le statut
docker compose -f docker-compose.prod.yml ps

# Redémarrer tout
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Erreur SSL / Certificat

```bash
# Vérifier la configuration nginx
docker exec bot_nginx_proxy nginx -t

# Réinitialiser SSL
./scripts/init-letsencrypt.sh
```

### Le scraping ne fonctionne pas

```bash
# Vérifier les logs du backend
docker compose -f docker-compose.prod.yml logs backend

# Tester manuellement l'API
curl http://localhost:3000/api/health
curl "http://localhost:3000/api/search?query=iphone"
```

### Redis inaccessible

```bash
# Vérifier Redis
docker exec -it bot_redis redis-cli ping
# Devrait répondre: PONG

# Vider le cache si nécessaire
docker exec -it bot_redis redis-cli FLUSHALL
```

## 📊 Monitoring

### Voir les métriques en temps réel

```bash
docker stats
```

### Logs d'accès Nginx

```bash
docker exec bot_nginx_proxy tail -f /var/log/nginx/access.log
```

### Surveiller Redis

```bash
docker exec -it bot_redis redis-cli INFO
docker exec -it bot_redis redis-cli DBSIZE
```

## ⚠️ Considérations Légales

- **Leboncoin**: Le scraping est interdit par leurs CGU. Utilisez avec modération et à vos risques.
- **Vinted**: API non officielle, usage personnel uniquement.
- **Rate limiting**: Configuré pour éviter de surcharger les serveurs.
- **Respect du robots.txt**: Les scrapers respectent les délais recommandés.

**Usage recommandé**: Personnel, recherche, éducation uniquement. Ne pas revendre les données.

## 🛠️ Stack Technique

**Backend:**
- Node.js 18
- Express.js
- Puppeteer (Leboncoin)
- Axios (Vinted)
- Redis
- Winston (logs)

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Axios

**Infrastructure:**
- Docker & Docker Compose
- Nginx (reverse proxy)
- Certbot (SSL)
- Redis (cache)

## 📝 Structure du Projet

```
bot_search_phone/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Contrôleurs API
│   │   ├── middleware/      # Middleware Express
│   │   ├── routes/          # Routes API
│   │   ├── scrapers/        # Scrapers Leboncoin/Vinted
│   │   ├── utils/           # Utilitaires (cache, logger)
│   │   └── index.js         # Point d'entrée
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants React
│   │   ├── services/        # Services API
│   │   ├── styles/          # CSS/TailwindCSS
│   │   ├── App.jsx          # Composant principal
│   │   └── main.jsx         # Point d'entrée
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   ├── conf.d/
│   │   └── default.conf     # Config serveur
│   ├── nginx.conf           # Config globale
│   └── Dockerfile
├── scripts/
│   ├── init-letsencrypt.sh  # Init SSL
│   ├── deploy.sh            # Déploiement
│   └── backup.sh            # Backup
├── docker-compose.yml       # Dev
├── docker-compose.prod.yml  # Production
├── .env.example
├── .gitignore
├── .dockerignore
├── todo.md
└── README.md
```

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT

## 🙏 Remerciements

- Leboncoin & Vinted pour les données
- Let's Encrypt pour les certificats SSL gratuits
- La communauté open source

---

**Note**: Ce projet est à but éducatif. Assurez-vous de respecter les conditions d'utilisation des sites scrappés.
