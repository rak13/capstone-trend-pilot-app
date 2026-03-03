# ineedq — AI-Powered LinkedIn Post Generator

> **Live at [ineedq.com](https://ineedq.com)**

ineedq is a full-stack web application that helps professionals craft high-performing LinkedIn posts using AI. It analyses trending topics, generates tailored content, predicts engagement before you post, and publishes directly to LinkedIn — all in one guided workflow.

---

## Features

- **Trend Discovery** — Surfaces trending topics relevant to your industry and audience.
- **AI Post Generation** — Generates a polished LinkedIn post from the selected trend, matched to your tone and follower tier.
- **Engagement Prediction** — A machine-learning model (trained on real LinkedIn data) predicts expected reactions and comments before you hit publish.
- **AI Visual Generation** — Automatically creates a branded image to accompany your post.
- **AI Refinement** — Revise your post with natural-language instructions ("make it more concise", "add a stronger hook").
- **One-Click LinkedIn Publishing** — OAuth 2.0 integration publishes directly to your LinkedIn profile, with optional image attachment.
- **Post History** — Saved posts with engagement metrics viewable in your dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python 3.11, FastAPI, Uvicorn |
| AI / LLM | OpenAI GPT-4o, Alibaba DashScope (Qwen) |
| ML Models | scikit-learn, XGBoost, LightGBM (per-tier RandomForest / Gradient Boosting) |
| Auth | JWT, LinkedIn OAuth 2.0 |
| Infrastructure | AWS EC2 (Amazon Linux 2023), Nginx, Let's Encrypt SSL |

---

## Project Structure

```
capstone-trend-pilot-app/
├── backend/          # FastAPI app, ML models, LinkedIn OAuth
├── frontend/         # React SPA
├── nginx.conf        # Production Nginx config
├── setup.sh          # EC2 setup script
└── stop.sh           # Stop backend/Nginx services
```

---

## Local Development

### Prerequisites
- Python 3.11+, Node.js 18+

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in API keys
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Bug Reports & Feature Requests

GitHub Issues is the **only supported channel** for bug reports and feature requests.

- [Report a bug](../../issues/new?template=bug_report.md)
- [Request a feature](../../issues/new?template=feature_request.md)

> For security vulnerabilities, do **not** open a public issue — see [SECURITY.md](.github/SECURITY.md).

---

## License & Usage

Copyright (c) 2025 Rakib Ahsan. All rights reserved.

This software is proprietary. You may **not** use, copy, modify, distribute, or deploy any part of this codebase without **explicit written permission** from the author. See [LICENSE](LICENSE) for details.

---

## Contact

For licensing enquiries or collaboration, contact **Rakib Ahsan**.
