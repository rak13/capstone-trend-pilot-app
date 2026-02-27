# Unified Visual Generation Service (CLI)

"""
This script integrates LLM, diagram, and image generation modules.
It takes user input, queries the LLM, and routes to the appropriate generator.
"""

import sys
import subprocess
import os
import json
import base64
import time

# Script paths
BASE_DIR = os.path.dirname(__file__)
# Output directory is now configured in config.py
# ensure parent package (visual_generation) is importable
sys.path.insert(0, os.path.normpath(os.path.join(BASE_DIR, '..')))
# Ensure llm subpackage is importable as top-level modules (query_llm import expects this)
sys.path.insert(0, os.path.normpath(os.path.join(BASE_DIR, '..', 'llm')))

# Import functions directly at module level (use functions directly)
from llm.classify_llm import classify_and_generate
from diagram.render_mermaid import render_mermaid
from gv_diagram.render_graphviz import render_graphviz
from image.generate_image import generate_image

import logging
LOG_PATH = os.path.join(BASE_DIR, 'visual_service.log')
# Simple logging: console INFO+; file handler is attached when the service is run (not on import)
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger()

from config import OUTPUT_DIR
os.makedirs(OUTPUT_DIR, exist_ok=True)

def init_logging():
    """Attach a file handler for debug logging.

    Called from `main()` so importing this module does not create files on disk.
    """
    try:
        fh = logging.FileHandler(LOG_PATH, encoding='utf-8')
        fh.setLevel(logging.DEBUG)
        fh.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
        logging.getLogger().addHandler(fh)
    except Exception:
        logger.exception('Failed to create log file handler')


def run_llm(prompt: str, timeout: int = 200) -> dict:
    """Run the classify_llm script and return parsed JSON result."""
    return classify_and_generate(prompt)


def generate_mermaid_image(mermaid_code: str, timeout: int = 200) -> str:
    # Call the renderer directly with the provided Mermaid code string
    m = (mermaid_code or '').strip()
    # Output file should be created in the output folder (OUTPUT_DIR)
    out_filename = "generate_diagram.png"
    out_path = os.path.join(OUTPUT_DIR, out_filename)
    try:
        render_mermaid(m, out_path, format='png')
        # verify that the renderer produced the expected output file
        if not os.path.exists(out_path):
            logger.error('Mermaid renderer did not produce output file: %s', out_path)
            raise RuntimeError(f'Mermaid renderer did not produce output file: {out_path}')
        return out_path
    except Exception:
        # propagate the exception after logging; caller handles persistence of source
        logger.exception('Error rendering diagram')
        raise


def generate_graphviz_image(diagram_code: str, timeout: int = 200) -> str:
    # Call the Graphviz renderer directly with the provided DOT code string
    d = (diagram_code or '').strip()
    out_path = os.path.join(OUTPUT_DIR, "generated_diagram.png")
    try:
        render_graphviz(d, out_path, format='png')
        if not os.path.exists(out_path):
            logger.error('Graphviz renderer did not produce output file: %s', out_path)
            raise RuntimeError(f'Graphviz renderer did not produce output file: {out_path}')
        return out_path
    except Exception:
        logger.exception('Error rendering diagram')
        raise


def generate_sd_image(prompt: str, timeout: int = 200) -> str:
    # Call the Stable Diffusion generator script to create an image file
    # Output file should be created in the output folder (OUTPUT_DIR)
    out_filename = "generated_image.png"
    out_path = os.path.join(OUTPUT_DIR, out_filename)
    try:
        # call the image generator function directly
        generate_image(prompt, out_path)
        # size = os.path.getsize(out_path)
        return out_path
    except Exception as e:
        logger.exception('Image generator failed')
        raise


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python visual_service.py <user_input>"}))
        sys.exit(1)
    user_input = sys.argv[1]
    try:
        llm_res = run_llm(user_input)
    except Exception as e:
        logger.exception('LLM error')
        print(json.dumps({"error": f"LLM error: {e}"}))
        sys.exit(2)

    # Log LLM response for debugging/traceability
    try:
        logger.info('LLM response: %s', json.dumps(llm_res, ensure_ascii=False))
    except Exception:
        logger.info('LLM response (non-serializable): %s', str(llm_res))

    typ = llm_res.get('type')
    if typ == 'diagram':
        diagram_code = llm_res.get('diagram_code', '')
        # Log the DOT source produced by the LLM
        logger.info('DOT code (first 1024 chars): %s', (diagram_code or ''))
        try:
            out_path = generate_graphviz_image(diagram_code)
        except Exception as e:
            import traceback
            traceback.print_exc()
            # persist the DOT source for inspection
            ts = int(time.time())
            dot_name = f'failed_diagram_{ts}.dot'
            dot_path = os.path.join(OUTPUT_DIR, dot_name)
            try:
                with open(dot_path, 'w', encoding='utf-8') as df:
                    df.write(diagram_code or '')
                print(f'Saved failed DOT source to {dot_path}')
            except Exception:
                traceback.print_exc()
                dot_path = None
            err_json = {"error": f"Graphviz render error: {e}", "dot_path": dot_path}
            print(json.dumps(err_json))
            sys.exit(3)
        out_json = {"type": "diagram", "format": "png", "path": out_path}
        print(json.dumps(out_json))
    elif typ == 'image':
        prompt = llm_res.get('prompt', user_input)
        # Log the finalized image prompt produced by the LLM
        logger.info('Image prompt (first 512 chars): %s', (prompt or '')[:512])
        try:
            out_path = generate_sd_image(prompt)
        except Exception as e:
            logger.error('Image generation error: %s', e)
            print(json.dumps({"error": f"Image generation error: {e}"}))
            sys.exit(4)
        out_json = {"type": "image", "format": "png", "path": out_path}
        print(json.dumps(out_json))
    else:
        print(json.dumps({"type": "none"}))

if __name__ == "__main__":
    main()
