#!/bin/bash

# Script de backup pour le bot de recherche iPhone
# Sauvegarde les données Redis et les certificats SSL

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_$TIMESTAMP"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Backup du bot de recherche ===${NC}"
echo ""

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Backup Redis
echo -e "${YELLOW}Backup de Redis...${NC}"
docker exec bot_redis redis-cli SAVE
docker cp bot_redis:/data/dump.rdb "$BACKUP_DIR/$BACKUP_NAME/redis_dump.rdb"
echo -e "${GREEN}✓ Redis sauvegardé${NC}"

# Backup SSL certificates
if [ -d "./nginx/ssl" ]; then
  echo -e "${YELLOW}Backup des certificats SSL...${NC}"
  cp -r ./nginx/ssl "$BACKUP_DIR/$BACKUP_NAME/ssl"
  echo -e "${GREEN}✓ Certificats SSL sauvegardés${NC}"
fi

# Backup .env
if [ -f ".env" ]; then
  echo -e "${YELLOW}Backup de .env...${NC}"
  cp .env "$BACKUP_DIR/$BACKUP_NAME/.env"
  echo -e "${GREEN}✓ Fichier .env sauvegardé${NC}"
fi

# Créer une archive
echo -e "${YELLOW}Création de l'archive...${NC}"
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
cd - > /dev/null

echo ""
echo -e "${GREEN}=== Backup terminé ===${NC}"
echo -e "Fichier: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""

# Nettoyer les anciens backups (garder les 7 derniers)
echo -e "${YELLOW}Nettoyage des anciens backups...${NC}"
cd "$BACKUP_DIR"
ls -t *.tar.gz | tail -n +8 | xargs -r rm --
cd - > /dev/null

echo -e "${GREEN}✓ Nettoyage terminé${NC}"
