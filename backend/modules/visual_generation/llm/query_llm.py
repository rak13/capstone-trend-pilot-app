# LLM API Call Script (Ollama Llama 3.1)

"""
This script sends user input and context to a local Ollama Llama 3.1 model via API.
It classifies the input and, if architectural, generates Mermaid code.
"""

import requests
import sys
import json

import os
from openai import OpenAI


import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import config variables
from config import OLLAMA_API_URL, OLLAMA_MODEL, DASHSCOPE_API_KEY, DASHSCOPE_BASE_URL, DASHSCOPE_CHAT_MODEL

def send_ollama_prompt(prompt: str, model: str = OLLAMA_MODEL, base_url: str = OLLAMA_API_URL):
    """Send a raw prompt string to the Ollama API and return the unified text response.

    This function keeps model selection centralized (uses `MODEL` by default) and
    returns a concatenated text response to simplify callers.
    """
    use_model = model if model is not None else OLLAMA_MODEL
    data = {
        "model": use_model,
        "prompt": prompt,
        "stream": False
    }
    response = requests.post(base_url, json=data)
    response.raise_for_status()
    data = response.json()
    # Normalize common Ollama response shapes
    if isinstance(data, dict):
        if "response" in data:
            return data["response"]
        if "responses" in data and isinstance(data["responses"], list):
            parts = []
            for r in data["responses"]:
                content = r.get("content", [])
                for c in content:
                    if c.get("type") in ("output_text", "message") and "text" in c:
                        parts.append(c["text"])
            if parts:
                return "".join(parts)
    return json.dumps(data, ensure_ascii=False)


def send_alibaba_prompt(messages, model=DASHSCOPE_CHAT_MODEL, api_key=DASHSCOPE_API_KEY, base_url=DASHSCOPE_BASE_URL):
    """Send a chat prompt to Alibaba Cloud's Model Studio (DashScope) using OpenAI-compatible API."""
    
    if not api_key:
        raise ValueError("DASHSCOPE_API_KEY environment variable not set and no api_key provided.")
    
    client = OpenAI(api_key=api_key, base_url=base_url)
    completion = client.chat.completions.create(
        model=model,
        messages=messages,
    )
    return completion.choices[0].message.content if completion.choices else completion.model_dump_json()


def send_prompt(prompt, llm_type="alibaba", **kwargs):
    """Dispatch prompt to the specified LLM type ('ollama' or 'alibaba')."""
    if llm_type == "ollama":
        return send_ollama_prompt(prompt, **kwargs)
    elif llm_type == "alibaba":
        # Alibaba expects a list of messages, not a string prompt
        if isinstance(prompt, str):
            messages = [
                {"role": "user", "content": prompt},
            ]
        else:
            messages = prompt
        return send_alibaba_prompt(messages, **kwargs)
    else:
        raise ValueError(f"Unknown llm_type: {llm_type}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python query_llm.py <user_input> [llm_type]")
        sys.exit(1)
    user_input = sys.argv[1]
    llm_type = sys.argv[2] if len(sys.argv) > 2 else "alibaba"
    print(send_prompt(user_input, llm_type=llm_type))
