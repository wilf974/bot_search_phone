# 🔧 Guide de Dépannage - Erreur 502

## 🚨 Erreur 502 Bad Gateway

L'erreur 502 signifie que **nginx système ne peut pas se connecter aux conteneurs Docker**.

## 🎯 Solution Rapide (90% des cas)

```bash
cd /opt/apps/bot_search_phone  # ou votre répertoire
./fix-502.sh
```

Ce script va automatiquement:
1. ✅ Arrêter les anciens conteneurs
2. ✅ Reconstruire les images Docker
3. ✅ Démarrer les conteneurs sur les bons ports
4. ✅ Configurer nginx système (si nécessaire)
5. ✅ Tester que tout fonctionne

---

## 🔍 Diagnostic Détaillé

Si `fix-502.sh` ne résout pas le problème:

```bash
./diagnose-502.sh
```

Ce script va identifier précisément le problème.

---

## 📋 Étapes Manuelles de Dépannage

### 1. Vérifier que Docker fonctionne

```bash
docker ps
docker-compose -f docker-compose.prod.yml ps
```

**Attendu**: 4 conteneurs running (nginx-proxy, frontend, backend, redis)

**Si problème**:
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

---

### 2. Tester le backend Docker directement

```bash
curl http://localhost:5080/api/health
```

**Attendu**: `{"status":"ok",...}`

**Si échec**: Le problème vient des conteneurs Docker

```bash
# Voir les logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs nginx-proxy

# Redémarrer
docker-compose -f docker-compose.prod.yml restart backend nginx-proxy
```

---

### 3. Vérifier la configuration nginx système

```bash
# Vérifier que le fichier existe
ls -la /etc/nginx/sites-enabled/monbot.woutils.com

# Voir la configuration
cat /etc/nginx/sites-enabled/monbot.woutils.com | grep proxy_pass
```

**Attendu**: `proxy_pass http://localhost:5080;`

**Si manquant ou incorrect**:
```bash
sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/monbot.woutils.com
sudo ln -sf /etc/nginx/sites-available/monbot.woutils.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 4. Vérifier les logs nginx système

```bash
sudo tail -f /var/log/nginx/error.log
```

Messages courants:

| Message | Cause | Solution |
|---------|-------|----------|
| `Connection refused` | Docker pas accessible sur 5080 | Redémarrer Docker containers |
| `upstream timed out` | Backend trop lent | Vérifier logs backend |
| `no such file` | Config SSL manquante | Désactiver SSL temporairement |

---

### 5. Vérifier les ports

```bash
# Vérifier qui écoute sur 5080
sudo lsof -i :5080
# ou
sudo netstat -tlnp | grep 5080
# ou
sudo ss -tlnp | grep 5080
```

**Attendu**: Docker nginx-proxy sur port 5080

**Si rien**: Les conteneurs Docker ne sont pas démarrés correctement

---

## 🔧 Solutions aux Problèmes Courants

### Problème: "Port already in use"

```bash
# Trouver ce qui utilise le port
sudo lsof -i :5080

# Si c'est un ancien processus, le tuer
docker-compose -f docker-compose.prod.yml down

# Si c'est autre chose, changer le port dans docker-compose.prod.yml
```

### Problème: "Permission denied"

```bash
# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# Se déconnecter/reconnecter ou:
newgrp docker
```

### Problème: "Cannot connect to Docker daemon"

```bash
# Démarrer Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### Problème: Certificat SSL invalide

**Pour test rapide, désactiver HTTPS temporairement**:

Éditer `/etc/nginx/sites-enabled/monbot.woutils.com`:
```nginx
# Commenter temporairement la partie HTTPS (server {...} sur port 443)
# Garder seulement la partie HTTP (port 80)
```

Puis:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

Accéder via: `http://monbot.woutils.com`

---

## 📊 Commandes Utiles

### Logs en temps réel

```bash
# Docker
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx système
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Redémarrer un service spécifique

```bash
# Redémarrer backend seulement
docker-compose -f docker-compose.prod.yml restart backend

# Redémarrer nginx-proxy
docker-compose -f docker-compose.prod.yml restart nginx-proxy

# Redémarrer nginx système
sudo systemctl restart nginx
```

### Entrer dans un conteneur

```bash
docker exec -it bot_backend sh
docker exec -it bot_frontend sh
docker exec -it bot_redis redis-cli
```

### Vider le cache Redis

```bash
docker exec -it bot_redis redis-cli FLUSHALL
```

---

## 🆘 Si Rien ne Fonctionne

### Reset complet

```bash
# ATTENTION: Cela supprime tout (données Redis incluses)
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a -f
./fix-502.sh
```

### Vérifier les logs système

```bash
# Logs Docker daemon
sudo journalctl -u docker --no-pager | tail -50

# Logs nginx système
sudo journalctl -u nginx --no-pager | tail -50
```

### Tests de connectivité réseau

```bash
# Depuis le serveur
curl -v http://localhost:5080/api/health

# Tester depuis l'extérieur
curl -v http://monbot.woutils.com/api/health
```

---

## 📞 Checklist Finale

Avant de demander de l'aide, vérifiez:

- [ ] Docker est installé et démarré: `docker ps`
- [ ] 4 conteneurs sont running: `docker-compose -f docker-compose.prod.yml ps`
- [ ] Backend répond sur 5080: `curl http://localhost:5080/api/health`
- [ ] Nginx système est configuré: `cat /etc/nginx/sites-enabled/monbot.woutils.com`
- [ ] Nginx config est valide: `sudo nginx -t`
- [ ] Pas d'erreurs dans les logs: `docker-compose -f docker-compose.prod.yml logs --tail=50`

**Si tout est ✅ mais erreur 502 persiste**: Partagez les logs complets:
```bash
./diagnose-502.sh > diagnostic.txt 2>&1
```
