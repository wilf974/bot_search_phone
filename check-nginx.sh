#!/bin/bash

# Check and fix system nginx configuration

echo "🔍 Checking system nginx configuration..."
echo ""

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "⚠️  System nginx is not installed"
    echo "The 502 error suggests nginx is running somewhere else or as a system service"
    exit 1
fi

echo "📋 System nginx status:"
systemctl status nginx --no-pager | head -10
echo ""

echo "📂 Looking for monbot nginx config..."
if [ -f /etc/nginx/sites-enabled/monbot.woutils.com ]; then
    echo "✅ Found: /etc/nginx/sites-enabled/monbot.woutils.com"
    echo ""
    echo "Current configuration:"
    grep -A 3 "proxy_pass" /etc/nginx/sites-enabled/monbot.woutils.com || echo "No proxy_pass found"
elif [ -f /etc/nginx/sites-available/monbot.woutils.com ]; then
    echo "⚠️  Config exists in sites-available but not enabled"
    echo "Run: sudo ln -s /etc/nginx/sites-available/monbot.woutils.com /etc/nginx/sites-enabled/"
else
    echo "❌ No monbot nginx config found"
    echo ""
    echo "📋 All nginx sites enabled:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "Directory not found"
    echo ""
    echo "To fix, run:"
    echo "  sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/monbot.woutils.com"
    echo "  sudo ln -s /etc/nginx/sites-available/monbot.woutils.com /etc/nginx/sites-enabled/"
    echo "  sudo nginx -t"
    echo "  sudo systemctl reload nginx"
fi

echo ""
echo "🔍 Checking what's listening on ports..."
echo "Port 80:"
lsof -i :80 2>/dev/null || netstat -tlnp 2>/dev/null | grep :80 || ss -tlnp 2>/dev/null | grep :80 || echo "Command not available"
echo ""
echo "Port 5080:"
lsof -i :5080 2>/dev/null || netstat -tlnp 2>/dev/null | grep :5080 || ss -tlnp 2>/dev/null | grep :5080 || echo "Command not available"

echo ""
echo "💡 To test if Docker nginx is responding:"
echo "   curl -v http://localhost:5080/api/health"
