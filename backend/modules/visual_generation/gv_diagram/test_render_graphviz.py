"""
Quick test for render_graphviz.py
Generates a sample architecture diagram and saves it to the current directory.
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from capstone_trend_pilot.visual_generation.gv_diagram.render_graphviz import render_graphviz

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "test_output")

DOT_CODE = """
digraph SampleArchitecture {
    rankdir=LR;
    node [fontname="Helvetica" fontsize=12];

    User       [label="User"        shape=ellipse  style=filled fillcolor=lightblue];
    Frontend   [label="Frontend"    shape=box      style=filled fillcolor=lightyellow];
    API        [label="API Server"  shape=box      style=filled fillcolor=lightgreen];
    DB         [label="Database"    shape=cylinder style=filled fillcolor=lightsalmon];
    Cache      [label="Cache"       shape=box      style=filled fillcolor=plum];

    User     -> Frontend [label="browser"];
    Frontend -> API      [label="REST"];
    API      -> DB       [label="SQL"];
    API      -> Cache    [label="read/write"];
}
"""


def test_png():
    out = os.path.join(OUTPUT_DIR, "sample_architecture.png")
    render_graphviz(DOT_CODE, out, format="png")
    assert os.path.exists(out), f"PNG not created at {out}"
    print(f"PASS  PNG -> {out}")


def test_svg():
    out = os.path.join(OUTPUT_DIR, "sample_architecture.svg")
    render_graphviz(DOT_CODE, out, format="svg")
    assert os.path.exists(out), f"SVG not created at {out}"
    print(f"PASS  SVG -> {out}")


def test_sanitize():
    from capstone_trend_pilot.visual_generation.gv_diagram.render_graphviz import sanitize_dot_code

    raw = "digraph G {\\n    A -> B;\\n}"
    cleaned = sanitize_dot_code(raw)
    assert "\\n" not in cleaned, "Escaped newlines not converted"
    assert cleaned.strip() == cleaned, "Whitespace not stripped"
    print("PASS  sanitize_dot_code")


if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    test_sanitize()
    test_png()
    test_svg()

    print(f"\nAll tests passed. Output in: {OUTPUT_DIR}")
