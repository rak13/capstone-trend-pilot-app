# LLM Integration Script for Visual Generation Service
"""
This script takes user text, classifies it as either an architectural diagram (generates Graphviz DOT code)
or a general image, using a local Llama 3.1 (Ollama) API.

- If architectural diagram: returns {"type": "diagram", "diagram_code": ...}
- If general image: returns {"type": "image", "prompt": ...} where "prompt" is the
    finalized image-generation prompt (optimized for Stable Diffusion) that should be passed
    directly to the image generator.

Requires Ollama running locally with Llama 3.1 model available.
"""

import sys
import json
import re
from datetime import datetime
from .query_llm import send_prompt


PROMPT = """
You are a visual generation assistant that classifies user input and produces either
Graphviz DOT diagram code or an image generation prompt.

## STEP 1 — CLASSIFY
Determine whether the user input requires:
- "diagram": An architectural, flow, or system diagram
- "image": Any other visual (photo, illustration, artwork, scene, etc.)

## STEP 2A — IF DIAGRAM
Generate valid Graphviz DOT language code. Rules:
- Always use digraph (directed graph) unless the relationships are explicitly undirected
- Declare every node before referencing it in edges, or declare inline
- Keep node labels concise; use label= attribute for display names
- Use subgraph cluster_* blocks to group related components
- Set rankdir=LR for left-to-right layouts or rankdir=TB for top-to-bottom
- Use shape= to distinguish node types: box (service), ellipse (user/client), cylinder (database), diamond (decision)
- Use style=filled and fillcolor= to add colour for readability

Simple directed graph example:
digraph Architecture {
    rankdir=LR;
    Client      [shape=ellipse style=filled fillcolor=lightblue];
    LoadBalancer [label="Load Balancer" shape=box style=filled fillcolor=lightyellow];
    Server1     [label="Server 1" shape=box];
    Server2     [label="Server 2" shape=box];
    Client -> LoadBalancer [label="request"];
    LoadBalancer -> Server1;
    LoadBalancer -> Server2;
}

Grouped with clusters example:
digraph System {
    rankdir=TB;
    subgraph cluster_frontend {
        label="Frontend"; style=filled; fillcolor=aliceblue;
        Browser [shape=ellipse]; CDN [shape=box];
    }
    subgraph cluster_backend {
        label="Backend"; style=filled; fillcolor=lightyellow;
        API [shape=box]; DB [shape=cylinder];
    }
    Browser -> API [label="REST"];
    API -> DB [label="SQL"];
    Browser -> CDN;
}

## STEP 2B — IF IMAGE
Produce a single, finalized prompt optimized for Stable Diffusion:
- One scene, one subject
- Format: comma-separated phrases covering subject, setting, lighting
- Strip all narrative, emotion, and story context — describe only what is visually present
- It will be very short!
- Example: "subject1 verb1 adjective1 subject2 at location1"

## OUTPUT FORMAT
Respond with ONLY a single JSON object — no markdown, no explanation, no extra text.

For diagrams:
{
  "type": "diagram",
  "diagram_code": "<<<DIAGRAM_CODE_START>>>\n<valid DOT code here>\n<<<DIAGRAM_CODE_END>>>"
}

For images:
{
  "type": "image",
  "prompt": "<stable diffusion prompt here>"
}

## RULES
- Output must be valid, parseable JSON
- String values must escape newlines as \\n and quotes as \\"
- Do not include any text outside the JSON object
- The diagram_code value must always include the <<<DIAGRAM_CODE_START>>> and <<<DIAGRAM_CODE_END>>> markers
"""

def classify_and_generate(user_text):
    """
    Classifies the user text and generates either Graphviz DOT code or returns the image prompt.
    """

    system_prompt = (PROMPT)
    
    full_prompt = f"{system_prompt}\nUser input: {sanitize_text(user_text)}\n"
    response = send_prompt(full_prompt)
    # Log raw response for debugging to a file and print delimiters to stdout so
    # the exact LLM output can be inspected when parsing fails.
    try:
        with open("llm_raw_response.log", "a", encoding="utf-8") as f:
            f.write(f"--- {datetime.now().isoformat()} ---\n")
            f.write(response + "\n")
    except Exception as e:
        print(f"Warning: could not write llm_raw_response.log: {e}")

    # Quick marker-based extraction: if the model wrapped the DOT code in explicit markers,
    # extract that content immediately (handles cases where JSON parsing fails due to
    # unescaped newlines or non-JSON formatting).
    marker = re.search(r'<<<DIAGRAM_CODE_START>>>(.*?)<<<DIAGRAM_CODE_END>>>', response, flags=re.S)
    if marker:
        dot_text = marker.group(1).strip('\n')
        return {"type": "diagram", "diagram_code": dot_text}
    # Find the first JSON object in the response
    try:
        start = response.index('{')
        end = response.rindex('}') + 1
        json_str = response[start:end]
        try:
            result = json.loads(json_str)
            return result
        except Exception:
            # fallback: attempt to parse loosely when the LLM returns unescaped newlines
            m_type = re.search(r'"type"\s*:\s*"(diagram|image)"', json_str)
            if not m_type:
                raise
            t = m_type.group(1)
            if t == 'diagram':
                m_dot = re.search(r'"diagram_code"\s*:\s*"(.*?)"\s*(,|})', json_str, flags=re.S)
                if m_dot:
                    dot = m_dot.group(1)
                    # normalize leading/trailing whitespace
                    dot = dot.strip('\n')
                    return {"type": "diagram", "diagram_code": dot}
            elif t == 'image':
                m_prompt = re.search(r'"prompt"\s*:\s*"(.*?)"\s*(,|})', json_str, flags=re.S)
                if m_prompt:
                    prompt_text = m_prompt.group(1).strip()
                    return {"type": "image", "prompt": prompt_text}
            raise
    except Exception as e:
        print(f"Error parsing LLM response: {e}\nRaw response: {response}")
        return None

def sanitize_text(text):
  """
  Cleans the input text, keeping only pure text (removes non-printable characters and excessive whitespace).
  """
  import string
  # Remove non-printable characters
  text = ''.join(c for c in text if c in string.printable)
  # Replace all whitespace (including newlines, tabs) with a single space
  text = ' '.join(text.split())
  return text

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python classify_llm.py <user_text>")
        sys.exit(1)
    user_text = sys.argv[1]
    result = classify_and_generate(user_text)
    if result:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        sys.exit(2)
