# visual_generation/config.py

import os

# Ollama configuration
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/generate")  # Default Ollama endpoint
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

# Alibaba DashScope API key (can be overridden by environment variable)
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
DASHSCOPE_BASE_URL = os.getenv("DASHSCOPE_BASE_URL", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
# Default chat model for DashScope (Alibaba)
DASHSCOPE_CHAT_MODEL = os.getenv("DASHSCOPE_CHAT_MODEL", "qwen-plus")

# Alibaba image generation API URL
DASHSCOPE_IMAGE_API_URL = os.getenv("DASHSCOPE_IMAGE_API_URL", "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation")
# Default image generation parameters
DASHSCOPE_DEFAULT_SIZE = os.getenv("DASHSCOPE_DEFAULT_SIZE", "1664*928")
print(f"Using DASHSCOPE_DEFAULT_SIZE: {DASHSCOPE_DEFAULT_SIZE}")

DASHSCOPE_IMAGE_MODEL = os.getenv("DASHSCOPE_IMAGE_MODEL", "qwen-image-plus")

# Output directory for generated artifacts
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

OUTPUT_DIR = os.getenv("OUTPUT_DIR", os.path.join(BASE_DIR, "output"))