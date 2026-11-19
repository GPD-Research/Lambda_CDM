"""Build viewer/assets/cmb_spectrum.js: the Planck 2018 CMB temperature power spectrum.

Points are the Planck 2018 TT spectrum (unbinned for l < 30, binned above) and the line is
the Planck 2018 base-LCDM best fit (plikHM TTTEEE + lowl + lowE + lensing), from the Planck
Legacy Archive mirror at NASA/IPAC IRSA. D_l = l (l + 1) C_l / 2 pi in microkelvin squared.

    python viewer/tools/build_cmb_spectrum.py [--cache DIR]
"""

from __future__ import annotations

import argparse
import json
import urllib.request
from pathlib import Path

import numpy as np

BASE = "https://irsa.ipac.caltech.edu/data/Planck/release_3/ancillary-data/cosmoparams/"
LOW = "COM_PowerSpect_CMB-TT-full_R3.01.txt"
BINNED = "COM_PowerSpect_CMB-TT-binned_R3.01.txt"
THEORY = "COM_PowerSpect_CMB-base-plikHM-TTTEEE-lowl-lowE-lensing-minimum-theory_R3.01.txt"
OUT = Path(__file__).resolve().parents[1] / "assets" / "cmb_spectrum.js"


def fetch(cache: Path, name: str) -> np.ndarray:
    path = cache / name
    if not path.exists():
        cache.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(BASE + name, path)
    return np.loadtxt(path)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", type=Path, default=Path.home() / ".cache" / "lcdm_sky")
    cache = ap.parse_args().cache
    low = fetch(cache, LOW)
    low = low[low[:, 0] < 30]
    binned = fetch(cache, BINNED)
    theory = fetch(cache, THEORY)
    theory = theory[(theory[:, 0] <= 2500) & ((theory[:, 0] < 30) | (theory[:, 0] % 5 == 0))]
    points = [
        [round(float(r[0]), 1), round(float(r[1]), 1), round(float(r[2]), 1), round(float(r[3]), 1)]
        for r in np.vstack([low[:, :4], binned[:, :4]])
    ]
    data = {
        "fields": ["l", "Dl", "minus", "plus"],
        "points": points,
        "theory": [[int(r[0]), round(float(r[1]), 1)] for r in theory],
    }
    body = json.dumps(data, separators=(",", ":"))
    OUT.write_text(f"(window.SKY_ASSETS = window.SKY_ASSETS || {{}}).cmb_spectrum = {body};\n")
    print(f"wrote {OUT.relative_to(OUT.parents[2])} ({OUT.stat().st_size / 1e3:.0f} kB)")


if __name__ == "__main__":
    main()
