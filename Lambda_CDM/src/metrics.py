import numpy as np


def calculate_residuals(observed, predicted):
    """Computes the raw difference between observed data and model predictions."""
    return observed - predicted

def calculate_chi_squared(observed, predicted, errors):
    """
    Computes the Chi-Squared (X^2) statistic.
    A lower value indicates a tighter fit to the observational data.
    """
    residuals = calculate_residuals(observed, predicted)
    return np.sum((residuals / errors) ** 2)

def calculate_reduced_chi_squared(chi2, num_data_points, num_params):
    """
    Computes the reduced Chi-Squared. 
    A value ~1.0 indicates a good fit where the variance matches the error variance.
    """
    degrees_of_freedom = num_data_points - num_params
    if degrees_of_freedom <= 0:
        return np.inf
    return chi2 / degrees_of_freedom

def calculate_aic(chi2, num_params):
    """
    Akaike Information Criterion (AIC).
    Useful for comparing BMI Theory vs Lambda-CDM. The model with the lower AIC 
    is generally preferred, as it balances goodness-of-fit with simplicity.
    """
    return chi2 + 2 * num_params

def calculate_bic(chi2, num_params, num_data_points):
    """
    Bayesian Information Criterion (BIC).
    Similar to AIC but applies a harsher penalty for complex models 
    with high numbers of parameters.
    """
    return chi2 + num_params * np.log(num_data_points)

def evaluate_model(observed, predicted, errors, num_params):
    """Returns a dictionary of all relevant statistical metrics for the IDE UI."""
    chi2 = calculate_chi_squared(observed, predicted, errors)
    n = len(observed)
    return {
        "chi_squared": chi2,
        "reduced_chi_squared": calculate_reduced_chi_squared(chi2, n, num_params),
        "aic": calculate_aic(chi2, num_params),
        "bic": calculate_bic(chi2, num_params, n)
    }
