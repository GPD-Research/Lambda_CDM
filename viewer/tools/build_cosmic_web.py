"""Build viewer/assets/cosmic_web.js: a schematic cosmic-web texture for the whole sphere.

Not survey data: filaments are the edges of a spherical Voronoi tessellation (voids are the
cells, clusters the vertices), which is the standard toy model of the cosmic web. Stored as an
equirectangular grey-level JPEG data URI like the CMB maps.

    python viewer/tools/build_cosmic_web.py
"""

from __future__ import annotations

import base64
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "assets" / "cosmic_web.js"


def filaments(p, cells, rng, h, width, sigma, knot):
    """Edges (and, if knot > 0, vertices) of a random spherical Voronoi tessellation."""
    seeds = rng.normal(size=(cells, 3))
    seeds /= np.linalg.norm(seeds, axis=1, keepdims=True)
    d = np.empty((p.shape[0], 3))
    for i in range(0, p.shape[0], 65536):
        top = np.partition(-(p[i : i + 65536] @ seeds.T), 2, axis=1)[:, :3]
        d[i : i + 65536] = np.sort(np.arccos(np.clip(-top, -1, 1)), axis=1)
    edge = np.exp(-(((d[:, 1] - d[:, 0]) / sigma) ** 2))
    if knot:
        # Clusters sit where three voids meet.
        edge = edge * (1 + 1.5 * np.exp(-(((d[:, 2] - d[:, 0]) / knot) ** 2)))
    return edge.reshape(h, width)


def main(width: int = 2048, cells: int = 420, seed: int = 7) -> None:
    rng = np.random.default_rng(seed)
    h = width // 2
    lon = (np.arange(width) + 0.5) / width * 2 * np.pi
    lat = np.pi / 2 - (np.arange(h) + 0.5) / h * np.pi
    lon, lat = np.meshgrid(lon, lat)
    p = np.stack([np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)], -1).reshape(-1, 3)
    # Smooth random field on the sphere: modulates filament brightness along their length, so
    # the web looks stringy rather than like a honeycomb and some voids merge into larger ones.
    lobes = rng.normal(size=(200, 3))
    lobes /= np.linalg.norm(lobes, axis=1, keepdims=True)
    amp = (np.exp(20 * (p @ lobes.T - 1)) @ rng.normal(size=200)).reshape(h, width)
    amp = np.clip(0.55 + amp / (2 * amp.std()), 0, 1)
    web = 0.9 * amp**2 * filaments(p, cells, rng, h, width, 0.006, 0.014) + 0.3 * amp * filaments(
        p, cells * 4, rng, h, width, 0.003, 0.0
    )
    img = np.clip(255 * web, 0, 255).astype(np.uint8)
    im = Image.fromarray(img, "L").filter(ImageFilter.GaussianBlur(1.2))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=85)
    uri = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    body = json.dumps({"src": uri, "note": "Schematic: spherical Voronoi model, not survey data"})
    OUT.write_text(f"(window.SKY_ASSETS = window.SKY_ASSETS || {{}}).cosmic_web = {body};\n")
    print(f"wrote {OUT.name} ({OUT.stat().st_size / 1e3:.0f} kB)")


if __name__ == "__main__":
    main()
