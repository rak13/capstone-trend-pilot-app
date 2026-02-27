# Visual Generation — Quick Setup

Purpose
- Quick steps to get the `visual_generation` utilities running locally for rendering diagrams and generating images.

Prerequisites
- Python 3.9+ installed.
- Git (optional, for cloning/updating the repo).
- Recommended: create and use a virtual environment.

Minimal setup
1. From the workspace root, create and activate a virtual environment (Windows example):

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1   # PowerShell
# or .venv\Scripts\activate   # cmd.exe
```

2. Install project dependencies (root requirements):

```bash
pip install -r requirements.txt
```

If you have a dedicated environment file for `visual_generation`, install that instead (none provided by default).

Running the tools
- Render a Mermaid diagram (script is in `diagram`):

```bash
cd capstone_trend_pilot/visual_generation/diagram
python render_mermaid.py --help
# Example: python render_mermaid.py test_example.mmd
```

- Generate an image (script is in `image`):

```bash
cd ../image
python generate_image.py --help
# Use the script's CLI or inspect the file for function calls
```

- Query or classify with the LLM helpers (scripts in `llm`):

```bash
cd ../llm
python query_llm.py --help
python classify_llm.py --help
```

- Start the visual service (if you want the service interface):

```bash
cd ../service
python visual_service.py --help
# Or run directly: python visual_service.py
```

Environment variables / API keys
- Some scripts may call external APIs (LLMs, image services). Set provider keys as environment variables before running, for example:

```bash
set OPENAI_API_KEY=your_key_here     # Windows (cmd)
$env:OPENAI_API_KEY = 'your_key_here' # PowerShell
```

If a script needs other env vars, check the top of the script for names (e.g., `os.getenv(...)`).

Quick checks & troubleshooting
- Run `--help` on each script to learn supported CLI args.
- If import errors occur, ensure you installed the correct `python` interpreter and activated the venv.
- For rendering failures, confirm required native tools are installed (some renderers need `graphviz` or node-based mermaid).

Next steps
- Inspect each script to learn required options and provider-specific setup.
- If you want, I can create example commands for the most-used scripts after reviewing them.
