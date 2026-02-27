# Visual Generation Service — Implementation Plan

## Overview
A local service that takes user text and generates either:
- Architectural diagrams (via Mermaid code and rendering)
- General images (via Stable Diffusion)

It uses Llama 3.1 (Ollama) to classify input and generate diagram code if needed. All processing is local.

---

## Folder Structure

visual_generation/
├── llm/         # LLM interaction scripts
├── diagram/     # Mermaid code and rendering
├── image/       # Stable Diffusion scripts
├── service/     # Integration (API/CLI)

---

## Implementation Steps

### 1. Architectural Diagram Generation ([1])
- Script to render Mermaid code to SVG/PNG using Mermaid CLI.
- Test with sample Mermaid code.

### 2. Text-to-Image Generation ([2])
- Script to generate images from text using local Stable Diffusion.
- Test with sample prompts.

### 3. LLM Integration
- Script to call Llama 3.1 (Ollama) API:
  - Classify input as "architectural diagram" or "general image".
  - If architectural, generate Mermaid code.
  - If not, flag for image generation.
- Test with various prompts.

### 4. Unified Service
- Build a CLI or local web service:
  - Accept user text input.
  - Pass to LLM for classification/code.
  - Route to diagram or image script.
  - Return or save output.
- Add error handling and logging.

### 5. Documentation & Verification
- Document setup, dependencies, and usage.
- Provide example prompts and outputs.
- Test end-to-end flow.

---

## Sequence
1. Set up folder structure (done)
2. Implement and test Mermaid rendering ([1])
3. Implement and test Stable Diffusion script ([2])
4. Implement Llama 3.1 API call script
5. Integrate all components
6. Document and verify

---

## Improvements
- Modular scripts for easy maintenance
- Allow future extension (more diagram types, UI, etc.)
- Optimize LLM prompts for accuracy

---

## Verification
- Test with architecture and non-architecture prompts
- Confirm correct routing and output
- Validate all processing is local
