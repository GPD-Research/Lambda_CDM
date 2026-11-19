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


def main(width: int = 2048, cells: int = 900, seed: int = 7) -> None:
    rng = np.random.default_rng(seed)
    seeds = rng.normal(size=(cells, 3))
    seeds /= np.linalg.norm(seeds, axis=1, keepdims=True)
    h = width // 2
    lon = (np.arange(width) + 0.5) / width * 2 * np.pi
    lat = np.pi / 2 - (np.arange(h) + 0.5) / h * np.pi
    lon, lat = np.meshgrid(lon, lat)
    p = np.stack([np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)], -1).reshape(-1, 3)
    d = np.empty((p.shape[0], 2))
    for i in range(0, p.shape[0], 65536):
        dots = p[i : i + 65536] @ seeds.T
        top = np.partition(-dots, 1, axis=1)[:, :2]
        d[i : i + 65536] = np.sort(np.arccos(np.clip(-top, -1, 1)), axis=1)
    gap = (d[:, 1] - d[:, 0]).reshape(h, width)
    web = np.exp(-((gap / 0.012) ** 2))
    knots = np.exp(-((gap / 0.03) ** 2)) * rng.random((h, width)) ** 8
    img = np.clip(255 * (0.85 * web + 0.6 * knots), 0, 255).astype(np.uint8)
    im = Image.fromarray(img, "L").filter(ImageFilter.GaussianBlur(1.2))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=85)
    uri = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    body = json.dumps({"src": uri, "note": "Schematic: spherical Voronoi model, not survey data"})
    OUT.write_text(f"(window.SKY_ASSETS = window.SKY_ASSETS || {{}}).cosmic_web = {body};\n")
    print(f"wrote {OUT.name} ({OUT.stat().st_size / 1e3:.0f} kB)")


if __name__ == "__main__":
    main()
