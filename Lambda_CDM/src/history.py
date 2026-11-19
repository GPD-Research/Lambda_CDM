"""Cosmic timeline for the viewer: t(a), a(t), temperature, energy budget and eras.

Times are seconds after the Big Bang in flat Lambda-CDM. Below A_LOW the universe is
radiation dominated, so t = a^2 / (2 H0 sqrt(Omega_r)). Inflation is drawn as 60 e-folds
ending at 1e-32 s. After today radiation is negligible and the exact matter + Lambda solution
a^(3/2) = sqrt(Om/Ol) sinh(3/2 H_L tau) is used; far-future a overflows a float, so
ln_scale_factor is the primary function there. Mirrored in viewer/cosmos.js; tests/test_history.py compares the two.
"""

import numpy as np
from scipy.integrate import quad
from scipy.optimize import brentq

from . import core

MPC_KM = 3.085677581e19
YEAR_S = 3.15576e7
T_CMB0 = 2.7255
A_LOW = 1e-12
INFLATION_START_S = 1e-36
INFLATION_END_S = 1e-32
INFLATION_EFOLDS = 60.0

H0_PER_S = core.H0_DEFAULT / MPC_KM
OM, OR, OL = core.OMEGA_M0, core.OMEGA_R0, core.OMEGA_L0
OB = 0.0493  # Planck 2018: Omega_b h^2 = 0.0224; dark matter is OM - OB


def _t_radiation(a):
    return a * a / (2.0 * H0_PER_S * np.sqrt(OR))


H_L_PER_S = H0_PER_S * np.sqrt(OL)
_RATIO = np.sqrt(OL / OM)


def _t_matter_lambda(a):
    return 2.0 / (3.0 * H_L_PER_S) * np.arcsinh(_RATIO * a**1.5)


A_INFLATION_END = np.sqrt(2.0 * H0_PER_S * np.sqrt(OR) * INFLATION_END_S)


def cosmic_time(a):
    """Seconds after the Big Bang at which the scale factor equals a."""
    if a < A_INFLATION_END:
        efolds_left = np.log(A_INFLATION_END / a) / INFLATION_EFOLDS
        return max(0.0, INFLATION_END_S - efolds_left * (INFLATION_END_S - INFLATION_START_S))
    if a <= A_LOW:
        return _t_radiation(a)
    if a > 1.0:
        return AGE_S + _t_matter_lambda(a) - _t_matter_lambda(1.0)

    def integrand(ln_a):
        z = np.exp(-ln_a) - 1.0
        return core.H0_DEFAULT / (H0_PER_S * core.hubble_parameter(z))

    return _t_radiation(A_LOW) + quad(integrand, np.log(A_LOW), np.log(a), limit=200)[0]


def time_of_redshift(z):
    return cosmic_time(1.0 / (1.0 + z))


AGE_S = cosmic_time(1.0)
A_ACCELERATION = (OM / (2.0 * OL)) ** (1.0 / 3.0)
A_LAMBDA_EQUALITY = (OM / OL) ** (1.0 / 3.0)


def scale_factor(t):
    """Scale factor a(t), with a = 1 today."""
    if t < INFLATION_END_S:
        frac = (INFLATION_END_S - t) / (INFLATION_END_S - INFLATION_START_S)
        return A_INFLATION_END * np.exp(-INFLATION_EFOLDS * frac)
    if t <= _t_radiation(A_LOW):
        return np.sqrt(2.0 * H0_PER_S * np.sqrt(OR) * t)
    if t > AGE_S:
        return float(np.exp(ln_scale_factor(t)))
    if t == AGE_S:
        return 1.0
    ln_a = brentq(lambda x: cosmic_time(np.exp(x)) - t, np.log(A_LOW), 0.0, xtol=1e-12)
    return float(np.exp(ln_a))


def ln_scale_factor(t):
    """Natural log of a(t); finite in the far future where a itself overflows."""
    if t <= AGE_S:
        return float(np.log(scale_factor(t)))
    x = 1.5 * H_L_PER_S * (t - AGE_S + _t_matter_lambda(1.0))
    return float(2.0 / 3.0 * (x + np.log((1.0 - np.exp(-2.0 * x)) / 2.0) - np.log(_RATIO)))


def from_now(years):
    """Seconds after the Big Bang, the given number of years after today."""
    return AGE_S + years * YEAR_S


def temperature(a):
    """Photon temperature in kelvin."""
    return T_CMB0 / a


def density_fractions(a):
    """Share of the energy density in radiation, matter and dark energy."""
    r, m, lam = OR / a**4, OM / a**3, OL
    total = r + m + lam
    return {
        "radiation": r / total,
        "matter": m / total,
        "dark_matter": m * (1.0 - OB / OM) / total,
        "ordinary_matter": m * OB / OM / total,
        "dark_energy": lam / total,
    }


def deceleration(a):
    """Deceleration parameter q: positive while the expansion slows, negative while it speeds up."""
    f = density_fractions(a)
    return f["radiation"] + f["matter"] / 2.0 - f["dark_energy"]


ERA_STARTS = [
    ("inflation", INFLATION_START_S),
    ("radiation", INFLATION_END_S),
    ("quark_gluon_plasma", 1e-12),
    ("hadrons", 1e-5),
    ("leptons", 1.0),
    ("nuclei", 180.0),
    ("opaque_plasma", 1200.0),
    ("transparent", time_of_redshift(1300.0)),
    ("dark_ages", time_of_redshift(800.0)),
    ("first_stars", 1e8 * YEAR_S),
    ("galaxies", 1e9 * YEAR_S),
    ("dark_energy", cosmic_time(A_LAMBDA_EQUALITY)),
    ("alone", from_now(1.5e11)),
    ("last_stars", from_now(1e14)),
    ("black_holes", from_now(1e20)),
    ("empty", from_now(1e100)),
]


def era(t):
    """Id of the era at time t in seconds."""
    current = ERA_STARTS[0][0]
    for era_id, start in ERA_STARTS:
        if t >= start * (1.0 - 1e-12):
            current = era_id
    return current
