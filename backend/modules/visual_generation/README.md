# Visual Generation Service — Setup & Usage

## Overview
This module provides a local service to generate architectural diagrams (via Mermaid) or general images (via Stable Diffusion) from user text, using Llama 3.1 (Ollama) for classification and code generation.

---

## Folder Structure
- llm/: LLM API call script (Ollama)
- diagram/: Mermaid rendering script
- image/: Stable Diffusion script
- service/: Unified CLI service

---

## Setup

### Prerequisites
- Python 3.8+
- Node.js (for Mermaid CLI)
- Mermaid CLI: `npm install -g @mermaid-js/mermaid-cli`
- Ollama running with Llama 3.1:8b (`ollama run llama3.1:8b`)
- diffusers, torch, and a local Stable Diffusion model (see script for details)

### Python Dependencies
```
pip install diffusers torch requests
```

---

## Usage

1. Run Ollama and ensure Llama 3.1 is available.
2. For architectural diagrams:
   - The service will generate Mermaid code and render to SVG.
3. For general images:
   - The service will generate an image using Stable Diffusion.

### Run the Unified Service
```
cd visual_generation/service
python visual_service.py "<your prompt here>"
```
- Output will be `diagram.svg` or `image.png` in the current directory.

---

## Example Prompts
- "Draw a system architecture for a web app with frontend, backend, and database."
- "A cat sitting on a windowsill in the sun."

---

## Notes
- All processing is local; no cloud APIs are used.
- You can extend or modularize scripts as needed.
