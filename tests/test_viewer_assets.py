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
