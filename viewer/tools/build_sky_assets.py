"""Build the viewer's real-sky textures from public archives.

Writes viewer/assets/*.js, each holding a base64 JPEG so viewer/index.html keeps working
straight from disk (WebGL refuses file:// images but accepts data: URIs).

    pip install healpy astropy pillow scipy
    python viewer/tools/build_sky_assets.py [--cache DIR]

CMB maps are reprojected to equirectangular Galactic coordinates (north up, l = 0 in the
middle, l increasing to the left as in the usual Mollweide maps) and stored as grey levels
for -range..+range in microkelvin; the viewer applies the colour map. Galaxies are cut out
of the Hubble Ultra Deep Field at the catalogue positions of Rafelski et al. (2015) and
packed into one atlas with their redshifts.
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import re
import urllib.request
from pathlib import Path

import healpy as hp
import numpy as np
from astropy.wcs import WCS
from PIL import Image

VIEWER = Path(__file__).resolve().parents[1]
LAMBDA = "https://lambda.gsfc.nasa.gov/data"
SOURCES = {
    **{
        f"dmr_{band}_imap_4yr.fits": f"{LAMBDA}/cobe/dmr/hpx4/dmr_{band}_imap_4yr.fits"
        for band in ("53a", "53b", "90a", "90b")
    },
    "wmap_ilc_9yr_v5.fits": f"{LAMBDA}/map/dr5/dfp/ilc/wmap_ilc_9yr_v5.fits",
    "COM_CMB_IQU-smica_1024_R2.02_full.fits": "https://irsa.ipac.caltech.edu/data/Planck/"
    "release_2/all-sky-maps/maps/component-maps/cmb/COM_CMB_IQU-smica_1024_R2.02_full.fits",
    "heic0406a.jpg": "https://esahubble.org/media/archives/images/large/heic0406a.jpg",
    "uvudf_rafelski2015.tsv": "https://vizier.cfa.harvard.edu/viz-bin/asu-tsv?"
    "-source=J/AJ/150/31/table5&-out.max=unlimited&-out=RAJ2000,DEJ2000,F775W,Area,S/G,zph1,zsp,Star",
}


def fetch(cache: Path, name: str) -> Path:
    path = cache / name
    if not path.exists():
        print(f"downloading {name}")
        cache.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(SOURCES[name], path)
    return path


def jpeg_uri(img: Image.Image, quality: int) -> str:
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=quality, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def write_asset(key: str, data: dict) -> None:
    out = VIEWER / "assets" / f"{key}.js"
    out.parent.mkdir(exist_ok=True)
    body = json.dumps(data, separators=(",", ":"))
    out.write_text(f"(window.SKY_ASSETS = window.SKY_ASSETS || {{}}).{key} = {body};\n")
    print(f"wrote {out.relative_to(VIEWER.parent)} ({out.stat().st_size / 1e6:.2f} MB)")


def galactic_band(nside: int, half_width_deg: float) -> np.ndarray:
    theta, _ = hp.pix2ang(nside, np.arange(hp.nside2npix(nside)))
    return np.abs(90.0 - np.degrees(theta)) < half_width_deg


def inpaint(m: np.ndarray, bad: np.ndarray, fwhm_deg: float, iterations: int) -> np.ndarray:
    """Fill masked pixels by repeated smoothing, keeping the good pixels fixed."""
    m = m.copy()
    m[bad] = 0.0
    lmax = min(3 * hp.npix2nside(m.size) - 1, 1500)
    for _ in range(iterations):
        m[bad] = hp.smoothing(m, fwhm=np.radians(fwhm_deg), lmax=lmax)[bad]
    return m


def cmb_texture(key: str, m_uk: np.ndarray, width: int, quality: int = 88) -> None:
    m_uk = hp.remove_dipole(m_uk)
    rng = float(np.round(2.6 * np.std(m_uk), -1))
    h = width // 2
    lat = 90.0 - (np.arange(h) + 0.5) * 180.0 / h
    lon = 180.0 - (np.arange(width) + 0.5) * 360.0 / width
    lo, la = np.meshgrid(lon, lat)
    vals = hp.get_interp_val(m_uk, lo.ravel(), la.ravel(), lonlat=True).reshape(h, width)
    grey = np.clip(127.5 + 127.5 * vals / rng, 0, 255).astype(np.uint8)
    write_asset(key, {"src": jpeg_uri(Image.fromarray(grey, "L"), quality), "rangeMicroK": rng})


def build_cobe(cache: Path) -> None:
    maps = [
        hp.read_map(fetch(cache, f"dmr_{b}_imap_4yr.fits"), nest=True)
        for b in ("53a", "53b", "90a", "90b")
    ]
    m = 1e3 * hp.reorder(np.mean(maps, axis=0), n2r=True)
    band = galactic_band(32, 15.0)
    m = hp.remove_dipole(np.where(band, hp.UNSEEN, m))
    m = inpaint(m, band, 7.0, 80)
    m = hp.smoothing(m, fwhm=np.radians(5.0))
    cmb_texture("cmb_cobe", m, 512)


def build_wmap(cache: Path) -> None:
    m = 1e3 * hp.read_map(fetch(cache, "wmap_ilc_9yr_v5.fits"))
    m = hp.ud_grade(m, 256)
    cmb_texture("cmb_wmap", inpaint(m, galactic_band(256, 2.0), 1.5, 15), 2048)


def build_planck(cache: Path) -> None:
    path = fetch(cache, "COM_CMB_IQU-smica_1024_R2.02_full.fits")
    m = 1e6 * hp.read_map(path, field=0)
    good = hp.read_map(path, field=3) > 0.5
    _, mono, dip = hp.remove_dipole(np.where(good, m, hp.UNSEEN), fitval=True)
    m = m - mono - np.asarray(dip) @ np.array(hp.pix2vec(1024, np.arange(m.size)))
    # SMICA is usable across most of the Milky Way; only fill its few bright residual pixels.
    bad = ~good & (np.abs(m) > 3.0 * np.std(m[good]))
    m = inpaint(m, hp.smoothing(bad.astype(float), fwhm=np.radians(0.3)) > 0.05, 0.4, 10)
    cmb_texture("cmb_planck", m, 4096, quality=80)


def build_galaxies(cache: Path, count: int = 700, atlas_w: int = 2048, cap: int = 160) -> None:
    Image.MAX_IMAGE_PIXELS = None
    img = np.asarray(Image.open(fetch(cache, "heic0406a.jpg")).convert("RGB")).astype(np.float32)
    n = img.shape[0]
    # Image WCS from the image's AVM tags (ESA/Hubble heic0406a); ~1 px from the catalogue.
    w = WCS(naxis=2)
    w.wcs.ctype = ["RA---TAN", "DEC--TAN"]
    w.wcs.crpix = [3100, 3100]
    w.wcs.crval = [53.162124144, -27.7913917575]
    w.wcs.cdelt = [-8.34156504906e-06, 8.34156504906e-06]
    w.wcs.crota = [0, 46.54]

    rows, cols = [], None
    for line in fetch(cache, "uvudf_rafelski2015.tsv").read_text().splitlines():
        f = [c.strip() for c in re.split(r"[\t|]", line)]
        if cols is None:
            cols = {name: i for i, name in enumerate(f)} if "RAJ2000" in f else None
            continue
        if len(f) < len(cols) or not f[0][:1].isdigit() or not f[cols["F775W"]]:
            continue
        get = {k: f[i] for k, i in cols.items()}
        zsp, zph = float(get["zsp"] or 0), float(get["zph1"] or 0)
        z = zsp if zsp > 0 else zph
        if z <= 0 or float(get["S/G"]) > 0.8 or get["Star"] == "1":
            continue
        rows.append(
            (
                float(get["F775W"]),
                float(get["RAJ2000"]),
                float(get["DEJ2000"]),
                float(get["Area"]),
                z,
            )
        )
    rows.sort()

    tiles, taken = [], []
    for mag, ra, de, area, z in rows:
        x, y = w.all_world2pix([[ra, de]], 1)[0]
        cx, cy = x - 1, n - y
        side = int(np.clip(3.4 * np.sqrt(area / np.pi), 16, 520))
        if not (side / 2 < cx < n - side / 2 and side / 2 < cy < n - side / 2):
            continue
        if any(np.hypot(cx - tx, cy - ty) < 0.45 * ts for tx, ty, ts in taken):
            continue
        taken.append((cx, cy, side))
        x0, y0 = int(cx - side / 2), int(cy - side / 2)
        cut = np.clip(img[y0 : y0 + side, x0 : x0 + side] - 14.0, 0, None) * (255 / 241)
        r = np.hypot(
            *np.meshgrid(np.arange(side) - side / 2 + 0.5, np.arange(side) - side / 2 + 0.5)
        )
        win = np.clip((1 - r / (side / 2)) / 0.35, 0, 1)
        cut *= (win * win * (3 - 2 * win))[..., None]
        tile = Image.fromarray(cut.astype(np.uint8), "RGB")
        if side > cap:
            tile = tile.resize((cap, cap), Image.LANCZOS)
        tiles.append((tile, z, side))
        if len(tiles) == count:
            break

    order = sorted(range(len(tiles)), key=lambda i: -tiles[i][0].size[1])
    pad, x, y, shelf, place = 2, 0, 0, 0, {}
    for i in order:
        s = tiles[i][0].size[0]
        if x + s + pad > atlas_w:
            x, y, shelf = 0, y + shelf + pad, 0
        place[i] = (x, y)
        x, shelf = x + s + pad, max(shelf, s)
    atlas_h = y + shelf + (-(y + shelf) % 4)
    atlas = Image.new("RGB", (atlas_w, atlas_h))
    meta = []
    for i, (tile, z, side) in enumerate(tiles):
        atlas.paste(tile, place[i])
        meta.append([*place[i], tile.size[0], round(z, 3), side])
    write_asset(
        "hudf_galaxies",
        {
            "src": jpeg_uri(atlas, 88),
            "width": atlas_w,
            "height": atlas_h,
            "fields": ["x", "y", "size", "z", "sidePx"],
            "galaxies": meta,
        },
    )


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--cache", type=Path, default=Path.home() / ".cache" / "lcdm_sky")
    p.add_argument("--only", choices=["cobe", "wmap", "planck", "galaxies"], action="append")
    args = p.parse_args()
    steps = {
        "cobe": build_cobe,
        "wmap": build_wmap,
        "planck": build_planck,
        "galaxies": build_galaxies,
    }
    for name in args.only or steps:
        steps[name](args.cache)


if __name__ == "__main__":
    main()
