#!/bin/bash
# setup.sh — One-shot production setup for TrendPilot
# Run this from the repo root on a fresh Amazon Linux 2023 EC2 instance.
#
# Usage:
#   export OPENAI_API_KEY="sk-..."
#   export DASHSCOPE_API_KEY="sk-..."
#   ./setup.sh [OPTIONS]
#
# Options:
#   --domain  DOMAIN    Domain name (default: ineedq.com)
#   --email   EMAIL     Email for Let's Encrypt renewal alerts (recommended)
#   --skip-cert         Skip SSL cert issuance (cert already exists)
#   --skip-build        Skip npm install + build (dist/ already exists)
#
# Re-run with --skip-cert to update the app without touching SSL:
#   git pull && ./setup.sh --skip-cert

set -euo pipefail

# ── colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗] ERROR:${NC} $*" >&2; exit 1; }
step() { echo -e "\n${BOLD}${GREEN}━━━ $* ━━━${NC}"; }

# ── defaults ──────────────────────────────────────────────────────────────────
DOMAIN="ineedq.com"
EMAIL=""
SKIP_CERT=false
SKIP_BUILD=false
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)     DOMAIN="$2";       shift 2 ;;
        --email)      EMAIL="$2";        shift 2 ;;
        --skip-cert)  SKIP_CERT=true;    shift ;;
        --skip-build) SKIP_BUILD=true;   shift ;;
        *) die "Unknown argument: $1" ;;
    esac
done

echo -e "\n${BOLD}TrendPilot — Production Setup${NC}"
echo "  Domain:  $DOMAIN"
echo "  App dir: $APP_DIR"
[[ "$SKIP_CERT"  == true ]] && echo "  [skip-cert]"
[[ "$SKIP_BUILD" == true ]] && echo "  [skip-build]"

# ── DNS / IP check ────────────────────────────────────────────────────────────
step "Checking DNS"
THIS_IP=$(curl -s --max-time 5 https://checkip.amazonaws.com 2>/dev/null || echo "unknown")
DNS_IP=$(dig +short "$DOMAIN" 2>/dev/null | tail -1 || echo "unknown")

echo "  This instance's public IP : $THIS_IP"
echo "  $DOMAIN resolves to       : $DNS_IP"

if [[ "$THIS_IP" == "unknown" ]]; then
    warn "Could not determine public IP — continuing anyway"
elif [[ "$THIS_IP" != "$DNS_IP" ]]; then
    echo ""
    warn "DNS mismatch! Update your Namecheap A records:"
    warn "  @ → $THIS_IP"
    warn "  www → $THIS_IP"
    warn "Then wait for DNS to propagate before running --skip-cert=false"
    echo ""
    read -rp "Continue anyway? (y/N) " yn
    [[ "$yn" =~ ^[Yy]$ ]] || exit 1
else
    log "DNS is pointing to this instance"
fi

# ── validate required env vars ────────────────────────────────────────────────
step "Checking API keys"
[[ -z "${OPENAI_API_KEY:-}" ]]    && die "OPENAI_API_KEY is not set. Run: export OPENAI_API_KEY=sk-..."
[[ -z "${DASHSCOPE_API_KEY:-}" ]] && die "DASHSCOPE_API_KEY is not set. Run: export DASHSCOPE_API_KEY=sk-..."
log "OPENAI_API_KEY is set"
log "DASHSCOPE_API_KEY is set"

# ── check / install required tools ───────────────────────────────────────────
step "Checking / installing required tools"

pkg_install() {
    local cmd="$1" pkg="$2" ver_flag="${3:---version}"
    if command -v "$cmd" &>/dev/null; then
        log "$cmd already present  ($($cmd $ver_flag 2>&1 | head -1))"
    else
        log "$cmd not found — installing $pkg..."
        sudo dnf install -y "$pkg" > /dev/null
        log "$cmd installed       ($($cmd $ver_flag 2>&1 | head -1))"
    fi
}

pkg_install python3 python3        --version
pkg_install pip3    python3-pip    --version
pkg_install node    nodejs         --version
pkg_install npm     npm            --version

# ── system packages (nginx, certbot, graphviz) ────────────────────────────────
step "Installing system packages (nginx, certbot, graphviz)"
sudo dnf install -y \
    nginx \
    certbot python3-certbot-nginx \
    graphviz \
    bind-utils \
    > /dev/null
log "System packages ready"

# ── backend Python dependencies ───────────────────────────────────────────────
step "Installing backend Python dependencies"
pip3 install -r "$APP_DIR/backend/requirements.txt" --quiet
log "Python dependencies installed"

# ── home dir permissions (nginx must be able to traverse /home/ec2-user/) ─────
step "Setting home directory permissions for Nginx"
chmod o+x "$HOME"
log "chmod o+x $HOME — Nginx can now reach frontend/dist/"

# ── frontend build ────────────────────────────────────────────────────────────
if [[ "$SKIP_BUILD" == false ]]; then
    step "Building frontend"
    cd "$APP_DIR/frontend"
    npm install --silent
    npm run build
    cd "$APP_DIR"
    log "Frontend built → frontend/dist/"
else
    warn "Skipping frontend build (--skip-build)"
    [[ -d "$APP_DIR/frontend/dist" ]] || die "frontend/dist/ missing — run without --skip-build"
fi

# ── write secrets to env file ─────────────────────────────────────────────────
step "Writing secrets to backend/.env"
cat > "$APP_DIR/backend/.env" <<EOF
OPENAI_API_KEY=$OPENAI_API_KEY
DASHSCOPE_API_KEY=$DASHSCOPE_API_KEY
PYTHONIOENCODING=utf-8
EOF
chmod 600 "$APP_DIR/backend/.env"
log "Secrets written to backend/.env (mode 600, not committed)"

# ── SSL certificate ───────────────────────────────────────────────────────────
cert_exists() {
    sudo test -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" 2>/dev/null
}

if [[ "$SKIP_CERT" == false ]]; then
    step "Obtaining SSL certificate for $DOMAIN"

    if cert_exists; then
        warn "Certificate already exists for $DOMAIN — skipping issuance"
    else
        # Remove any existing domain nginx config to avoid conflicting server names
        sudo rm -f "/etc/nginx/conf.d/$DOMAIN.conf"

        # Temporary minimal nginx config so certbot --nginx can find a server block
        sudo tee /etc/nginx/conf.d/_certbot_temp.conf > /dev/null <<NGINXEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 200 "ok"; }
}
NGINXEOF

        if ! pgrep -x nginx > /dev/null; then sudo nginx; else sudo nginx -s reload; fi

        # Build certbot args
        CERTBOT_ARGS=(--nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos)
        if [[ -n "$EMAIL" ]]; then
            CERTBOT_ARGS+=(--email "$EMAIL")
        else
            warn "No --email provided — using --register-unsafely-without-email (no renewal alerts)"
            CERTBOT_ARGS+=(--register-unsafely-without-email)
        fi

        sudo certbot "${CERTBOT_ARGS[@]}"
        sudo rm -f /etc/nginx/conf.d/_certbot_temp.conf
        log "SSL certificate issued for $DOMAIN"
    fi
else
    warn "Skipping SSL cert (--skip-cert)"
    cert_exists || die "No cert found for $DOMAIN at /etc/letsencrypt/live/$DOMAIN/fullchain.pem — remove --skip-cert"
fi

# ── deploy Nginx config ───────────────────────────────────────────────────────
step "Deploying Nginx config"
sudo cp "$APP_DIR/nginx.conf" "/etc/nginx/conf.d/$DOMAIN.conf"
sudo nginx -t
if pgrep -x nginx > /dev/null; then
    sudo nginx -s reload
    log "Nginx reloaded"
else
    sudo nginx
    log "Nginx started"
fi

# ── backend systemd service ───────────────────────────────────────────────────
step "Installing backend systemd service"
sudo tee /etc/systemd/system/trendpilot-backend.service > /dev/null <<EOF
[Unit]
Description=TrendPilot FastAPI Backend
After=network.target

[Service]
User=$USER
WorkingDirectory=$APP_DIR/backend
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$(command -v uvicorn) main:app --host 127.0.0.1 --port 8000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable trendpilot-backend
sudo systemctl restart trendpilot-backend

# Give the backend a moment to start
sleep 3

if sudo systemctl is-active --quiet trendpilot-backend; then
    log "Backend service is running"
else
    warn "Backend service did not start — check logs:"
    warn "  sudo journalctl -u trendpilot-backend -n 50"
fi

# ── verify ────────────────────────────────────────────────────────────────────
step "Verifying deployment"

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/" 2>/dev/null || echo "000")
if [[ "$API_STATUS" == "200" ]]; then
    log "Backend API → HTTP $API_STATUS"
else
    warn "Backend API → HTTP $API_STATUS — backend may still be loading"
fi

SITE_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" "https://$DOMAIN" 2>/dev/null || echo "000")
if [[ "$SITE_STATUS" == "200" ]]; then
    log "https://$DOMAIN → HTTP $SITE_STATUS"
else
    warn "https://$DOMAIN → HTTP $SITE_STATUS"
fi

# ── done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}━━━ Done ━━━${NC}"
echo ""
echo "  Site  → https://$DOMAIN"
echo "  API   → https://$DOMAIN/api/"
echo ""
echo "  Backend service commands:"
echo "    sudo systemctl status trendpilot-backend"
echo "    sudo journalctl -u trendpilot-backend -f"
echo "    sudo systemctl restart trendpilot-backend"
echo ""
echo "  To update the app:"
echo "    git pull && ./setup.sh --skip-cert"
echo ""
