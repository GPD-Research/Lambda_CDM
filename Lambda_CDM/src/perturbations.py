import numpy as np
from scipy.integrate import quad
from core import hubble_parameter, H0_DEFAULT, OMEGA_M0, OMEGA_L0

def matter_density_at_z(z, Om=OMEGA_M0, Ol=OMEGA_L0):
    """
    Calculates the evolution of the matter density parameter Omega_m(z).
    As the universe expands, dark energy dominates, altering the pull of gravity.
    """
    E_z_squared = Om * (1.0 + z)**3 + Ol
    return Om * (1.0 + z)**3 / E_z_squared

def linear_growth_rate(z, Om=OMEGA_M0, Ol=OMEGA_L0):
    """
    Calculates the dimensionless growth rate 'f'.
    In General Relativity, this is tightly approximated by Omega_m(z)^gamma,
    where gamma is the growth index (approx 0.55 for standard GR).
    This is a massive test point: if your BMI theory alters gravity, 
    it will predict a different gamma!
    """
    gamma_GR = 0.555
    Om_z = matter_density_at_z(z, Om, Ol)
    return Om_z ** gamma_GR

def growth_factor_integrand(z, Om, Ol):
    """Integrand for the linear growth factor D(z)."""
    return (1.0 + z) / (hubble_parameter(z, H0_DEFAULT, Om, 0, Ol) / H0_DEFAULT)**3

def linear_growth_factor(z, Om=OMEGA_M0, Ol=OMEGA_L0):
    """
    Calculates the normalized linear growth factor D(z).
    This tells you how much a tiny density perturbation at redshift z 
    has grown compared to today (z=0).
    """
    # Normalize to D(0) = 1
    integral_z, _ = quad(growth_factor_integrand, z, np.inf, args=(Om, Ol))
    integral_0, _ = quad(growth_factor_integrand, 0, np.inf, args=(Om, Ol))
    
    # D(z) relies on the Hubble parameter to track how expansion fights gravity
    H_z = hubble_parameter(z, H0_DEFAULT, Om, 0, Ol) / H0_DEFAULT
    H_0 = 1.0 
    
    D_z = H_z * integral_z
    D_0 = H_0 * integral_0
    
    return D_z / D_0
