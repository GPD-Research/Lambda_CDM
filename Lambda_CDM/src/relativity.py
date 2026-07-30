import numpy as np
from scipy.integrate import quad
from core import hubble_parameter # Assumes core.py handles the Friedmann expansion rate H(z)

# Speed of light in km/s
C_LIGHT = 299792.458 

def flrw_metric_components(a, k, r, theta):
    """
    Returns the diagonal components of the covariant FLRW metric tensor g_uv.
    Signature: (-, +, +, +)
    """
    g_00 = -C_LIGHT**2
    g_11 = (a**2) / (1.0 - k * r**2)
    g_22 = (a**2) * (r**2)
    g_33 = (a**2) * (r**2) * (np.sin(theta)**2)
    return np.array([g_00, g_11, g_22, g_33])

def comoving_distance(z, H0, Om, Or, Ol):
    """
    Integrates the FLRW metric over cosmic time to find the proper 
    comoving distance (in Mpc) to an object at redshift z.
    """
    integrand = lambda z_prime: 1.0 / hubble_parameter(z_prime, H0, Om, Or, Ol)
    integral_result, error = quad(integrand, 0, z)
    return C_LIGHT * integral_result

def luminosity_distance(z, H0, Om, Or, Ol):
    """
    Calculates the Luminosity Distance (d_L). 
    Used for testing the model against Type Ia Supernovae datasets.
    Relativistic flux dilution means d_L = (1 + z) * comoving_distance.
    """
    d_c = comoving_distance(z, H0, Om, Or, Ol)
    return (1.0 + z) * d_c

def angular_diameter_distance(z, H0, Om, Or, Ol):
    """
    Calculates the Angular Diameter Distance (d_A).
    Used for testing the model against Baryon Acoustic Oscillations (BAO) 
    and CMB power spectra.
    """
    d_c = comoving_distance(z, H0, Om, Or, Ol)
    return d_c / (1.0 + z)

def distance_modulus(z, H0, Om, Or, Ol):
    """
    Converts luminosity distance into the observable Distance Modulus (mu).
    This is the exact metric plotted against Supernova light curves.
    """
    d_L = luminosity_distance(z, H0, Om, Or, Ol)
    # d_L must be converted from Mpc to parsecs for the formula (+25 instead of -5)
    return 5.0 * np.log10(d_L) + 25.0
