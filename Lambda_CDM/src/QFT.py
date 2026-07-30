import numpy as np

# Standard Model Constants (Energy in GeV)
HIGGS_VEV = 246.22      # Vacuum Expectation Value of the Higgs field in GeV
PLANCK_MASS = 1.22e19   # Planck mass in GeV (Standard QFT integration cutoff)
E_CHARGE = 0.302822     # Elementary charge (natural units)
WEINBERG_ANGLE = 0.499  # Weak mixing angle (radians)

def fermion_mass(yukawa_coupling):
    """
    Calculates the rest mass of a fermion (quark or lepton) based on 
    its Yukawa coupling to the Higgs field.
    Mathematically: m = y * (v / sqrt(2))
    """
    return yukawa_coupling * (HIGGS_VEV / np.sqrt(2.0))

def electroweak_couplings(theta_w=WEINBERG_ANGLE):
    """
    Calculates the SU(2)_L (g) and U(1)_Y (g') gauge couplings 
    from the weak mixing angle.
    """
    g = E_CHARGE / np.sin(theta_w)
    g_prime = E_CHARGE / np.cos(theta_w)
    return g, g_prime

def gauge_boson_masses():
    """
    Derives the masses of the W and Z gauge bosons from the Higgs VEV 
    and the electroweak gauge couplings resulting from symmetry breaking.
    """
    g, g_prime = electroweak_couplings()
    
    m_w = 0.5 * g * HIGGS_VEV
    m_z = 0.5 * np.sqrt(g**2 + g_prime**2) * HIGGS_VEV
    m_photon = 0.0  # U(1)_em remains unbroken
    
    return {"W_boson": m_w, "Z_boson": m_z, "Photon": m_photon}

def qft_vacuum_energy(cutoff_scale=PLANCK_MASS):
    """
    Computes the theoretical QFT vacuum energy density up to a given cutoff scale.
    This explicit calculation will yield ~10^74 GeV^4, allowing your IDE to 
    demonstrate the Cosmological Constant Problem when compared to observed Lambda.
    """
    # rho_vac = (k_max^4) / (8 * pi^2)
    return (cutoff_scale**4) / (8.0 * np.pi**2)

def relativistic_degrees_of_freedom(temperature_gev):
    """
    Approximates the effective number of relativistic degrees of freedom g*(T)
    at a given thermal energy (Temperature in GeV) in the early universe.
    This function feeds directly into your expansion rate equations in core.py 
    for the early radiation-dominated era.
    """
    if temperature_gev >= 175.0:
        # Pre-electroweak symmetry breaking (All SM particles active)
        return 106.75
    elif temperature_gev >= 0.15:
        # Post-QCD phase transition (Quarks and gluons bound into hadrons)
        return 61.75
    elif temperature_gev >= 0.001:
        # ~1 MeV scale: Electrons, positrons, photons, and neutrinos
        return 10.75
    else:
        # Today: Only photons and decoupled neutrinos remain relativistic
        return 3.36
