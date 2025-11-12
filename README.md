# 🔍 Bot Recherche iPhone

Bot de recherche d'annonces iPhone sur **Vinted** (multi-pays). Architecture full Docker avec HTTPS.

## 📋 Fonctionnalités

- ✅ Scraping automatique Vinted sur 14 pays (FR, BE, NL, LU, ES, IT, DE, AT, CZ, PL, LT, UK, US, CA)
- ✅ Scraping parallèle pour des résultats rapides
- ✅ Interface web moderne et responsive (React + TailwindCSS)
- ✅ Cache Redis pour des performances optimales (1h TTL)
- ✅ Déploiement full Docker
- ✅ Support HTTPS
- ✅ Badges par source et pays
- ✅ API REST robuste avec rate limiting

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│     monbot.woutils.com (HTTPS)          │
│     [System Nginx - Optional]           │
│     Ports 80, 443 → localhost:5080      │
└───────────────┬─────────────────────────┘
                │
       ┌────────▼──────────┐
       │  nginx-proxy      │ (Ports 5080, 5443)
       │  (Docker)         │
       └────────┬──────────┘
                │
       ┌────────▼──────────┐
       │  frontend         │ (React + Vite + Nginx)
       └───────────────────┘
                │
       ┌────────▼──────────┐
       │  backend          │ (Node.js + Express)
       │  + Vinted API     │ (14 countries)
       └────────┬──────────┘
                │
       ┌────────▼──────────┐
       │  redis            │ (Cache 1h)
       └───────────────────┘
```

**4 containers Docker:**
- `nginx-proxy`: Reverse proxy interne (ports 5080:80, 5443:443)
- `frontend`: Application React (build statique servi par Nginx)
- `backend`: API Node.js avec scraper Vinted multi-pays
- `redis`: Cache des résultats (TTL 1h)

## 🚀 Démarrage Rapide

### Prérequis

- Docker v24+ installé
- Docker Compose v2+ installé
- Domaine configuré pointant vers votre VPS (optionnel)
- Ports 5080 et 5443 disponibles (ou ports 80/443 si reverse proxy système)

### Installation

1. **Cloner le projet**
```bash
git clone <repo-url>
cd bot_search_phone
```

2. **Déployer l'application**
```bash
chmod +x deploy.sh
./deploy.sh
```

3. **Vérifier le déploiement**
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

🎉 Votre application est maintenant accessible à :
- **Direct Docker**: `http://localhost:5080` ou `https://localhost:5443`
- **Avec reverse proxy système**: `https://monbot.woutils.com`

### Configuration HTTPS avec domaine (optionnel)

Si vous voulez accéder via un nom de domaine sur les ports standards (80/443):

1. **Installer Nginx système**
```bash
sudo apt update && sudo apt install nginx certbot python3-certbot-nginx -y
```

2. **Configurer le reverse proxy**
```bash
sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/monbot.woutils.com
sudo ln -s /etc/nginx/sites-available/monbot.woutils.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

3. **Obtenir un certificat SSL Let's Encrypt**
```bash
sudo certbot --nginx -d monbot.woutils.com
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
  "vinted": {
    "count": 87,
    "success": true
  },
  "results": [
    {
      "title": "iPhone 14 Pro 128Go",
      "price": "850 €",
      "link": "https://www.vinted.fr/items/...",
      "image": "https://...",
      "location": "Paris",
      "date": "12/01/2025",
      "condition": "good",
      "seller": "username",
      "source": "vinted",
      "country": "France",
      "countryCode": "fr"
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

- **Vinted**: Utilise l'API publique non officielle. Usage personnel uniquement.
- **Rate limiting**: Configuré pour éviter de surcharger les serveurs.
- **Multi-pays**: Scraping parallèle de 14 pays Vinted.

**Usage recommandé**: Personnel, recherche, éducation uniquement. Ne pas revendre les données.

## 🛠️ Stack Technique

**Backend:**
- Node.js 18
- Express.js
- Axios (Vinted API multi-pays)
- Redis (cache 1h)
- Winston (logs)
- Express Rate Limit
- Helmet (security)

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
