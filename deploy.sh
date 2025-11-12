#!/bin/bash

# Deployment script for iPhone Search Bot
# This script rebuilds and restarts the Docker containers

set -e

echo "🚀 Starting deployment..."

# Change to project directory
cd "$(dirname "$0")"

echo "📦 Pulling latest changes..."
git pull origin claude/server-apps-setup-011CV43Q1ETCLPMwAUchAbiT

echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

echo "🔨 Rebuilding containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps

echo "📝 Backend logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20 backend

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access the application at:"
echo "   HTTP:  http://localhost:5080"
echo "   HTTPS: https://localhost:5443 (self-signed certificate)"
echo ""
echo "📊 To view logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🔍 To check container status:"
echo "   docker-compose -f docker-compose.prod.yml ps"
echo ""
