#!/bin/bash

# Quick fix script to deploy the new port configuration
set -e

echo "🔄 Step 1: Pulling latest changes..."
git pull origin claude/server-apps-setup-011CV43Q1ETCLPMwAUchAbiT

echo ""
echo "🛑 Step 2: Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

echo ""
echo "🗑️  Step 3: Cleaning up old images (optional)..."
docker system prune -f

echo ""
echo "🔨 Step 4: Rebuilding containers with new port configuration..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo ""
echo "🚀 Step 5: Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to stabilize..."
sleep 15

echo ""
echo "📊 Step 6: Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📝 Step 7: Checking backend logs..."
docker-compose -f docker-compose.prod.yml logs --tail=30 backend

echo ""
echo "🔍 Step 8: Testing backend health..."
curl -f http://localhost:5080/api/health && echo "" || echo "❌ Backend not responding on port 5080"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app should now be accessible at:"
echo "   - Direct: http://localhost:5080"
echo "   - Via domain: http://monbot.woutils.com (if nginx configured)"
echo ""
echo "📋 Next steps:"
echo "   1. Test the application in your browser"
echo "   2. If still getting 502, check system nginx config:"
echo "      sudo nginx -t"
echo "      sudo systemctl status nginx"
echo "   3. Check Docker logs if issues persist:"
echo "      docker-compose -f docker-compose.prod.yml logs -f"
