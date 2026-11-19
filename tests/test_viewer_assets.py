import json
import re
from pathlib import Path

import pytest

VIEWER = Path(__file__).resolve().parents[1] / "viewer"
ASSETS = ["cmb_cobe", "cmb_wmap", "cmb_planck", "hudf_galaxies"]


def load(key):
    text = (VIEWER / "assets" / f"{key}.js").read_text()
    match = re.fullmatch(
        r"\(window\.SKY_ASSETS = window\.SKY_ASSETS \|\| \{\}\)\.(\w+) = (\{.*\});\n",
        text,
        re.DOTALL,
    )
    assert match and match.group(1) == key
    return json.loads(match.group(2))


@pytest.mark.parametrize("key", ASSETS)
def test_asset_is_embedded_jpeg_loaded_by_page(key):
    assert load(key)["src"].startswith("data:image/jpeg;base64,")
    assert f'<script src="assets/{key}.js"></script>' in (VIEWER / "index.html").read_text()


@pytest.mark.parametrize("key", ASSETS[:3])
def test_cmb_maps_have_colour_range(key):
    assert 30 <= load(key)["rangeMicroK"] <= 500


def test_hudf_galaxies_fit_atlas_with_redshifts():
    data = load("hudf_galaxies")
    assert data["fields"] == ["x", "y", "size", "z", "sidePx"]
    assert len(data["galaxies"]) >= 300
    for x, y, size, z, side in data["galaxies"]:
        assert 0 <= x and x + size <= data["width"] and 0 <= y and y + size <= data["height"]
        assert 0 < z < 9 and size <= side


def test_cmb_spectrum_has_lcdm_peaks_and_planck_points():
    data = load("cmb_spectrum")
    assert '<script src="assets/cmb_spectrum.js"></script>' in (VIEWER / "index.html").read_text()
    theory = data["theory"]
    peaks = [
        (l, d)
        for (l, d), (_, before), (_, after) in zip(theory[1:], theory, theory[2:])
        if d > before and d > after and l > 100
    ]
    assert [round(l, -1) for l, _ in peaks[:3]] == [220, 540, 820]
    assert 5500 < peaks[0][1] < 6000
    assert len(data["points"]) > 100 and all(lo > 0 and hi > 0 for _, _, lo, hi in data["points"])


def test_cosmic_web_is_schematic_texture_loaded_by_page():
    import base64

    web = load("cosmic_web")
    assert web["src"].startswith("data:image/jpeg;base64,")
    assert "schematic" in web["note"].lower() and "not survey data" in web["note"].lower()
    jpeg = base64.b64decode(web["src"].split(",", 1)[1])
    sof = jpeg.index(b"\xff\xc0")  # baseline frame header: length, precision, height, width
    height, width = (
        int.from_bytes(jpeg[sof + 5 : sof + 7], "big"),
        int.from_bytes(jpeg[sof + 7 : sof + 9], "big"),
    )
    assert width == 2 * height >= 1024
    assert '<script src="assets/cosmic_web.js"></script>' in (VIEWER / "index.html").read_text()
