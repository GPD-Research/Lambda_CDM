import json
import shutil
import subprocess
from pathlib import Path

import numpy as np
import pytest

from Lambda_CDM.src import history

COSMOS_JS = Path(__file__).resolve().parents[1] / "viewer" / "cosmos.js"
YEAR = history.YEAR_S


def test_age_of_universe_matches_planck():
    assert history.AGE_S / YEAR / 1e9 == pytest.approx(13.79, abs=0.02)


def test_recombination_near_380_thousand_years():
    assert 3.5e5 < history.time_of_redshift(1090.0) / YEAR < 3.9e5


def test_matter_radiation_equality_near_50_thousand_years():
    a_eq = history.OR / history.OM
    assert 4.5e4 < history.cosmic_time(a_eq) / YEAR < 5.5e4
    fractions = history.density_fractions(a_eq)
    assert fractions["radiation"] == pytest.approx(fractions["matter"])


def test_acceleration_begins_near_z_0_63():
    assert 1.0 / history.A_ACCELERATION - 1.0 == pytest.approx(0.632, abs=0.01)


def test_scale_factor_inverts_cosmic_time():
    for a in [1e-20, 1e-12, 1e-6, 1e-3, 0.1, 0.5, 1.0]:
        assert history.scale_factor(history.cosmic_time(a)) == pytest.approx(a, rel=1e-8)


def test_cosmic_time_inverts_scale_factor_during_inflation():
    for t in [1e-36, 1e-34, 1e-33]:
        assert history.cosmic_time(history.scale_factor(t)) == pytest.approx(t, rel=1e-8)


def test_dark_energy_era_starts_when_it_outweighs_matter():
    start = dict(history.ERA_STARTS)["dark_energy"]
    fractions = history.density_fractions(history.scale_factor(start))
    assert fractions["dark_energy"] == pytest.approx(fractions["matter"], rel=1e-6)
    assert start > history.cosmic_time(history.A_ACCELERATION)


def test_inflation_is_60_efolds_and_continuous():
    a_start = history.scale_factor(history.INFLATION_START_S)
    assert np.log(history.A_INFLATION_END / a_start) == pytest.approx(60.0)
    end = history.INFLATION_END_S
    assert history.scale_factor(end * (1 - 1e-9)) == pytest.approx(history.scale_factor(end))


def test_future_expansion_is_continuous_and_inverts():
    assert history.scale_factor(history.AGE_S * (1 + 1e-9)) == pytest.approx(1.0)
    for a in [1.001, 2.0, 10.0, 1e3, 1e6]:
        assert history.scale_factor(history.cosmic_time(a)) == pytest.approx(a, rel=1e-8)


def test_far_future_is_de_sitter():
    hubble_time_yr = 1.0 / history.H_L_PER_S / YEAR
    assert hubble_time_yr / 1e9 == pytest.approx(17.5, abs=0.1)
    ln_a = history.ln_scale_factor(history.from_now(1e100))
    assert ln_a == pytest.approx(1e100 / hubble_time_yr, rel=1e-6)
    assert history.era(history.from_now(1e101)) == "empty"


def test_temperature_today_and_at_recombination():
    assert history.temperature(1.0) == pytest.approx(2.7255)
    assert history.temperature(1.0 / 1091.0) == pytest.approx(2973.5, rel=1e-3)


def test_eras_are_in_order():
    starts = [s for _, s in history.ERA_STARTS]
    assert starts == sorted(starts)
    assert history.era(1e-34) == "inflation"
    assert history.era(history.time_of_redshift(1090.0)) == "transparent"
    assert history.era(history.AGE_S) == "dark_energy"


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_js_matches_python():
    a_values = [1e-15, 1e-9, 1e-4, 1e-3, 0.05, 0.3, 0.7, 1.0]
    t_values = [1e-35, 1e-20, 1.0, 1e4, 1e13, 1e16, 3e17, history.AGE_S, 1e18, 3e19]
    far = [history.from_now(y) for y in [1e12, 1e50, 1e100]]
    script = f"""
      const C = require({json.dumps(str(COSMOS_JS))});
      console.log(JSON.stringify({{
        age: C.AGE,
        times: {json.dumps(a_values)}.map(C.cosmicTime),
        scale: {json.dumps(t_values)}.map(C.scaleFactor),
        lnScale: {json.dumps(far)}.map(C.lnScaleFactor),
        eras: {json.dumps(t_values)}.map((t) => C.era(t).id),
        starts: C.ERAS.map((e) => [e.id, e.start]),
        events: C.EVENTS.map((e) => [e.id, e.t, e.status]),
      }}));
    """
    out = json.loads(
        subprocess.run(["node", "-e", script], capture_output=True, check=True, text=True).stdout
    )
    assert out["age"] == pytest.approx(history.AGE_S, rel=1e-6)
    assert out["times"] == pytest.approx([history.cosmic_time(a) for a in a_values], rel=1e-5)
    assert out["scale"] == pytest.approx([history.scale_factor(t) for t in t_values], rel=1e-5)
    assert out["lnScale"] == pytest.approx([history.ln_scale_factor(t) for t in far], rel=1e-6)
    assert out["eras"] == [history.era(t) for t in t_values]
    assert [e for e, _ in out["starts"]] == [e for e, _ in history.ERA_STARTS]
    assert [s for _, s in out["starts"]] == pytest.approx(
        [s for _, s in history.ERA_STARTS], rel=1e-5
    )
    times = [t for _, t, _ in out["events"]]
    assert times == sorted(times)
    assert {s for _, _, s in out["events"]} <= {
        "verified",
        "lab",
        "partial",
        "untested",
        "future",
    }
