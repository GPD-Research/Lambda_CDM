from Lambda_CDM.src import QFT


def test_gauge_boson_mass_hierarchy():
    masses = QFT.gauge_boson_masses()
    assert masses["Photon"] == 0.0
    assert masses["W_boson"] > 0.0
    assert masses["Z_boson"] > masses["W_boson"]


def test_vacuum_energy_positive():
    assert QFT.qft_vacuum_energy() > 0.0
