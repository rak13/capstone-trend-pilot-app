# TrendPilot — Production Deployment (ineedq.com)

Full production setup: EC2 (Amazon Linux 2023) + Nginx + Let's Encrypt SSL + built React frontend.

---

## Architecture

```
Browser  →  https://ineedq.com  →  Nginx (443)
                                      │
                               /api/* │  proxy_pass
                                      ↓
                              FastAPI (127.0.0.1:8000)

                         Everything else → frontend/dist/ (static)
```

- Nginx serves the built React app from `frontend/dist/`
- Nginx proxies `/api/*` to FastAPI on localhost — not exposed publicly
- SSL via Let's Encrypt (auto-renews every 90 days)
- Backend runs as a systemd service (`trendpilot-backend`) — survives reboots

---

## Prerequisites (do once, outside the script)

### 1 — Namecheap DNS

**Delete** any URL Redirect record (it overrides A records — they cannot coexist).
Add these A records pointing to your EC2 instance's public IP:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | `<EC2 public IP>` | Automatic |
| A Record | www | `<EC2 public IP>` | Automatic |

Wait 5–30 min for propagation. The setup script will verify this for you.

> **Tip:** Assign an [Elastic IP](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html) in the AWS Console so the IP never changes on restart.

### 2 — EC2 Security Group inbound rules

| Port | Protocol | Source |
|------|----------|--------|
| 22   | TCP | Your IP only |
| 80   | TCP | 0.0.0.0/0 |
| 443  | TCP | 0.0.0.0/0 |

Ports 8000 and 8080 do NOT need to be public.

### 3 — Clone the repo on EC2

```bash
ssh ec2-user@<EC2-IP>
git clone <your-repo-url> capstone-trend-pilot-app
cd capstone-trend-pilot-app
chmod +x setup.sh
```

---

## Fresh Install (run once)

```bash
# Set your API keys
export OPENAI_API_KEY="sk-..."
export DASHSCOPE_API_KEY="sk-..."

# Run the setup script
./setup.sh --email you@email.com
```

The script will:
1. Check DNS — shows this instance's IP vs what the domain resolves to, warns if mismatched
2. Check API keys
3. Install/verify `python3`, `pip3`, `node`, `npm` (skips if already present)
4. Install `nginx`, `certbot`, `graphviz` via dnf
5. Install Python backend dependencies
6. Fix home directory permissions for Nginx
7. Build the React frontend
8. Write secrets to `backend/.env` (mode 600)
9. Issue SSL certificate via Let's Encrypt
10. Deploy `nginx.conf` and start Nginx
11. Create and start the `trendpilot-backend` systemd service
12. Verify the site and API are responding

**Options:**

| Flag | Description |
|------|-------------|
| `--domain DOMAIN` | Domain name (default: `ineedq.com`) |
| `--email EMAIL` | Email for Let's Encrypt renewal alerts (recommended) |
| `--skip-cert` | Skip SSL cert — use when cert already exists |
| `--skip-build` | Skip `npm install` + build — use when `dist/` is already up to date |

---

## Updating the App

After pushing new code to the repo:

```bash
ssh ec2-user@<EC2-IP>
cd capstone-trend-pilot-app
git pull

export OPENAI_API_KEY="sk-..."
export DASHSCOPE_API_KEY="sk-..."

./setup.sh --skip-cert
```

`--skip-cert` skips SSL issuance (cert already exists) but still rebuilds the frontend, reinstalls Python deps, and restarts the backend service.

---

## Backend Service Management

The backend runs as a systemd service and auto-starts on reboot.

```bash
sudo systemctl status  trendpilot-backend    # check status
sudo systemctl restart trendpilot-backend    # restart
sudo systemctl stop    trendpilot-backend    # stop
sudo journalctl -u     trendpilot-backend -f # live logs
```

---

## Nginx Management

```bash
sudo nginx -t          # test config syntax
sudo nginx -s reload   # reload config (no downtime)
sudo nginx -s stop     # stop
sudo nginx             # start (if not running)
```

---

## Logs

```bash
# Backend logs
sudo journalctl -u trendpilot-backend -f

# Nginx error log
sudo tail -f /var/log/nginx/error.log
```

---

## Verify Everything Works

```bash
curl -I https://ineedq.com          # → HTTP/2 200
curl https://ineedq.com/api/        # → {"status":"ok",...}
```

---

## Gotchas

| Problem | Cause | Fix |
|---------|-------|-----|
| A records not resolving | Namecheap URL Redirect still active | Delete the URL Redirect record entirely |
| Nginx 500 / Permission denied | Home dir is mode 700 | `chmod o+x /home/ec2-user` (script does this) |
| `systemctl start nginx` fails | systemd issue despite valid config | Use `sudo nginx` directly (script does this) |
| Certbot `--nginx` can't install cert | No existing server block for domain | Script handles this with a temp config |
| `failed to execute PosixPath('dot')` | Graphviz system binary missing | `sudo dnf install -y graphviz` (script does this) |
| `/api/` returns 502 | Backend not running | `sudo systemctl restart trendpilot-backend` |
| Site shows old content | dist not rebuilt | Re-run `./setup.sh --skip-cert` |
| DNS mismatch warning on setup | EC2 got a new IP after restart | Update Namecheap A records, or use Elastic IP |
