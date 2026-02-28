# LinkedIn Launchpad — Running the Project

---

## 1. Setup

### Install dependencies

```bash
# Backend
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install
```

### Install Graphviz system binaries

The visual generation feature requires the Graphviz `dot` executable in addition to the Python package.

**Any OS (conda/mamba — recommended):**
```bash
conda install -c conda-forge graphviz
```

If you're not using conda, use your OS package manager:

| OS | Command |
|----|---------|
| Amazon Linux 2023 | `sudo dnf install -y graphviz` |
| macOS | `brew install graphviz` |
| Windows | `winget install Graphviz.Graphviz` |

> **Windows note:** If `dot` is not found after install, add `C:\Program Files\Graphviz\bin` to your system PATH manually.

Verify the install worked:
```bash
dot -V
```

### Export secrets

Run these once in your terminal session before starting anything:

```bash
export OPENAI_API_KEY="sk-..."
export DASHSCOPE_API_KEY="sk-..."
export PYTHONIOENCODING="utf-8"
```

---

## 2. Run in Terminal

Open **two terminals**, run the exports from Setup in each, then:

**Terminal 1 — Backend**

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

- Backend → http://localhost:8000
- Frontend → https://localhost:8080
- Swagger → http://localhost:8000/docs

Both stop when you close the terminal or press `Ctrl+C`.

---

## 3. Run in Background (survives terminal close)

Run the exports from Setup first, then:

```bash
# Backend
cd backend
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
echo "Backend PID: $!"

# Frontend
cd ../frontend
nohup npm run dev > ../frontend.log 2>&1 &
echo "Frontend PID: $!"
```

### Check logs

```bash
tail -f backend.log
tail -f frontend.log
```

### Find PIDs later

```bash
lsof -ti :8000    # backend PID
lsof -ti :8080    # frontend PID
```

### Stop

```bash
# Stop both at once
kill $(lsof -ti :8000) $(lsof -ti :8080)

# Force stop if needed
kill -9 $(lsof -ti :8000) $(lsof -ti :8080)
```

---

## 4. Production Deployment (ineedq.com on EC2 + Amazon Linux 2023)

### Step 1 — Namecheap DNS

Remove the existing URL Redirect record and replace with:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 3.25.193.222 | Automatic |
| A Record | www | 3.25.193.222 | Automatic |

Wait 5–30 minutes for DNS to propagate. Verify with:
```bash
nslookup ineedq.com
```

### Step 2 — EC2 Security Group

In the AWS Console, open inbound rules for your EC2 instance:

| Port | Protocol | Source |
|------|----------|--------|
| 80   | TCP | 0.0.0.0/0 |
| 443  | TCP | 0.0.0.0/0 |
| 22   | TCP | Your IP only |

You can close port 8080 — Nginx replaces it.

### Step 3 — Install Nginx and Certbot (on EC2)

```bash
sudo dnf install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 4 — Get SSL certificate

```bash
sudo certbot --nginx -d ineedq.com -d www.ineedq.com
```

Follow the prompts. Certbot auto-configures Nginx and sets up auto-renewal.

### Step 5 — Deploy Nginx config

```bash
sudo cp nginx.conf /etc/nginx/conf.d/ineedq.conf
sudo nginx -t          # verify config is valid
sudo systemctl reload nginx
```

### Step 6 — Build the frontend

```bash
cd frontend
npm run build          # outputs to frontend/dist/
```

### Step 7 — Run the backend

```bash
cd backend
export OPENAI_API_KEY="sk-..."
export DASHSCOPE_API_KEY="sk-..."
export PYTHONIOENCODING="utf-8"
nohup uvicorn main:app --host 127.0.0.1 --port 8000 > ../backend.log 2>&1 &
```

> Note: `--host 127.0.0.1` (not 0.0.0.0) — Nginx proxies to it, no need to expose it publicly.

### Result

- Site → https://ineedq.com
- API  → https://ineedq.com/api/ (proxied by Nginx to port 8000)
- SSL auto-renews every 90 days via certbot's systemd timer

---

## 5. Troubleshooting

| Issue                                            | Fix                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| `ModuleNotFoundError: No module named 'fastapi'` | Run `pip install -r backend/requirements.txt`                        |
| `/api/trends` times out                          | Normal — takes 20–60s. Wait or check `trend_cache.json`              |
| `UnicodeEncodeError`                             | Re-run `export PYTHONIOENCODING=utf-8`                               |
| CORS error in browser                            | Check `frontend/.env.local` has `VITE_API_URL=` (empty — uses proxy) |
| `/api/visual` returns error                      | Ollama must be running: `ollama serve`                               |
| `failed to execute PosixPath('dot')`             | Graphviz binaries not installed — see **Install Graphviz** above     |
| Models not loaded (503)                          | Backend still starting — wait a few seconds and retry                |
