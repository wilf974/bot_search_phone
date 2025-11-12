# Bot de Recherche iPhone - Leboncoin & Vinted

## 📋 Vue d'ensemble du projet

Application web permettant de rechercher des annonces d'iPhone sur Leboncoin et Vinted, accessible via HTTPS à l'adresse `monbot.woutils.com`.

---

## 🎯 Objectifs

- ✅ Interface web simple avec bouton de recherche
- ✅ Scraping automatique de Leboncoin et Vinted
- ✅ Affichage des résultats agrégés des deux plateformes
- ✅ Déploiement sécurisé en HTTPS sur VPS
- ✅ Architecture professionnelle et maintenable

---

## 🏗️ Architecture Technique Recommandée

### Stack Technologique (Full Docker)

**Backend:**
- **Node.js** + **Express** - Serveur API REST
- **Puppeteer** - Scraping Leboncoin (gestion JavaScript)
- **pyVinted** (via API Python) ou **vinted-api-wrapper** - Scraping Vinted
- **Cheerio** - Parsing HTML rapide
- **Redis** - Cache des résultats (container dédié)

**Frontend:**
- **React** + **Vite** - Interface moderne et rapide
- **TailwindCSS** - Design responsive
- **Axios** - Requêtes API

**Infrastructure (Full Docker):**
- **Docker** + **Docker Compose** - Orchestration complète
- **Nginx Container** - Reverse proxy + SSL termination
- **Certbot Container** - Gestion automatique SSL Let's Encrypt
- **Redis Container** - Cache distribué
- **Volumes Docker** - Persistance des données et certificats

### Architecture des Containers

```
┌─────────────────────────────────────────────────┐
│          monbot.woutils.com (HTTPS)             │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────▼──────────┐
        │  nginx-proxy      │ (Port 80, 443)
        │  + certbot        │
        └────────┬──────────┘
                 │
        ┌────────▼──────────┐
        │  frontend         │ (Port 80 internal)
        │  (React build)    │
        └───────────────────┘
                 │
        ┌────────▼──────────┐
        │  backend          │ (Port 3000)
        │  (Node.js/Express)│
        └────────┬──────────┘
                 │
        ┌────────▼──────────┐
        │  redis            │ (Port 6379)
        └───────────────────┘

Network: bot_network (bridge)
```

---

## 📝 TODO List Détaillée

### Phase 1: Configuration Infrastructure Docker (Priorité: HAUTE)

- [ ] **1.1** Vérifier les prérequis sur le VPS
  - [ ] Docker installé (v24+): `docker --version`
  - [ ] Docker Compose installé (v2+): `docker compose version`
  - [ ] Git configuré
  - [ ] Ports 80 et 443 ouverts dans le firewall
  - [ ] Utilisateur ajouté au groupe docker: `usermod -aG docker $USER`

- [ ] **1.2** Configuration DNS
  - [ ] Vérifier que `monbot.woutils.com` pointe vers l'IP du VPS
  - [ ] Tester la résolution DNS: `dig monbot.woutils.com`
  - [ ] Attendre propagation DNS (24-48h si nouveau)

- [ ] **1.3** Structure du projet Docker
  - [ ] Créer la structure de dossiers
    ```
    /opt/apps/bot_search_phone/
    ├── docker-compose.yml
    ├── docker-compose.prod.yml
    ├── .env
    ├── .env.example
    ├── backend/
    │   ├── Dockerfile
    │   ├── Dockerfile.dev
    │   ├── src/
    │   └── package.json
    ├── frontend/
    │   ├── Dockerfile
    │   ├── Dockerfile.dev
    │   ├── src/
    │   └── package.json
    ├── nginx/
    │   ├── Dockerfile
    │   ├── nginx.conf
    │   ├── default.conf
    │   └── ssl/
    └── scripts/
        ├── init-letsencrypt.sh
        └── deploy.sh
    ```

- [ ] **1.4** Configuration Docker Compose
  - [ ] Créer `docker-compose.yml` (développement)
  - [ ] Créer `docker-compose.prod.yml` (production)
  - [ ] Créer `.env` avec variables d'environnement
  - [ ] Créer réseau Docker: `bot_network`
  - [ ] Configurer volumes pour persistance

---

### Phase 2: Développement Backend (Priorité: HAUTE)

- [ ] **2.1** Initialisation du projet
  - [ ] Créer la structure: `mkdir -p /opt/apps/bot_search_phone/{backend,frontend}`
  - [ ] Initialiser npm: `npm init -y`
  - [ ] Installer dépendances de base
  - [ ] Configurer ESLint + Prettier
  - [ ] Créer `.env` et `.gitignore`

- [ ] **2.2** Scraper Leboncoin
  - [ ] Installer Puppeteer: `npm install puppeteer`
  - [ ] Créer `scrapers/leboncoin.js`
  - [ ] Implémenter la recherche "iPhone"
  - [ ] Parser les résultats (titre, prix, image, lien, localisation, date)
  - [ ] Gérer les anti-bot (User-Agent rotation, delays)
  - [ ] Ajouter système de retry
  - [ ] Tester et valider les données extraites

- [ ] **2.3** Scraper Vinted
  - [ ] Option A: Utiliser package npm `vinted-api-wrapper`
  - [ ] Option B: Créer microservice Python avec `pyVinted`
  - [ ] Créer `scrapers/vinted.js`
  - [ ] Implémenter recherche "iPhone"
  - [ ] Parser résultats (titre, prix, image, lien, vendeur, état)
  - [ ] Gérer pagination
  - [ ] Tester et valider

- [ ] **2.4** API REST
  - [ ] Installer Express: `npm install express cors helmet`
  - [ ] Créer structure routes
    - [ ] `GET /api/search?query=iphone` - Recherche
    - [ ] `GET /api/health` - Health check
  - [ ] Implémenter endpoints
  - [ ] Ajouter middleware de validation
  - [ ] Ajouter rate limiting (express-rate-limit)
  - [ ] Gérer les erreurs globalement

- [ ] **2.5** Optimisations
  - [ ] Implémenter cache Redis (optionnel)
  - [ ] Exécuter scrapers en parallèle (Promise.all)
  - [ ] Ajouter timeout sur les scrapers (30s max)
  - [ ] Logger les requêtes (Winston ou Morgan)

---

### Phase 3: Développement Frontend (Priorité: MOYENNE)

- [ ] **3.1** Initialisation
  - [ ] Créer projet Vite: `npm create vite@latest frontend -- --template react`
  - [ ] Installer TailwindCSS
  - [ ] Configurer Axios
  - [ ] Structurer les dossiers (components, services, utils)

- [ ] **3.2** Interface Utilisateur
  - [ ] Créer composant `SearchBar`
    - [ ] Input de recherche
    - [ ] Bouton "Rechercher"
    - [ ] Filtres avancés (prix min/max, optionnel)
  - [ ] Créer composant `ResultCard`
    - [ ] Affichage image produit
    - [ ] Titre, prix, localisation
    - [ ] Badge source (Leboncoin/Vinted)
    - [ ] Lien vers annonce originale
  - [ ] Créer composant `ResultsList`
    - [ ] Grille responsive
    - [ ] Tri par prix/date
    - [ ] Filtrage par source
  - [ ] Créer composant `LoadingState`
  - [ ] Créer composant `ErrorState`

- [ ] **3.3** Intégration API
  - [ ] Créer service `api/search.js`
  - [ ] Implémenter appel à `/api/search`
  - [ ] Gérer états (loading, success, error)
  - [ ] Afficher résultats agrégés

- [ ] **3.4** UX/UI Professionnelle
  - [ ] Design responsive (mobile-first)
  - [ ] Animations de chargement (skeleton screens)
  - [ ] Messages d'erreur clairs
  - [ ] Pagination ou infinite scroll
  - [ ] Dark mode (optionnel)
  - [ ] Favicon + métadonnées

---

### Phase 4: Tests & Qualité (Priorité: MOYENNE)

- [ ] **4.1** Tests Backend
  - [ ] Tests unitaires scrapers (Jest)
  - [ ] Tests API endpoints (Supertest)
  - [ ] Tests d'intégration
  - [ ] Coverage > 70%

- [ ] **4.2** Tests Frontend
  - [ ] Tests composants (Vitest + React Testing Library)
  - [ ] Tests E2E basiques (Playwright)

- [ ] **4.3** Qualité du code
  - [ ] Linter (ESLint) - 0 erreur
  - [ ] Formatter (Prettier)
  - [ ] Pre-commit hooks (Husky)
  - [ ] Documentation JSDoc

---

### Phase 5: Déploiement Docker (Priorité: HAUTE)

- [ ] **5.1** Création des Dockerfiles

  **Backend Dockerfile:**
  ```dockerfile
  FROM node:18-alpine
  WORKDIR /app

  # Install Chromium for Puppeteer
  RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
  ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

  COPY package*.json ./
  RUN npm ci --only=production

  COPY . .

  EXPOSE 3000
  CMD ["node", "src/index.js"]
  ```

  **Frontend Dockerfile (multi-stage):**
  ```dockerfile
  # Stage 1: Build
  FROM node:18-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  # Stage 2: Serve with Nginx
  FROM nginx:alpine
  COPY --from=builder /app/dist /usr/share/nginx/html
  COPY nginx/default.conf /etc/nginx/conf.d/
  EXPOSE 80
  CMD ["nginx", "-g", "daemon off;"]
  ```

  **Nginx Proxy Dockerfile:**
  ```dockerfile
  FROM nginx:alpine
  RUN apk add --no-cache certbot certbot-nginx
  COPY nginx/nginx.conf /etc/nginx/nginx.conf
  COPY nginx/default.conf /etc/nginx/conf.d/default.conf
  ```

- [ ] **5.2** Docker Compose Configuration

  **docker-compose.prod.yml:**
  ```yaml
  version: '3.8'

  services:
    nginx-proxy:
      build: ./nginx
      container_name: bot_nginx_proxy
      ports:
        - "80:80"
        - "443:443"
      volumes:
        - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
        - ./nginx/conf.d:/etc/nginx/conf.d:ro
        - ./nginx/ssl:/etc/letsencrypt:rw
        - certbot-webroot:/var/www/certbot:ro
      depends_on:
        - frontend
        - backend
      networks:
        - bot_network
      restart: unless-stopped

    certbot:
      image: certbot/certbot
      container_name: bot_certbot
      volumes:
        - ./nginx/ssl:/etc/letsencrypt:rw
        - certbot-webroot:/var/www/certbot:rw
      entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
      networks:
        - bot_network

    frontend:
      build:
        context: ./frontend
        dockerfile: Dockerfile
      container_name: bot_frontend
      networks:
        - bot_network
      restart: unless-stopped

    backend:
      build:
        context: ./backend
        dockerfile: Dockerfile
      container_name: bot_backend
      environment:
        - NODE_ENV=production
        - REDIS_URL=redis://redis:6379
        - PORT=3000
      env_file:
        - .env
      depends_on:
        - redis
      networks:
        - bot_network
      restart: unless-stopped

    redis:
      image: redis:7-alpine
      container_name: bot_redis
      command: redis-server --appendonly yes
      volumes:
        - redis-data:/data
      networks:
        - bot_network
      restart: unless-stopped

  networks:
    bot_network:
      driver: bridge

  volumes:
    redis-data:
    certbot-webroot:
  ```

- [ ] **5.3** Configuration Nginx pour Docker

  **nginx/conf.d/default.conf:**
  ```nginx
  # HTTP - Redirect to HTTPS
  server {
      listen 80;
      server_name monbot.woutils.com;

      location /.well-known/acme-challenge/ {
          root /var/www/certbot;
      }

      location / {
          return 301 https://$host$request_uri;
      }
  }

  # HTTPS
  server {
      listen 443 ssl http2;
      server_name monbot.woutils.com;

      ssl_certificate /etc/letsencrypt/live/monbot.woutils.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/monbot.woutils.com/privkey.pem;

      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_ciphers HIGH:!aNULL:!MD5;
      ssl_prefer_server_ciphers on;

      # Frontend (SPA)
      location / {
          proxy_pass http://frontend:80;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }

      # Backend API
      location /api {
          proxy_pass http://backend:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_cache_bypass $http_upgrade;
      }
  }
  ```

- [ ] **5.4** Script d'initialisation SSL

  **scripts/init-letsencrypt.sh:**
  ```bash
  #!/bin/bash
  domains=(monbot.woutils.com)
  email="your-email@example.com" # Modifier
  staging=0 # 0 = production, 1 = staging

  # Créer les dossiers nécessaires
  mkdir -p "./nginx/ssl/live/$domains"

  # Démarrer nginx sans SSL d'abord
  docker compose -f docker-compose.prod.yml up -d nginx-proxy

  # Obtenir le certificat
  docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $email \
    --agree-tos \
    --no-eff-email \
    $( (( $staging )) && echo "--staging" ) \
    -d $domains

  # Redémarrer nginx avec SSL
  docker compose -f docker-compose.prod.yml restart nginx-proxy
  ```

- [ ] **5.5** Déploiement sur le VPS
  - [ ] Copier le code sur le VPS: `rsync` ou `git clone`
  - [ ] Créer `.env` avec les variables de production
  - [ ] Rendre exécutable: `chmod +x scripts/init-letsencrypt.sh`
  - [ ] Lancer init SSL: `./scripts/init-letsencrypt.sh`
  - [ ] Démarrer tous les containers: `docker compose -f docker-compose.prod.yml up -d`
  - [ ] Vérifier les logs: `docker compose logs -f`
  - [ ] Tester l'accès: `https://monbot.woutils.com`

- [ ] **5.6** Monitoring & Maintenance Docker
  - [ ] Configurer watchtower pour auto-update (optionnel)
  - [ ] Vérifier health des containers: `docker ps`
  - [ ] Configurer logs rotation:
    ```yaml
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    ```
  - [ ] Backup volumes: `docker volume ls`
  - [ ] Script de backup automatique

---

### Phase 6: Améliorations Futures (Priorité: BASSE)

- [ ] **6.1** Fonctionnalités Avancées
  - [ ] Système d'alertes email pour nouvelles annonces
  - [ ] Sauvegarde favoris (BDD)
  - [ ] Comparateur de prix
  - [ ] Historique des prix
  - [ ] Filtres avancés (modèle iPhone, stockage, état)

- [ ] **6.2** Performance
  - [ ] Implémenter WebSockets pour notifications temps réel
  - [ ] CDN pour assets statiques
  - [ ] Service Worker pour PWA

- [ ] **6.3** Autres Sources
  - [ ] Ajouter scraper Facebook Marketplace
  - [ ] Ajouter scraper eBay France

---

## ⚠️ Considérations Légales & Éthiques

### Scraping Web
- ⚖️ **Leboncoin**: CGU interdisent le scraping automatisé
  - Risque de blocage IP
  - Utiliser avec modération (rate limiting)
  - Considérer les solutions commerciales (Apify, Piloterr) si usage intensif

- ⚖️ **Vinted**: API non officielle mais plus tolérante
  - Respecter les limites de taux
  - Ne pas surcharger les serveurs

### Bonnes Pratiques
- ✅ Respecter le `robots.txt`
- ✅ Ajouter delays entre requêtes (2-5 secondes)
- ✅ User-Agent rotation pour éviter détection
- ✅ Usage personnel/recherche uniquement
- ✅ Ne pas revendre les données
- ✅ Mentionner les sources dans l'interface

---

## 📦 Dépendances Principales

### Backend
```json
{
  "express": "^4.18.0",
  "puppeteer": "^21.0.0",
  "cheerio": "^1.0.0",
  "axios": "^1.6.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.0",
  "dotenv": "^16.3.0",
  "winston": "^3.11.0"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "axios": "^1.6.0",
  "tailwindcss": "^3.4.0"
}
```

---

## 🚀 Commandes Docker Rapides

```bash
# Développement local
docker compose up -d
docker compose logs -f
docker compose down

# Production sur VPS
cd /opt/apps/bot_search_phone
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml down

# Gestion des containers
docker ps                                    # Liste containers actifs
docker logs bot_backend -f                   # Logs backend en temps réel
docker logs bot_frontend -f                  # Logs frontend
docker exec -it bot_backend sh               # Shell dans le container backend

# Rebuild spécifique
docker compose -f docker-compose.prod.yml up -d --build backend
docker compose -f docker-compose.prod.yml restart nginx-proxy

# SSL/Certbot
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml restart nginx-proxy

# Nettoyage
docker system prune -a --volumes            # Nettoyer tout (ATTENTION!)
docker compose down -v                      # Arrêter + supprimer volumes

# Monitoring
docker stats                                # Utilisation ressources temps réel
docker compose -f docker-compose.prod.yml ps  # Status containers
docker volume ls                            # Liste volumes

# Backup Redis
docker exec bot_redis redis-cli SAVE
docker cp bot_redis:/data/dump.rdb ./backup/

# Mise à jour
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📊 Estimation des Temps

| Phase | Durée Estimée |
|-------|---------------|
| Phase 1 - Infrastructure Docker | 3-4 heures |
| Phase 2 - Backend | 8-12 heures |
| Phase 3 - Frontend | 6-8 heures |
| Phase 4 - Tests | 4-6 heures |
| Phase 5 - Déploiement Docker | 3-5 heures |
| **TOTAL** | **24-35 heures** |

## 🐳 Avantages de l'Architecture Docker

✅ **Portabilité**: Fonctionne partout (dev, staging, prod)
✅ **Isolation**: Chaque service dans son container
✅ **Scalabilité**: Facile d'ajouter des replicas
✅ **Reproductibilité**: Environnement identique sur tous les serveurs
✅ **Simplicité**: Un seul fichier `docker-compose.yml` pour tout orchestrer
✅ **Rollback facile**: Revenir à une version précédente en quelques secondes
✅ **Auto-restart**: Containers redémarrent automatiquement en cas de crash
✅ **Updates zero-downtime**: Possible avec Docker Swarm ou Kubernetes

---

## 🎨 Mockup Interface (Suggestion)

```
┌─────────────────────────────────────────────────────┐
│  🔍 Bot Recherche iPhone                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────┐  ┌──────────────┐   │
│  │ Rechercher: iPhone 13... │  │  Rechercher  │   │
│  └──────────────────────────┘  └──────────────┘   │
│                                                     │
│  Filtres: [ Leboncoin ] [ Vinted ] Prix: [___-___]│
│                                                     │
├─────────────────────────────────────────────────────┤
│  Résultats: 24 annonces trouvées                   │
├─────────────────────────────────────────────────────┤
│  ┌──────┐                     ┌──────┐             │
│  │ IMG  │ iPhone 13 128Go     │ IMG  │ iPhone...   │
│  │      │ 450€  📍 Paris      │      │ 380€...     │
│  │      │ [Leboncoin]         │      │ [Vinted]    │
│  └──────┘                     └──────┘             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📞 Support & Contact

- Documentation: Ce fichier TODO.md
- Issues: À créer si nécessaire

---

**Dernière mise à jour:** 2025-11-12
**Version:** 1.0.0
