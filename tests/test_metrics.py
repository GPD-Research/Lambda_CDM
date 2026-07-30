import numpy as np

from Lambda_CDM.src import metrics


def test_residuals_shape_matches_input():
    observed = np.array([2.0, 4.0, 6.0])
    predicted = np.array([1.5, 4.5, 5.0])
    residuals = metrics.calculate_residuals(observed, predicted)
    assert residuals.shape == observed.shape


def test_chi_squared_zero_for_perfect_prediction():
    observed = np.array([1.0, 2.0, 3.0])
    predicted = observed.copy()
    errors = np.array([0.1, 0.1, 0.1])
    assert np.isclose(metrics.calculate_chi_squared(observed, predicted, errors), 0.0)


def test_evaluate_model_returns_expected_keys():
    observed = np.array([1.0, 2.0, 3.0, 4.0])
    predicted = np.array([0.9, 2.1, 2.9, 4.1])
    errors = np.array([0.1, 0.2, 0.2, 0.1])
    result = metrics.evaluate_model(observed, predicted, errors, num_params=2)
    assert set(result.keys()) == {"chi_squared", "reduced_chi_squared", "aic", "bic"}
