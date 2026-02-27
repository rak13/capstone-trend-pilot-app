FROM python:3.10-slim

# Avoid Python buffering and set working directory
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Install system dependencies:
# - Node.js + npm for Mermaid CLI
# - Chromium/Puppeteer runtime libs required by Mermaid CLI (headless Chrome)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        nodejs npm \
        ca-certificates \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libdrm2 \
        libexpat1 \
        libfontconfig1 \
        libgbm1 \
        libgcc1 \
        libgdk-pixbuf-2.0-0 \
        libglib2.0-0 \
        libgobject-2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxrandr2 \
        libxrender1 \
        libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Node package manifest and install Mermaid CLI locally
COPY package.json .
RUN npm install --omit=dev

# Copy the rest of the visual_generation source code into the image
COPY . .

# Dedicated output directory (mount this to the host; do NOT mount /app/service)
RUN mkdir -p /app/output

# Point the Python renderer at the locally installed Mermaid CLI binary
ENV MMDC_PATH=/app/node_modules/.bin/mmdc
ENV OUTPUT_DIR=/app/output
# Mermaid CLI uses Puppeteer (Chromium). In Docker, run Chromium without sandbox.
ENV MMDC_PUPPETEER_CONFIG=/app/puppeteer-config.json

# Default environment variables for DashScope.
# IMPORTANT: override DASHSCOPE_API_KEY at runtime with your real key.
ENV DASHSCOPE_API_KEY="" \
    DASHSCOPE_BASE_URL="https://dashscope-intl.aliyuncs.com/compatible-mode/v1" \
    DASHSCOPE_CHAT_MODEL="qwen-plus" \
    DASHSCOPE_IMAGE_API_URL="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation" \
    DASHSCOPE_DEFAULT_SIZE="1024*1024" \
    DASHSCOPE_IMAGE_MODEL="z-image-turbo"

# Entry point: run the unified visual service CLI.
# You can override the prompt by passing an argument to `docker run`.
ENTRYPOINT ["python", "-u", "service/visual_service.py"]

# Default prompt if none is provided
CMD ["Describe a simple login system with frontend, backend, and database"]

