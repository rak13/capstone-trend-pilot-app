# Graphviz Diagram Renderer

"""
Takes DOT language code as input and renders it to PNG or SVG using the graphviz Python library.
No Node.js required. Requires: pip install graphviz
Also requires the Graphviz system binary: https://graphviz.org/download/

DOT code example:
    digraph Architecture {
        rankdir=LR;
        A [label="User" shape=box style=filled fillcolor=lightblue];
        B [label="API"  shape=box style=filled fillcolor=lightyellow];
        C [label="DB"   shape=cylinder];
        A -> B [label="HTTP"];
        B -> C [label="SQL"];
    }
"""

import os
import sys

try:
    import graphviz as gv
except ImportError:
    raise ImportError("graphviz package not installed. Run: pip install graphviz")


def sanitize_dot_code(dot_code: str) -> str:
    """
    Sanitize DOT code string before rendering.
    - If the content is JSON-encoded (LLM escape sequences like \\n, \\"),
      decodes it via json.loads so that:
        \\n  -> real newline (line separator)
        \\"  -> " (quote in labels)
        \\\\n -> \\n (DOT label newline, preserved as-is)
    - Strips leading/trailing whitespace.
    - Ensures consistent line endings.
    """
    import json

    if not isinstance(dot_code, str):
        return ""
    # Detect JSON-encoded content (LLM escaped for embedding in a JSON string)
    if "\\n" in dot_code or '\\"' in dot_code:
        try:
            dot_code = json.loads(f'"{dot_code}"')
        except Exception:
            # Fallback: manually unescape the two most common sequences
            dot_code = dot_code.replace('\\"', '"').replace("\\n", "\n")
    code = dot_code.replace("\r\n", "\n").replace("\r", "\n")
    code = code.strip()
    return code


def render_graphviz(dot_code: str, output_path: str, format: str = "png") -> str:
    """
    Render DOT language code to an image file using the graphviz Python library.

    Args:
        dot_code:    Graphviz DOT code as a string (e.g. 'digraph G { A -> B }').
        output_path: Full path for the output file (e.g. '/tmp/diagram.png').
                     The extension is appended automatically by graphviz if omitted,
                     but providing it makes the intent explicit.
        format:      Output format — 'png', 'svg', or 'pdf'. Defaults to 'png'.

    Returns:
        The final file path that was written.

    Raises:
        gv.ExecutableNotFound: if Graphviz binaries are not installed.
        gv.CalledProcessError: if the DOT code is invalid.
    """
    sanitized = sanitize_dot_code(dot_code)

    out_dir = os.path.dirname(os.path.abspath(output_path)) or os.getcwd()
    os.makedirs(out_dir, exist_ok=True)

    # Strip extension from output_path — graphviz appends it automatically
    base_path = output_path
    if base_path.lower().endswith(f".{format}"):
        base_path = base_path[: -(len(format) + 1)]

    src = gv.Source(sanitized, format=format)
    rendered_path = src.render(filename=base_path, cleanup=True)

    print(f"Diagram saved to {rendered_path}")
    return rendered_path


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python render_graphviz.py <input.dot> <output.png|svg>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    fmt = output_file.rsplit(".", 1)[-1] if "." in output_file else "png"

    with open(input_file, "r", encoding="utf-8") as f:
        code = f.read()

    render_graphviz(code, output_file, format=fmt)
