import numpy as np

from Lambda_CDM.src import core


def test_hubble_parameter_is_positive():
    assert core.hubble_parameter(0.0) > 0.0
    assert core.hubble_parameter(2.0) > 0.0


def test_hubble_parameter_grows_with_redshift():
    z = np.array([0.0, 0.5, 1.0, 2.0])
    hz = np.array([core.hubble_parameter(v) for v in z])
    assert np.all(np.diff(hz) > 0.0)


def test_comoving_distance_zero_at_z0():
    assert np.isclose(core.comoving_distance(0.0), 0.0)


def test_luminosity_distance_exceeds_comoving_for_positive_z():
    z = 1.0
    assert core.luminosity_distance(z) > core.comoving_distance(z)
