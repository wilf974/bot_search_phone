#!/bin/bash

# Script de réparation automatique pour l'erreur 502

set -e

echo "🔧 RÉPARATION AUTOMATIQUE - Erreur 502"
echo "======================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "docker-compose.prod.yml" ]; then
    error "docker-compose.prod.yml introuvable. Êtes-vous dans le bon répertoire?"
    exit 1
fi

echo "📍 Répertoire: $(pwd)"
echo ""

# ÉTAPE 1: Arrêter les conteneurs existants
echo "1️⃣  Arrêt des conteneurs existants..."
docker-compose -f docker-compose.prod.yml down || warning "Aucun conteneur à arrêter"
success "Conteneurs arrêtés"
echo ""

# ÉTAPE 2: Nettoyer les anciennes images (optionnel)
echo "2️⃣  Nettoyage des anciennes images Docker..."
docker system prune -f > /dev/null 2>&1
success "Nettoyage effectué"
echo ""

# ÉTAPE 3: Reconstruire les images
echo "3️⃣  Reconstruction des images Docker..."
info "Cela peut prendre quelques minutes..."
if docker-compose -f docker-compose.prod.yml build --no-cache; then
    success "Images reconstruites"
else
    error "Échec de la reconstruction"
    exit 1
fi
echo ""

# ÉTAPE 4: Démarrer les conteneurs
echo "4️⃣  Démarrage des conteneurs..."
if docker-compose -f docker-compose.prod.yml up -d; then
    success "Conteneurs démarrés"
else
    error "Échec du démarrage"
    exit 1
fi
echo ""

# ÉTAPE 5: Attendre que les services soient prêts
echo "5️⃣  Attente du démarrage des services..."
sleep 10

# Vérifier Redis
info "Vérification de Redis..."
if docker exec bot_redis redis-cli ping > /dev/null 2>&1; then
    success "Redis est opérationnel"
else
    warning "Redis ne répond pas encore"
fi

# Vérifier le backend
info "Vérification du backend..."
for i in {1..10}; do
    if curl -f -s http://localhost:5080/api/health > /dev/null 2>&1; then
        success "Backend opérationnel sur port 5080"
        break
    else
        if [ $i -eq 10 ]; then
            error "Backend ne répond pas après 30 secondes"
            warning "Vérification des logs..."
            docker-compose -f docker-compose.prod.yml logs --tail=30 backend
            docker-compose -f docker-compose.prod.yml logs --tail=30 nginx-proxy
            exit 1
        fi
        echo "   Tentative $i/10... attente 3s"
        sleep 3
    fi
done
echo ""

# ÉTAPE 6: Vérifier la configuration nginx système
echo "6️⃣  Configuration du reverse proxy système..."

if ! command -v nginx &> /dev/null; then
    warning "Nginx système n'est pas installé"
    info "Pour accéder via le domaine, installez nginx:"
    echo "   sudo apt update && sudo apt install nginx -y"
    echo "   sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/monbot.woutils.com"
    echo "   sudo ln -s /etc/nginx/sites-available/monbot.woutils.com /etc/nginx/sites-enabled/"
    echo "   sudo nginx -t && sudo systemctl reload nginx"
    echo ""
    info "Pour l'instant, accédez directement via: http://localhost:5080"
else
    # Vérifier si la config existe
    if [ ! -f /etc/nginx/sites-available/monbot.woutils.com ]; then
        warning "Configuration nginx manquante"
        info "Installation de la configuration nginx..."

        if [ -f nginx-reverse-proxy.conf ]; then
            sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/monbot.woutils.com
            sudo ln -sf /etc/nginx/sites-available/monbot.woutils.com /etc/nginx/sites-enabled/
            success "Configuration installée"
        else
            error "Fichier nginx-reverse-proxy.conf introuvable"
        fi
    else
        success "Configuration nginx existe"

        # Vérifier qu'elle pointe vers le bon port
        if grep -q "localhost:5080" /etc/nginx/sites-available/monbot.woutils.com; then
            success "Configuration pointe vers le bon port (5080)"
        else
            warning "Configuration ne pointe pas vers localhost:5080"
            info "Mise à jour de la configuration..."
            sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/monbot.woutils.com
            success "Configuration mise à jour"
        fi
    fi

    # Tester et recharger nginx
    info "Test de la configuration nginx..."
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        success "Configuration nginx valide"
        sudo systemctl reload nginx
        success "Nginx rechargé"
    else
        error "Configuration nginx invalide"
        sudo nginx -t
    fi
fi
echo ""

# ÉTAPE 7: Statut final
echo "7️⃣  Statut des conteneurs..."
docker-compose -f docker-compose.prod.yml ps
echo ""

# ÉTAPE 8: Tests de connectivité
echo "8️⃣  Tests de connectivité..."
echo ""

# Test direct Docker
info "Test 1: Accès direct Docker (port 5080)..."
if curl -f -s http://localhost:5080/api/health > /dev/null 2>&1; then
    success "http://localhost:5080/api/health → OK"
else
    error "http://localhost:5080/api/health → ÉCHEC"
fi

# Test via domaine (si nginx configuré)
if command -v nginx &> /dev/null && [ -f /etc/nginx/sites-enabled/monbot.woutils.com ]; then
    info "Test 2: Accès via domaine..."
    if curl -f -s http://monbot.woutils.com/api/health > /dev/null 2>&1; then
        success "http://monbot.woutils.com/api/health → OK"
    else
        error "http://monbot.woutils.com/api/health → ÉCHEC"
        warning "Logs nginx système:"
        sudo tail -n 20 /var/log/nginx/error.log 2>/dev/null || echo "Logs non disponibles"
    fi
fi
echo ""

# RÉSUMÉ FINAL
echo ""
echo "🎉 RÉPARATION TERMINÉE"
echo "====================="
echo ""

if curl -f -s http://localhost:5080/api/health > /dev/null 2>&1; then
    success "Les conteneurs Docker fonctionnent correctement"
    echo ""
    echo "🌐 ACCÈS À L'APPLICATION:"
    echo "   • Direct:  http://localhost:5080"
    echo "   • Domaine: https://monbot.woutils.com (si nginx configuré)"
    echo ""

    if ! curl -f -s http://monbot.woutils.com/api/health > /dev/null 2>&1; then
        warning "Le domaine ne fonctionne pas encore"
        echo ""
        echo "📋 POUR ACTIVER LE DOMAINE:"
        echo "   1. Vérifier que nginx système est installé: sudo systemctl status nginx"
        echo "   2. Vérifier les logs: sudo tail -f /var/log/nginx/error.log"
        echo "   3. Tester la configuration: sudo nginx -t"
        echo "   4. Recharger nginx: sudo systemctl reload nginx"
    fi
else
    error "Les conteneurs ne répondent toujours pas"
    echo ""
    echo "🔍 DIAGNOSTIC SUPPLÉMENTAIRE:"
    echo "   Exécutez: ./diagnose-502.sh"
fi

echo ""
echo "📊 LOGS EN TEMPS RÉEL:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
