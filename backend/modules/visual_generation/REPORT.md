# Visual Generation — Analysis & Report

## Overview

- Scope: Review of the `visual_generation` package that produces Mermaid diagrams and Stable Diffusion images using an LLM classifier and a unified CLI service.
- Files analyzed: `diagram/render_mermaid.py`, `diagram/INSTALL_MERMAID.md`, `image/generate_image.py`, `llm/query_llm.py`, `llm/classify_llm.py`, `service/visual_service.py`.

---

## Per-file Summaries

- `diagram/render_mermaid.py`
  - Writes Mermaid text to a temporary `.mmd` file and invokes Mermaid CLI (`mmdc`) via subprocess to render SVG/PNG. Cleans up the temp file. Looks for `MMDC_PATH` or common npm global paths.

- `diagram/INSTALL_MERMAID.md`
  - Documents installing `@mermaid-js/mermaid-cli` and Docker instructions.

- `image/generate_image.py`
  - Uses Hugging Face `diffusers` (Stable Diffusion) to generate images from a prompt. Imports heavy libs lazily, defaults to CPU, and can disable the safety checker.

- `llm/query_llm.py`
  - Wrapper for local Ollama Llama 3.1 HTTP API (`/api/generate`). Normalizes and returns text responses.

- `llm/classify_llm.py`
  - Instruction-heavy prompt to classify user input into `diagram`, `image`, or `none`. Produces either Mermaid code (with markers) or a short Stable Diffusion prompt. Contains parsing fallbacks and logs raw responses to `llm_raw_response.log`.

- `service/visual_service.py`
  - CLI orchestration: calls the LLM classifier, routes to renderer or SD generator, writes outputs in the service folder, and prints JSON metadata. Performs `sys.path` insertion to import modules.

---

## 1) Mermaid code generation: flow, challenges, and rationale

- Flow:
  1. `classify_llm.classify_and_generate()` returns `{"type":"diagram","mermaid_code": "..."}`
  2. `visual_service` calls `render_mermaid` which writes a `.mmd` file and runs `mmdc -i <in> -o <out> -e <format>` via subprocess.

- Challenges:
  - External dependency on Node/npm and a globally installed `mmdc` binary (or `MMDC_PATH`).
  - Constant temporary filename (`temp_diagram.mmd`) causes race conditions in concurrent runs.
  - No strict validation of Mermaid source; malformed code can break rendering.
  - OS-specific executable names and path heuristics are brittle.
  - No subprocess timeout or resource limits.

- Why Mermaid vs alternatives:
  - Mermaid is text-first and easy for LLMs to generate, web-friendly, and supports flow/sequence/class diagrams. Alternatives like Graphviz or PlantUML offer different layout and UML support but require different grammars and CLIs. Mermaid is a pragmatic choice for quick textual diagrams.

---

## 2) Visual image generation using diffusion models

- Implementation details:
  - `generate_image` uses `StableDiffusionPipeline.from_pretrained(...)` and runs a pipeline to create a PIL image saved to disk.
  - Lazy imports for `diffusers` and `torch` to keep import time light.
  - Defaults to CPU for compatibility; GPU use is commented and should be enabled when available.

- Challenges:
  - Hardware and memory: CPU inference is slow or impractical; GPU is strongly recommended.
  - Model availability: using a HF model id assumes network access or pre-downloaded weights and credentials; not strictly "local" unless prepared.
  - Large dependency footprint (`torch`, `diffusers`) and large model files.
  - Safety: disabling the safety checker is risky; code lacks policy or moderation flow.
  - No explicit control exposed for inference params (steps, size, guidance).

---

## 3) Category identification

- Approach:
  - `classify_llm` sends a comprehensive instruction prompt to the LLM to classify the input and return structured JSON or markers.

- Robustness & challenges:
  - The implementation includes practical parsing fallbacks (marker extraction, JSON slicing, regex), but these are brittle and may fail on unexpected LLM outputs.
  - Ambiguous user inputs can be misclassified; the prompt intentionally prefers `none` when unsure.
  - No confidence score or soft routing; a single hard classification drives downstream behavior.

---

## 4) LLM prompts

- Design:
  - A single large instruction (`PROMPT`) requests classification and structured output (JSON only). It requires Mermaid markers for diagram output and a concise SD prompt for images.

- Strengths:
  - Clear rules and examples reduce ambiguity; markers help recover Mermaid code when JSON fails.

- Weaknesses & risks:
  - LLMs often add extra commentary or produce malformed JSON. Regex fallbacks are necessary but fragile.
  - No JSON Schema or strict validation is enforced; downstream code assumes `type` exists.
  - Model-specific behavior (with Ollama/llama3.1) may require prompt tuning for stable outputs.

---

## 5) Orchestration and `visual_service`

- How it works:
  - CLI reads `user_input`, calls the classifier, inspects `type`, and calls either `render_mermaid` or `generate_image`. Results are saved to fixed filenames in the service folder and printed as JSON.

- Issues & recommendations:
  - `sys.path` manipulation is brittle; prefer running as a package or using proper imports.
  - Fixed output filenames (`generate_diagram.png`, `generated_image.png`) will collide under concurrency — use unique names (UUIDs or timestamps).
  - `timeout` parameters are present but not enforced — apply subprocess timeouts and worker isolation for heavy tasks.
  - Heavy work should run in isolated worker processes with resource/time limits to avoid blocking and OOMs.
  - Improve error messages and return structured error codes.
  - Sanitize LLM-generated code before writing to disk and running external CLIs.

---

## Concrete Recommendations (prioritized)

1. Mermaid rendering
   - Use `tempfile.NamedTemporaryFile` for unique temp files.
   - Add a subprocess timeout and capture stderr for clearer errors.
   - Validate/limit Mermaid text length and characters.

2. Image generation
   - Detect GPU and expose device selection; warn on CPU mode.
   - Expose inference params (height/width, steps, guidance) via config or args.
   - Do not disable `safety_checker` by default; require explicit opt-in.
   - Document how to run truly local (pre-download weights, HF token, or local checkpoints).

3. LLM parsing & prompts
   - Prefer structured-output features if Ollama provides them; otherwise require clear JSON delimiters (e.g., `<<<JSON_START>>>...<<<JSON_END>>>`).
   - Validate with a JSON Schema and implement a recovery flow when parsing fails (ask clarification).

4. Service robustness
   - Avoid `sys.path` hacks; make the package importable or run with `-m`.
   - Use unique output names and optionally return base64 payloads for immediate API use.
   - Run heavy tasks in worker processes with enforced timeouts and resource limits.
   - Add unit/integration tests for parsing, malformed Mermaid, and missing dependencies.

---

## Next Steps (optional implementations I can do now)

- Add safe temp file handling and subprocess timeout in `render_mermaid.py`.
- Add robust JSON delimiter extraction and validation in `classify_llm.py`.
- Change `visual_service.py` to use unique output filenames and return base64 content.

If you want one implemented now, tell me which and I will apply the change.
