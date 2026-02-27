# LinkedIn Launchpad — Domain Deployment (iqneed.com)

How the app is deployed on AWS EC2 behind a custom domain, with no Nginx and no hardcoded IPs.

---

## How it works

```
iqneed.com  →  Namecheap masked redirect  →  EC2:8080 (Vite dev server)
                                                    │
                                          /api/* ───┘ Vite proxy
                                                    │
                                          localhost:8000 (FastAPI)
```

- The browser only ever talks to port 8080 (Vite)
- When the React app calls `/api/trends`, Vite intercepts it and forwards it to the FastAPI backend on `localhost:8000`
- No IP addresses, no ports, no `VITE_API_URL` needed

---

## Namecheap DNS

Keep the existing record:

| Type | Host | Value | Mode |
|------|------|-------|------|
| URL Redirect | @ | `http://ec2-3-25-199-255.ap-southeast-2.compute.amazonaws.com:8080` | Masked |

No changes needed here.

---

## AWS EC2 Security Group

Ensure these inbound rules are open:

| Port | Purpose |
|------|---------|
| 22 | SSH |
| 8000 | FastAPI backend |
| 8080 | Vite frontend |

---

## What's configured in the codebase

### `frontend/vite.config.ts`

```typescript
proxy: {
  '/api': 'http://localhost:8000',
},
```

Any `/api/*` request from the React app is forwarded by Vite to the FastAPI backend. No CORS issues, no hardcoded addresses.

### `frontend/src/lib/api.ts`

```typescript
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "";
```

Defaults to `""` (empty string) → all fetch calls are relative URLs → handled by the Vite proxy above.

---

## First-time setup on EC2

```bash
# 1. Clone / copy the project
cd /home/ubuntu   # or wherever you want it

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Install frontend dependencies
cd frontend && npm install && cd ..

# 4. Set API keys in backend/.env
nano backend/.env
# Fill in: OPENAI_API_KEY and DASHSCOPE_API_KEY

# 5. Clear VITE_API_URL (use Vite proxy instead)
echo "VITE_API_URL=" > frontend/.env.local
```

---

## Running on EC2

Export secrets once, then start both services in the background:

```bash
export OPENAI_API_KEY="sk-..."
export DASHSCOPE_API_KEY="sk-..."
export PYTHONIOENCODING="utf-8"

# Backend
cd backend
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
echo "Backend PID: $!"

# Frontend
cd ../frontend
nohup npm run dev > ../frontend.log 2>&1 &
echo "Frontend PID: $!"
```

---

## Managing the processes

```bash
# Check logs
tail -f backend.log
tail -f frontend.log

# Find PIDs
lsof -ti :8000    # backend
lsof -ti :8080    # frontend

# Stop both
kill $(lsof -ti :8000) $(lsof -ti :8080)
```

---

## Updating the app

```bash
# Pull latest code
git pull

# Restart backend
kill $(lsof -ti :8000)
cd backend
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &

# Restart frontend
kill $(lsof -ti :8080)
cd ../frontend
nohup npm run dev > ../frontend.log 2>&1 &
```
