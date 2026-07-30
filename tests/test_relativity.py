import numpy as np

from Lambda_CDM.src import core, relativity


def test_flrw_metric_signature_components():
    g = relativity.flrw_metric_components(a=1.0, k=0.0, r=1.0, theta=np.pi / 2)
    assert g.shape == (4,)
    assert g[0] < 0.0
    assert g[1] > 0.0 and g[2] > 0.0 and g[3] > 0.0


def test_distance_relations_are_consistent():
    z = 0.7
    params = {
        "H0": core.H0_DEFAULT,
        "Om": core.OMEGA_M0,
        "Or": core.OMEGA_R0,
        "Ol": core.OMEGA_L0,
    }
    d_c = relativity.comoving_distance(z, **params)
    d_l = relativity.luminosity_distance(z, **params)
    d_a = relativity.angular_diameter_distance(z, **params)
    assert np.isclose(d_l, (1.0 + z) * d_c)
    assert np.isclose(d_a, d_c / (1.0 + z))
