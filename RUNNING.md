# LinkedIn Launchpad — Running the Project

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.10+ | Backend |
| Node.js | 18+ | Frontend |
| Ollama | latest | Visual generation (optional) |
| Graphviz | any | Diagram rendering (optional) |

---

## 1. Environment Setup

### Backend — set API keys

The actual keys live in `backend/.env.secrets` (gitignored). Copy them into `backend/.env` before running:

```bash
# Windows (cmd)
copy backend\.env.secrets backend\.env

# Mac/Linux
cp backend/.env.secrets backend/.env
```

`backend/.env` (committed template — safe to share):
```
OPENAI_API_KEY=your-openai-api-key-here
DASHSCOPE_API_KEY=your-dashscope-api-key-here
```

`backend/.env.secrets` (gitignored — contains real keys):
```
OPENAI_API_KEY=sk-...    # Required — trends, titles, post generation
DASHSCOPE_API_KEY=sk-... # Optional — Alibaba image generation fallback
```

Keys are read at runtime via `python-dotenv`. **Never hardcode keys in source files.**

### Frontend — API base URL

The file `frontend/.env.local` already contains:

```
VITE_API_URL=http://localhost:8000
```

Change the URL if you deploy the backend to a remote server.

---

## 2. Install Dependencies

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Or using the project venv:

```bash
C:/Users/rakib/Desktop/Work/Capstone/.venv/Scripts/pip install -r backend/requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

---

## 3. Run the Backend

```bash
cd backend
PYTHONIOENCODING=utf-8 uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Swagger UI** → [http://localhost:8000/docs](http://localhost:8000/docs)
**Health check** → [http://localhost:8000/](http://localhost:8000/)

---

## 4. Run the Frontend

```bash
cd frontend
npm run dev
```

Open → [http://localhost:5173](http://localhost:5173)

---

## 5. API Endpoints

| Method | Path | Step | Description |
|---|---|---|---|
| GET | `/` | — | Health check |
| POST | `/api/trends` | 1 | Extract trending topics from LinkedIn bio |
| POST | `/api/post-titles` | 2 | Generate 3 post title options |
| POST | `/api/post-variants` | 3 | Generate 3 post variants (hook styles) |
| POST | `/api/predict` | 4 | Predict reactions + comments |
| POST | `/api/visual` | 5 | Generate diagram/image (base64 PNG) |

### Example: Test `/api/predict`

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "post_text": "I used to think automation was the answer. Now I know better. What do you think? #AI #Leadership",
    "followers": 5000,
    "post_title": "What AI taught me about leadership"
  }'
```

Expected response:
```json
{"reactions": 58, "comments": 10}
```

---

## 6. Visual Generation (Optional)

The `/api/visual` endpoint requires:

1. **Ollama** running locally with Llama 3.1:
   ```bash
   ollama serve
   ollama pull llama3.1:8b
   ```

2. **Graphviz** installed and on PATH:
   - Windows: download from [graphviz.org](https://graphviz.org/download/) and add `bin/` to PATH
   - Mac: `brew install graphviz`
   - Linux: `apt install graphviz`

If Ollama is not running, the `/api/visual` endpoint will return an error — all other endpoints work independently.

---

## 7. Project Structure

```
Capstone/
├── backend/                        # FastAPI backend
│   ├── main.py                     # 5 API routes
│   ├── .env                        # Template (committed) — copy .env.secrets here to run
│   ├── .env.secrets                # Real keys (gitignored) — source of truth for secrets
│   ├── requirements.txt
│   ├── helpers/
│   │   └── feature_engineering.py  # 72-feature extraction for engagement model
│   └── modules/                    # Copied modules (not modified)
│       ├── trend_identification_v2.py
│       ├── engagement_prediction/  # HGBR .pkl models
│       └── visual_generation/      # Diagram + image generation service
│
├── frontend/             # React frontend
│   ├── src/lib/api.ts              # API client (replaces mock-data)
│   ├── src/lib/wizard-store.ts     # Zustand state
│   └── src/components/steps/      # 5-step wizard components
│
├── capstone_trend_pilot/streamlit/ # Original Streamlit app (unchanged)
├── PLAN.md                         # Architecture reference
└── RUNNING.md                      # This file
```

---

## 8. Troubleshooting

| Issue | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'fastapi'` | Run `pip install -r backend/requirements.txt` |
| `/api/trends` times out | Normal — takes 20-60s (pytrends rate limits). Wait or check `trend_cache.json` |
| `UnicodeEncodeError` | Prefix the command with `PYTHONIOENCODING=utf-8` as shown in step 3 |
| CORS error in browser | Backend is running — ensure URL in `.env.local` matches |
| `/api/visual` returns error | Check Ollama is running: `ollama serve` |
| Models not loaded (503) | Backend still starting — wait a few seconds and retry |
