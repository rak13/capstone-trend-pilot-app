# Stable Diffusion Local Image Generator

"""
This script takes a text prompt and generates an image using a local Stable Diffusion model.
Heavy ML libraries are imported lazily inside `generate_image` to keep module import lightweight.
"""


import sys
import requests
import json
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import DASHSCOPE_API_KEY, DASHSCOPE_IMAGE_API_URL, DASHSCOPE_DEFAULT_SIZE, DASHSCOPE_IMAGE_MODEL

def generate_stable_diffusion_image(prompt: str, output_path: str, model_path: str = "CompVis/stable-diffusion-v1-4", disable_safety: bool = True):
    # Import heavy ML libraries lazily so importing this module remains lightweight
    try:
        from diffusers import StableDiffusionPipeline
        import torch
    except Exception as e:
        # Re-raise with clearer message for callers
        raise RuntimeError(f"Missing image generation dependencies: {e}")

    # Use float16 if CUDA is available, else float32 for CPU
    dtype = torch.float16 if torch.cuda.is_available() else torch.float32
    pipe = StableDiffusionPipeline.from_pretrained(model_path, torch_dtype=dtype)
    # device = "cuda" if torch.cuda.is_available() else "cpu"
    device = "cpu"  # force CPU for compatibility; change to "cuda" if GPU is available and configured
    pipe = pipe.to(device)
    # Optionally disable the built-in NSFW safety checker which replaces images
    # with a black image when content is flagged. Use only when you understand
    # the safety/legal implications of bypassing model filters.
    if disable_safety:
        try:
            # Newer versions of diffusers attach a `safety_checker`; setting to
            # None disables the check. Wrap in try/except for compatibility.
            pipe.safety_checker = None
        except Exception:
            pass
    # Use fewer steps and smaller image for speed
    # image = pipe(prompt, num_inference_steps=15, height=240, width=240).images[0]
    image = pipe(prompt).images[0]
    # save the PIL image
    image.save(output_path)
    print(f"Image saved to {output_path}")

def generate_alibaba_image(prompt: str, output_path: str, api_key: str = DASHSCOPE_API_KEY, size: str = DASHSCOPE_DEFAULT_SIZE, model: str = DASHSCOPE_IMAGE_MODEL, prompt_extend: bool = False, url: str = DASHSCOPE_IMAGE_API_URL):
    """
    Generate an image using Alibaba Cloud DashScope API.
    Args:
        prompt (str): The text prompt for image generation.
        api_key (str): DashScope API key.
        output_path (str): Path to save the generated image.
        size (str): Image size, e.g., "1024*1024".
        model (str): Model name, default "z-image-turbo".
        prompt_extend (bool): Whether to extend prompt, default False.
    """
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "model": model,
        "input": {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"text": prompt}
                    ]
                }
            ]
        },
        "parameters": {
            "prompt_extend": prompt_extend,
            "size": size
        }
    }
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    if response.status_code != 200:
        raise RuntimeError(f"Alibaba API error: {response.status_code} {response.text}")
    result = response.json()
    # Extract image URL from new response structure
    try:
        choices = result["output"].get("choices", [])
        if not choices:
            raise ValueError("No choices found in response.")
        content = choices[0]["message"]["content"]
        image_url = None
        for item in content:
            if "image" in item:
                image_url = item["image"]
                break
        if not image_url:
            raise ValueError("No image URL found in content.")
    except Exception:
        raise RuntimeError(f"Failed to parse image URL from response: {result}")
    # Download image
    img_resp = requests.get(image_url)
    if img_resp.status_code != 200:
        raise RuntimeError(f"Failed to download image: {img_resp.status_code} {img_resp.text}")
    with open(output_path, "wb") as f:
        f.write(img_resp.content)
    print(f"Alibaba image saved to {output_path}")

def generate_image(prompt: str, output_path: str, image_type: str = "alibaba", **kwargs):
    """
    Unified image generation function.
    Args:
        prompt (str): The text prompt for image generation.
        output_path (str): Path to save the generated image.
        image_type (str): 'stable_diffusion' or 'alibaba'.
        kwargs: Additional arguments for the backend.
    """
    if image_type == "stable_diffusion":
        return generate_stable_diffusion_image(prompt, output_path, **kwargs)
    elif image_type == "alibaba":
        return generate_alibaba_image(prompt, output_path, **kwargs)
    else:
        raise ValueError(f"Unknown image_type: {image_type}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python generate_image.py <prompt> <output.png> <type> [extra_args]")
        print("type: 'stable_diffusion' or 'alibaba'")
        print("For 'alibaba', set environment variable DASHSCOPE_API_KEY or pass as extra arg.")
        sys.exit(1)
    prompt = sys.argv[1]
    output_path = sys.argv[2]
    image_type = sys.argv[3]

    generate_image(prompt, output_path, image_type)
