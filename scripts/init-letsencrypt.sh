#!/bin/bash

# Script d'initialisation Let's Encrypt pour Docker
# Ce script obtient les certificats SSL pour le domaine

set -e

domains=(monbot.woutils.com)
email="your-email@example.com"  # MODIFIER AVEC VOTRE EMAIL
staging=0  # 0 = production, 1 = staging (pour tests)

data_path="./nginx/ssl"
certbot_path="/etc/letsencrypt"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Initialisation Let's Encrypt ===${NC}"
echo ""

# Vérifier que l'email est configuré
if [ "$email" = "your-email@example.com" ]; then
  echo -e "${RED}Erreur: Veuillez modifier l'email dans le script${NC}"
  exit 1
fi

# Créer les dossiers nécessaires
echo -e "${YELLOW}Création des dossiers...${NC}"
mkdir -p "$data_path/live/$domains"
mkdir -p "$data_path/archive/$domains"

# Télécharger les paramètres TLS recommandés si inexistants
if [ ! -e "$data_path/options-ssl-nginx.conf" ]; then
  echo -e "${YELLOW}Téléchargement des paramètres SSL...${NC}"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/options-ssl-nginx.conf"
fi

if [ ! -e "$data_path/ssl-dhparams.pem" ]; then
  echo -e "${YELLOW}Téléchargement des paramètres DH...${NC}"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/ssl-dhparams.pem"
fi

# Créer un certificat auto-signé temporaire
echo -e "${YELLOW}Création d'un certificat temporaire...${NC}"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$data_path/live/$domains/privkey.pem" \
  -out "$data_path/live/$domains/fullchain.pem" \
  -subj "/CN=$domains"

# Démarrer nginx avec le certificat temporaire
echo -e "${YELLOW}Démarrage de nginx...${NC}"
docker compose -f docker-compose.prod.yml up -d nginx-proxy

echo -e "${YELLOW}Attente du démarrage de nginx (10s)...${NC}"
sleep 10

# Supprimer le certificat temporaire
echo -e "${YELLOW}Suppression du certificat temporaire...${NC}"
rm -rf "$data_path/live/$domains"

# Obtenir le vrai certificat Let's Encrypt
echo -e "${GREEN}Obtention du certificat Let's Encrypt...${NC}"

if [ $staging -eq 1 ]; then
  staging_arg="--staging"
  echo -e "${YELLOW}Mode staging activé (certificat de test)${NC}"
else
  staging_arg=""
  echo -e "${GREEN}Mode production (certificat réel)${NC}"
fi

docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $email \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  $staging_arg \
  -d $domains

# Redémarrer nginx avec le vrai certificat
echo -e "${YELLOW}Redémarrage de nginx avec le certificat SSL...${NC}"
docker compose -f docker-compose.prod.yml restart nginx-proxy

echo ""
echo -e "${GREEN}=== Configuration SSL terminée avec succès! ===${NC}"
echo -e "${GREEN}Votre site est maintenant accessible en HTTPS à: https://$domains${NC}"
echo ""
echo -e "${YELLOW}Note: Les certificats seront renouvelés automatiquement par le container certbot${NC}"
