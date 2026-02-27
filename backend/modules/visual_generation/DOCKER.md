# Docker Setup Guide - Visual Generation Service

## Overview

This guide provides step-by-step instructions to containerize and run the Visual Generation Service using Docker. The service is a **CLI-style application** that processes one prompt at a time, generating either Mermaid diagrams or images based on user input.

---

## Prerequisites

- **Docker** installed and running on your system (Mac, Windows, or Linux)
- A **DashScope API key** from Alibaba Cloud (for LLM and image generation)

---

## Quick Start

1. **Set your API key** (see section below)
2. **Build the container**: `docker build -t visual-generation .`
3. **Run the service**: `docker run --rm -e DASHSCOPE_API_KEY=your_key visual-generation "your prompt here"`

---

## Step-by-Step Instructions

### 1. Set Environment Variables

The only **required** environment variable is `DASHSCOPE_API_KEY`. You can set it in your shell or pass it directly to `docker run`.

#### Option A: Set in Shell (Recommended for Multiple Runs)

**PowerShell (Windows):**
```powershell
$env:DASHSCOPE_API_KEY = "your_real_dashscope_key_here"
```

**cmd.exe (Windows):**
```cmd
set DASHSCOPE_API_KEY=your_real_dashscope_key_here
```

**bash/zsh (Mac/Linux or Git Bash on Windows):**
```bash
export DASHSCOPE_API_KEY="your_real_dashscope_key_here"
```

#### Option B: Pass Directly to Docker Run

You can skip setting it in your shell and pass it directly with `-e DASHSCOPE_API_KEY=...` in the `docker run` command (see examples below).

#### Optional Environment Variables

These have sensible defaults but can be overridden if needed:

- `DASHSCOPE_BASE_URL` (default: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`)
- `DASHSCOPE_CHAT_MODEL` (default: `qwen-plus`)
- `DASHSCOPE_IMAGE_API_URL` (default: `https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`)
- `DASHSCOPE_DEFAULT_SIZE` (default: `1024*1024`)
- `DASHSCOPE_IMAGE_MODEL` (default: `z-image-turbo`)

---

### 2. Build the Container

Navigate to the `visual_generation` directory (where `Dockerfile` is located):

```bash
cd capstone_trend_pilot/visual_generation
```

Build the Docker image:

```bash
docker build -t visual-generation .
```

This will:
- Install Python 3.10 and required Python packages (`requests`, `openai`)
- Install Node.js and npm
- Install Mermaid CLI (`@mermaid-js/mermaid-cli`)
- Copy all source code into the container
- Set up environment variables

**Expected output:** The build should complete successfully with a message like `Successfully tagged visual-generation:latest`

---

### 3. Run the Service

#### Basic Usage (Output JSON Only)

Run the service with a prompt:

**Mac/Linux (bash/zsh):**
```bash
docker run --rm \
  -e DASHSCOPE_API_KEY=your_real_dashscope_key_here \
  visual-generation "Draw a system architecture for a web app with frontend, backend, and database."
```

**Windows PowerShell:**
```powershell
docker run --rm `
  -e DASHSCOPE_API_KEY=your_real_dashscope_key_here `
  visual-generation "Draw a system architecture for a web app with frontend, backend, and database."
```

**Windows cmd.exe:**
```cmd
docker run --rm ^
  -e DASHSCOPE_API_KEY=your_real_dashscope_key_here ^
  visual-generation "Draw a system architecture for a web app with frontend, backend, and database."
```

**Output:** The service will print JSON to the console:
- For diagrams: `{"type": "diagram", "format": "png", "path": "/app/service/generate_diagram.png"}`
- For images: `{"type": "image", "format": "png", "path": "/app/service/generated_image.png"}`

#### Save Output Files to Your Computer

To access the generated images/diagrams on your host machine, mount a volume:

**Mac/Linux (bash/zsh):**
```bash
mkdir -p output

docker run --rm \
  -e DASHSCOPE_API_KEY="your-key" \
  -v "/$(pwd)/output:/app/output" \
  visual-generation "User authentication involves symmetric key encryption"
```

**Windows PowerShell:**
```powershell
mkdir output

docker run --rm `
  -e DASHSCOPE_API_KEY=your_real_dashscope_key_here `
  -v "${PWD}\output:/app/output" `
  visual-generation "Draw a sequence diagram of a user logging in."
```

**Windows cmd.exe:**
```cmd
mkdir output

docker run --rm ^
  -e DASHSCOPE_API_KEY=your_real_dashscope_key_here ^
  -v "%CD%\output:/app/output" ^
  visual-generation "Draw a sequence diagram of a user logging in."
```

After the container finishes, check the `output` folder on your computer. You should see:
- `generate_diagram.png` (for diagram prompts)
- `generated_image.png` (for image prompts)

#### Example Prompts

**Diagram prompts:**
- `"Draw a system architecture for a web app with frontend, backend, and database"`
- `"Create a sequence diagram showing user login flow"`
- `"Design a class diagram for an e-commerce system"`

**Image prompts:**
- `"A cat sitting on a windowsill in the sun"`
- `"A futuristic cityscape at sunset"`
- `"A peaceful mountain landscape with a lake"`

---

### 4. Stop the Service

The container is **not a long-running service**. Each `docker run` command:
- Starts the container
- Processes one prompt
- Prints JSON output
- Exits automatically

The `--rm` flag automatically removes the container after it exits, so no cleanup is needed.

**If you need to stop a running container manually:**

1. **List running containers:**
   ```bash
   docker ps
   ```

2. **Stop a container by ID or name:**
   ```bash
   docker stop <container_id_or_name>
   ```

3. **Remove a stopped container (if you didn't use --rm):**
   ```bash
   docker rm <container_id_or_name>
   ```

---

## Troubleshooting

### Build Errors

**Error: "Cannot connect to Docker daemon"**
- Ensure Docker Desktop (or Docker daemon) is running
- On Linux, you may need to add your user to the `docker` group

**Error: "npm install failed"**
- Check your internet connection
- Try rebuilding: `docker build --no-cache -t visual-generation .`

### Runtime Errors

**Error: "DASHSCOPE_API_KEY not set"**
- Make sure you're passing the API key with `-e DASHSCOPE_API_KEY=...` or have it set in your shell
- Verify your API key is valid

**Error: "Failed to launch the browser process" / missing `libgobject-2.0.so.0`**
- This comes from Mermaid CLI (it uses Puppeteer/Chromium under the hood).
- The Docker image installs the required Chromium runtime libraries and uses a Puppeteer config that adds `--no-sandbox`.
- Rebuild the image after pulling the latest Dockerfile changes:
  - `docker build --no-cache -t visual-generation .`

**Error: "LLM error" or "Image generation error"**
- Check your DashScope API key is valid and has sufficient credits
- Verify your internet connection (the service calls external APIs)
- Check the container logs for detailed error messages

**No output files created:**
- Ensure you mounted a volume with `-v` if you want to access files on your host
- Check that the prompt was processed successfully (look for JSON output)

### Common Issues

**"Permission denied" errors on Linux/Mac:**
- The container runs as root by default, but output files may have permission issues
- Try: `docker run --rm --user $(id -u):$(id -g) ...` (Linux/Mac only)

**Windows path issues:**
- Use forward slashes in Docker volume paths: `/app/output`
- Use PowerShell or Git Bash for better compatibility

---

## Project Structure

```
visual_generation/
├── Dockerfile              # Docker container definition
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies (Mermaid CLI)
├── config.py              # Configuration (API keys, URLs, models)
├── DOCKER.md              # This file
├── llm/                   # LLM integration (classify, query)
├── diagram/               # Mermaid diagram rendering
├── image/                 # Image generation (DashScope API)
└── service/               # Unified CLI service (entry point)
```

---

## Technical Details

### Runtime Versions

- **Python**: 3.10 (slim Debian-based image)
- **Node.js**: Latest stable from Debian repositories
- **Mermaid CLI**: Latest version from npm (`@mermaid-js/mermaid-cli`)

### Entry Point

The container runs: `python -u service/visual_service.py <prompt>`

- `-u` flag ensures unbuffered output (immediate console output)
- The script expects one command-line argument (the user prompt)

### How It Works

1. User provides a text prompt
2. `visual_service.py` calls `classify_and_generate()` from `llm/classify_llm.py`
3. The LLM (DashScope/Qwen) classifies the prompt as either:
   - **"diagram"** → Generates Mermaid code → Renders to PNG using Mermaid CLI
   - **"image"** → Generates an image prompt → Calls DashScope image API → Downloads PNG
4. Returns JSON with the output file path

### Ports

**No ports are exposed** - this is a CLI tool, not a web server. Each run processes one prompt and exits.

---

## Next Steps

- Customize the Dockerfile if you need additional system dependencies
- Modify `config.py` or pass environment variables to change API endpoints or models
- Integrate this container into a larger system (e.g., call it from another service)
- Add health checks or monitoring if running in production

---

## Support

For issues specific to:
- **Docker setup**: Check this guide and Docker documentation
- **API errors**: Verify your DashScope API key and account status
- **Code issues**: Review the source code in `llm/`, `diagram/`, `image/`, and `service/` directories
