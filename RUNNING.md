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

### Export secrets

Run these once in your terminal session before starting anything:

```bash
export OPENAI_API_KEY=sk-...       # Required
export DASHSCOPE_API_KEY=sk-...    # Optional — Alibaba image generation only
export PYTHONIOENCODING=utf-8
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
- Frontend → http://localhost:5173
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
lsof -ti :5173    # frontend PID
```

### Stop

```bash
# Stop both at once
kill $(lsof -ti :8000) $(lsof -ti :5173)

# Force stop if needed
kill -9 $(lsof -ti :8000) $(lsof -ti :5173)
```

---

## 4. Troubleshooting

| Issue | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'fastapi'` | Run `pip install -r backend/requirements.txt` |
| `/api/trends` times out | Normal — takes 20–60s. Wait or check `trend_cache.json` |
| `UnicodeEncodeError` | Re-run `export PYTHONIOENCODING=utf-8` |
| CORS error in browser | Check `frontend/.env.local` has `VITE_API_URL=http://localhost:8000` |
| `/api/visual` returns error | Ollama must be running: `ollama serve` |
| Models not loaded (503) | Backend still starting — wait a few seconds and retry |
