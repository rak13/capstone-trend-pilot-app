#!/bin/bash
# stop.sh — Stop all TrendPilot services (backend + nginx)

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }

# Backend
if sudo systemctl is-active --quiet trendpilot-backend 2>/dev/null; then
    sudo systemctl stop trendpilot-backend
    log "trendpilot-backend stopped"
else
    warn "trendpilot-backend was not running"
fi

# Nginx
if pgrep -x nginx > /dev/null; then
    sudo nginx -s stop
    log "nginx stopped"
else
    warn "nginx was not running"
fi

echo ""
echo "All services stopped."
