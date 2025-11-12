#!/bin/bash

# Script de diagnostic complet pour l'erreur 502

echo "🔍 DIAGNOSTIC COMPLET - Erreur 502"
echo "=================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les erreurs
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour afficher les succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher les warnings
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Vérifier Docker
echo "1️⃣  Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé ou pas dans le PATH"
    exit 1
fi

if ! docker ps &> /dev/null; then
    error "Docker n'est pas accessible (permissions?). Essayez: sudo usermod -aG docker $USER"
    exit 1
fi
success "Docker est accessible"
echo ""

# 2. Vérifier docker-compose
echo "2️⃣  Vérification de Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    error "docker-compose n'est pas installé"
    exit 1
fi
success "Docker Compose est disponible"
echo ""

# 3. Statut des conteneurs
echo "3️⃣  Statut des conteneurs Docker..."
RUNNING_CONTAINERS=$(docker-compose -f docker-compose.prod.yml ps --services --filter "status=running" 2>/dev/null | wc -l)
EXPECTED_CONTAINERS=4

echo "Conteneurs attendus: $EXPECTED_CONTAINERS (nginx-proxy, frontend, backend, redis)"
echo "Conteneurs en cours d'exécution: $RUNNING_CONTAINERS"
echo ""

docker-compose -f docker-compose.prod.yml ps

if [ "$RUNNING_CONTAINERS" -lt "$EXPECTED_CONTAINERS" ]; then
    warning "Tous les conteneurs ne sont pas démarrés!"
else
    success "Tous les conteneurs sont démarrés"
fi
echo ""

# 4. Test du backend Docker sur port 5080
echo "4️⃣  Test du backend Docker (port 5080)..."
if curl -f -s http://localhost:5080/api/health > /dev/null 2>&1; then
    success "Le backend Docker répond sur le port 5080"
    echo "   Réponse: $(curl -s http://localhost:5080/api/health)"
else
    error "Le backend Docker ne répond PAS sur le port 5080"
    warning "C'est probablement la cause de l'erreur 502!"
fi
echo ""

# 5. Vérifier ce qui écoute sur le port 5080
echo "5️⃣  Processus écoutant sur le port 5080..."
PORT_5080=$(lsof -i :5080 2>/dev/null)
if [ -z "$PORT_5080" ]; then
    error "Rien n'écoute sur le port 5080"
    warning "Le conteneur nginx-proxy n'est probablement pas démarré"
else
    success "Port 5080 est utilisé par:"
    echo "$PORT_5080"
fi
echo ""

# 6. Logs des conteneurs
echo "6️⃣  Logs récents du backend..."
docker-compose -f docker-compose.prod.yml logs --tail=10 backend 2>/dev/null
echo ""

echo "7️⃣  Logs récents de nginx-proxy..."
docker-compose -f docker-compose.prod.yml logs --tail=10 nginx-proxy 2>/dev/null
echo ""

# 7. Configuration système nginx
echo "8️⃣  Configuration système Nginx..."
if command -v nginx &> /dev/null; then
    success "Nginx système est installé"

    # Vérifier le statut
    if systemctl is-active --quiet nginx; then
        success "Nginx système est actif"
    else
        error "Nginx système n'est PAS actif"
    fi

    # Vérifier la configuration monbot
    if [ -f /etc/nginx/sites-enabled/monbot.woutils.com ]; then
        success "Configuration monbot.woutils.com est activée"

        # Extraire le proxy_pass
        PROXY_PASS=$(grep -A 5 "location /" /etc/nginx/sites-enabled/monbot.woutils.com | grep "proxy_pass" | head -1)
        echo "   $PROXY_PASS"

        if echo "$PROXY_PASS" | grep -q "localhost:5080"; then
            success "Nginx pointe vers localhost:5080 (correct)"
        else
            error "Nginx ne pointe PAS vers localhost:5080!"
            echo "   Configuration actuelle: $PROXY_PASS"
        fi
    else
        error "Configuration monbot.woutils.com n'est PAS activée"

        if [ -f /etc/nginx/sites-available/monbot.woutils.com ]; then
            warning "Mais elle existe dans sites-available"
            echo "   Exécutez: sudo ln -s /etc/nginx/sites-available/monbot.woutils.com /etc/nginx/sites-enabled/"
        else
            error "Configuration monbot.woutils.com n'existe pas"
            echo "   Exécutez: sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/monbot.woutils.com"
        fi
    fi

    # Test de la configuration nginx
    echo ""
    echo "Test de la configuration nginx:"
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        success "Configuration Nginx est valide"
    else
        error "Configuration Nginx contient des erreurs"
        sudo nginx -t
    fi
else
    error "Nginx système n'est pas installé"
fi
echo ""

# 8. Résumé et actions recommandées
echo ""
echo "📋 RÉSUMÉ ET ACTIONS RECOMMANDÉES"
echo "=================================="
echo ""

# Vérifier si le problème est identifié
if [ "$RUNNING_CONTAINERS" -lt "$EXPECTED_CONTAINERS" ]; then
    error "PROBLÈME: Les conteneurs Docker ne sont pas tous démarrés"
    echo ""
    echo "🔧 SOLUTION:"
    echo "   1. Redémarrer les conteneurs:"
    echo "      docker-compose -f docker-compose.prod.yml down"
    echo "      docker-compose -f docker-compose.prod.yml up -d --build"
    echo ""
    echo "   2. Ou utiliser le script de déploiement:"
    echo "      ./quick-fix.sh"
elif ! curl -f -s http://localhost:5080/api/health > /dev/null 2>&1; then
    error "PROBLÈME: Le backend Docker ne répond pas sur le port 5080"
    echo ""
    echo "🔧 SOLUTION:"
    echo "   1. Vérifier les logs:"
    echo "      docker-compose -f docker-compose.prod.yml logs nginx-proxy"
    echo "      docker-compose -f docker-compose.prod.yml logs backend"
    echo ""
    echo "   2. Redémarrer les conteneurs:"
    echo "      ./quick-fix.sh"
elif ! [ -f /etc/nginx/sites-enabled/monbot.woutils.com ]; then
    error "PROBLÈME: Configuration nginx système manquante"
    echo ""
    echo "🔧 SOLUTION:"
    echo "   sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/monbot.woutils.com"
    echo "   sudo ln -s /etc/nginx/sites-available/monbot.woutils.com /etc/nginx/sites-enabled/"
    echo "   sudo nginx -t"
    echo "   sudo systemctl reload nginx"
else
    success "Tous les composants semblent corrects"
    echo ""
    warning "Si l'erreur 502 persiste, vérifiez:"
    echo "   1. Les logs nginx système: sudo tail -f /var/log/nginx/error.log"
    echo "   2. Les logs Docker: docker-compose -f docker-compose.prod.yml logs -f"
fi

echo ""
