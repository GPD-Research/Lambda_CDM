import numpy as np
from scipy.integrate import quad

# Default Planck 2018 Cosmological Parameters
H0_DEFAULT = 67.4       # km/s/Mpc
OMEGA_M0 = 0.315        # Matter density parameter (CDM + Baryons)
OMEGA_R0 = 9.2e-5       # Radiation density parameter
OMEGA_L0 = 1.0 - OMEGA_M0 - OMEGA_R0  # Dark energy density parameter (Flat universe assumption)
C_LIGHT = 299792.458    # Speed of light in km/s

def hubble_parameter(z, H0=H0_DEFAULT, Om=OMEGA_M0, Or=OMEGA_R0, Ol=OMEGA_L0):
    """
    Computes the Hubble expansion rate H(z) for a flat Lambda-CDM universe.
    """
    # E(z)^2 = Or*(1+z)^4 + Om*(1+z)^3 + Ol
    e_z_squared = Or * (1.0 + z)**4 + Om * (1.0 + z)**3 + Ol
    return H0 * np.sqrt(e_z_squared)

def comoving_distance(z_target, H0=H0_DEFAULT, Om=OMEGA_M0, Or=OMEGA_R0, Ol=OMEGA_L0):
    """
    Computes the line-of-sight comoving distance to redshift z_target in Mpc.
    """
    integrand = lambda z: 1.0 / hubble_parameter(z, H0, Om, Or, Ol)
    integral, _ = quad(integrand, 0, z_target)
    return C_LIGHT * integral

def luminosity_distance(z_target, H0=H0_DEFAULT, Om=OMEGA_M0, Or=OMEGA_R0, Ol=OMEGA_L0):
    """
    Computes the luminosity distance d_L in Mpc for comparison with supernova data.
    """
    d_c = comoving_distance(z_target, H0, Om, Or, Ol)
    return (1.0 + z_target) * d_c

def calculate_chi_squared(z_data, observed_values, error_values, model_func, **kwargs):
    """
    Evaluates goodness-of-fit against dataset X using analysis pipeline Y.
    """
    predictions = np.array([model_func(z, **kwargs) for z in z_data])
    residuals = (observed_values - predictions) / error_values
    chi2 = np.sum(residuals**2)
    return chi2
