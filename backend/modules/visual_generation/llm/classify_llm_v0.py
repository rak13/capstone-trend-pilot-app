# LLM Integration Script for Visual Generation Service
"""
This script takes user text, classifies it as either an architectural diagram (generates Mermaid code)
or a general image, using a local Llama 3.1 (Ollama) API.

- If architectural diagram: returns {"type": "diagram", "mermaid_code": ...}
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
Mermaid diagram code, an image generation prompt, or a plain text response.

## STEP 1 — CLASSIFY
Determine whether the user input requires:
- "diagram": An architectural, flow, sequence, class, or system diagram
- "image": Any other visual (photo, illustration, artwork, scene, etc.)

## STEP 2A — IF DIAGRAM
Generate valid Mermaid syntax. Rules:
- Choose the most appropriate diagram type (flowchart, sequence, class, ER, etc.)
- Keep node labels concise; avoid special characters that break Mermaid parsing
- Use subgraphs to group related components when helpful
- Validate mentally: every node referenced in edges must be declared

Supported diagram type examples:

Flowchart:
graph LR
  A[Client] -->|request| B[Load Balancer]
  B --> C[Server 1]
  B --> D[Server 2]

Sequence:
sequenceDiagram
  participant C as Client
  participant LB as Load Balancer
  C->>LB: Send request
  LB->>S: Forward request
  S-->>LB: Response
  LB-->>C: Response

Class:
classDiagram
  class LoadBalancer {
    +route(request)
  }
  class Server {
    +handle(request)
  }
  LoadBalancer --> Server

## STEP 2B — IF IMAGE
Produce a single, finalized prompt optimized for Stable Diffusion:
- One scene, one subject
- Format: comma-separated phrases covering subject, setting, lighting
- Strip all narrative, emotion, and story context — describe only what is visually present
- It will be very short!
- Example: "subject1 verb1 adjective1 subject2 at locattion1"

## OUTPUT FORMAT
Respond with ONLY a single JSON object — no markdown, no explanation, no extra text.

For diagrams:
{
  "type": "diagram",
  "mermaid_code": "<<<MERMAID_CODE_START>>>\n<valid mermaid here>\n<<<MERMAID_CODE_END>>>"
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
- The mermaid_code value must always include the <<<MERMAID_CODE_START>>> and <<<MERMAID_CODE_END>>> markers
"""

def classify_and_generate(user_text):
    """
    Classifies the user text and generates either Mermaid code or returns the image prompt.
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

    # Quick marker-based extraction: if the model wrapped the mermaid in explicit markers,
    # extract that content immediately (handles cases where JSON parsing fails due to
    # unescaped newlines or non-JSON formatting).
    marker = re.search(r'<<<MERMAID_CODE_START>>>(.*?)<<<MERMAID_CODE_END>>>', response, flags=re.S)
    if marker:
        mermaid_text = marker.group(1).strip('\n')
        return {"type": "diagram", "mermaid_code": mermaid_text}
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
                m_mermaid = re.search(r'"mermaid_code"\s*:\s*"(.*?)"\s*(,|})', json_str, flags=re.S)
                if m_mermaid:
                    mermaid = m_mermaid.group(1)
                    # normalize leading/trailing whitespace
                    mermaid = mermaid.strip('\n')
                    return {"type": "diagram", "mermaid_code": mermaid}
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
