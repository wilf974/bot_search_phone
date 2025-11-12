#!/bin/bash

# Script de déploiement pour le bot de recherche iPhone
# Déploie l'application sur le VPS avec Docker Compose

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Bot Recherche iPhone - Déploiement     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "docker-compose.prod.yml" ]; then
  echo -e "${RED}Erreur: docker-compose.prod.yml non trouvé${NC}"
  echo -e "${YELLOW}Assurez-vous d'être dans le répertoire du projet${NC}"
  exit 1
fi

# Vérifier que .env existe
if [ ! -f ".env" ]; then
  echo -e "${RED}Erreur: Fichier .env non trouvé${NC}"
  echo -e "${YELLOW}Créez un fichier .env basé sur .env.example${NC}"
  exit 1
fi

# Fonction pour afficher l'étape
step() {
  echo ""
  echo -e "${GREEN}▶ $1${NC}"
}

# Arrêter les anciens containers
step "Arrêt des anciens containers..."
docker compose -f docker-compose.prod.yml down || true

# Pull des dernières images
step "Téléchargement des images Docker..."
docker compose -f docker-compose.prod.yml pull

# Build des images
step "Construction des images..."
docker compose -f docker-compose.prod.yml build --no-cache

# Démarrage des services
step "Démarrage des services..."
docker compose -f docker-compose.prod.yml up -d

# Attendre que les services démarrent
step "Attente du démarrage des services (20s)..."
sleep 20

# Vérifier le statut des containers
step "Vérification des containers..."
docker compose -f docker-compose.prod.yml ps

# Health check
step "Vérification de la santé de l'API..."
max_retries=10
retry_count=0

while [ $retry_count -lt $max_retries ]; do
  if docker exec bot_backend wget -q --spider http://localhost:3000/api/health; then
    echo -e "${GREEN}✓ API backend opérationnelle${NC}"
    break
  else
    retry_count=$((retry_count + 1))
    echo -e "${YELLOW}Tentative $retry_count/$max_retries...${NC}"
    sleep 3
  fi
done

if [ $retry_count -eq $max_retries ]; then
  echo -e "${RED}✗ L'API ne répond pas après $max_retries tentatives${NC}"
  echo -e "${YELLOW}Vérifiez les logs: docker compose -f docker-compose.prod.yml logs backend${NC}"
  exit 1
fi

# Afficher les logs
step "Derniers logs des services:"
docker compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Déploiement terminé avec succès!     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Services actifs:${NC}"
echo -e "   • Frontend: http://localhost (nginx)"
echo -e "   • Backend API: http://localhost:3000"
echo -e "   • Redis: localhost:6379"
echo ""
echo -e "${BLUE}🔧 Commandes utiles:${NC}"
echo -e "   • Logs: ${YELLOW}docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "   • Status: ${YELLOW}docker compose -f docker-compose.prod.yml ps${NC}"
echo -e "   • Arrêter: ${YELLOW}docker compose -f docker-compose.prod.yml down${NC}"
echo -e "   • Redémarrer: ${YELLOW}docker compose -f docker-compose.prod.yml restart${NC}"
echo ""
echo -e "${GREEN}✨ L'application est maintenant en ligne!${NC}"
