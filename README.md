# Lambda-CDM ($\Lambda\text{CDM}$)

The Standard Model of Cosmology. This package models a dynamically expanding universe governed by General Relativity, containing radiation, cold dark matter (CDM), and dark energy ($\Lambda$). 

## Overview
This module computes the background expansion history and thermodynamic evolution of the cosmos. It bridges quantum field theory (for early-universe initial conditions and particle physics) with macroscopic geometric expansion, allowing for direct comparison against high-precision astronomical datasets.

## Core Modules
* `src/core.py` - Solves the Friedmann equations for the Hubble expansion rate $H(z)$.
* `src/relativity.py` - Maps FLRW spacetime geometry to observable distances (Luminosity, Comoving, Angular).
* `src/qft.py` - Handles standard model particle masses, thermal freeze-out, and vacuum energy.
* `src/metrics.py` - Statistical evaluation engine (Chi-squared, AIC, BIC).

## Aeon Horizon: the ΛCDM model viewer

Run it online at https://gpd-research.com/Lambda_CDM/viewer/.
Open `viewer/index.html` in any browser; it needs no build or server.

* **Inflating sphere:** today's observable universe grows with the scale factor a(t), solved from the Friedmann equation with the parameters in `src/core.py`. Its surface changes with each era: white-hot radiation, plasma, the mottled CMB, the dark ages, then stars and galaxies.
* **State panel:** the current era ("Pure energy", "Quark–gluon plasma", "Transparent: CMB released", ...), the time, temperature, redshift, whether the expansion is slowing or speeding up (deceleration parameter q = Ω_r + Ω_m/2 − Ω_Λ), and the energy budget split into radiation, dark matter, ordinary matter and dark energy.
* **Timeline:** a log-time bar from 10⁻³⁶ s to today, then the ΛCDM future on the last 30%: the Andromeda merger, other galaxies leaving view, the CMB fading, the last stars, black-hole evaporation and empty de Sitter space out to 10¹¹⁰ years. The future uses log(1 + time after today / 10⁸ yr), squeezed further past 10¹⁹ years, and playback pauses at today. Each key prediction is marked verified, recreated in the lab, partly verified or not yet verified, with the evidence (COBE, WMAP, Planck, BAO, supernovae, ...).
* **Zoom-in diagrams:** from inflation to recombination, a callout from the sphere shows an animated Feynman diagram of the process that defines the era (inflaton decay, pair creation, electroweak breaking, free quarks, confinement, neutrino decoupling, nucleosynthesis, Thomson scattering, recombination), with its equation. Toggle it at the top right.
* `viewer/cosmos.js` is mirrored by `src/history.py`; `tests/test_history.py` checks they agree.
* **Real sky:** at the CMB release the sphere wears a real CMB map: COBE DMR (default), WMAP 9-year or Planck 2015, picked top right or with `#map=wmap` / `#map=planck` in the URL. Later, about 700 galaxies cut from the Hubble Ultra Deep Field appear at the cosmic time of their catalogued redshift (Rafelski et al. 2015). Each era names its image source in the state panel.
* `viewer/assets/*.js` embed those images as JPEG data URIs, so the page still works from disk. `viewer/tools/build_sky_assets.py` rebuilds them from the public archives (needs `healpy`, `astropy`, `pillow`, `scipy`). The sphere is drawn with WebGL2 (`viewer/skygl.js`) and falls back to the procedural drawing without it.
* **Cosmic web and the future:** from the first stars on, a faint schematic web of filaments and voids (a random spherical Voronoi pattern, `viewer/tools/build_cosmic_web.py`, not survey data) grows on the sphere. In the future, eight galaxies scattered over the sphere each get an event-horizon ring that shrinks as dark energy carries everything else out of reach, the same for every galaxy, not just ours. The sphere is still by default: drag it to turn it (a drag only starts on the sphere, so page scrolling still works), or tick Spin.
* **CMB acoustic peaks:** while the CMB is on the sphere, a corner chart shows the Planck 2018 temperature spectrum against the ΛCDM best fit, with what each of the first three peaks measures. `python viewer/tools/build_cmb_spectrum.py` rebuilds `viewer/assets/cmb_spectrum.js` from the Planck Legacy Archive.

## Suggested Experiments

### 1. Confirming the Model: Type Ia Supernovae
* **The Test:** Load a Supernova distance modulus dataset (e.g., Pantheon+) and plot it against the `distance_modulus` function in `relativity.py`. 
* **The Expected Result:** A universe with $\Omega_m \approx 0.3$ and $\Omega_\Lambda \approx 0.7$ will yield an exceptionally tight fit (low Chi-squared). Setting $\Omega_\Lambda = 0$ will cause the curve to drastically fail at high redshifts, confirming the necessity of Dark Energy to explain the accelerating expansion.

### 2. Confirming the Model: Baryon Acoustic Oscillations (BAO)
* **The Test:** Pass galaxy survey datasets (e.g., SDSS or DESI) through the `angular_diameter_distance` calculator. 
* **The Expected Result:** The standard ruler of ~150 Mpc imprinted in the cosmic microwave background scales perfectly with the geometric expansion predicted by the FLRW metric at lower redshifts.

### 3. Challenging the Model: The Hubble Tension
* **The Test:** Use the IDE to fit the model parameters to early-universe data (CMB power spectra) to derive $H_0$. Then, run a separate fit using late-universe data (local Cepheid variables and supernovae).
* **The Expected Result:** The early-universe fit will anchor near $67.4 \text{ km/s/Mpc}$, while the late-universe fit will anchor near $73 \text{ km/s/Mpc}$. This >4-sigma discrepancy exposes a fundamental crack in the model's predictive continuity.

### 4. Challenging the Model: The Vacuum Energy Catastrophe
* **The Test:** Execute the `qft_vacuum_energy()` function using the Planck scale cutoff, and divide it by the observed dark energy density ($\rho_\Lambda$) derived from the supernova fit.
* **The Expected Result:** The IDE will output a discrepancy ratio of approximately $10^{120}$. This highlights the absolute mathematical incompatibility between the standard model of particle physics and macroscopic general relativity.


META ANALYSIS NOTES

## IDE Control Validations and Calibration Protocol

Before deploying or testing any novel theoretical frameworks (such as BMI theory), this package serves as the baseline "control" to calibrate the IDE. The following pipeline must be executed to verify that the software stack, mathematical solvers, and AI context-injection are functioning correctly:

1. **Parser & Truth-State Verification:**
   * **The Test:** Run the IDE's automated parser on the `manuscript/` directory to generate the auto-extracted `master-axioms.md` file.
   * **Expected Outcome:** The auto-generated file must independently capture the five core pillars (Einstein Field Equations, FLRW Metric, First Friedmann Equation, Fluid Equation, and Equations of State) without hallucinating external physics or missing structural constraints.

2. **Numerical Backend Calibration:**
   * **The Test:** Feed the Pantheon+ Supernova dataset (`data/pantheon_plus_sne.csv`) and Cosmic Chronometers dataset (`data/cosmic_chronometers_hz.csv`) into the `src/` computational pipeline.
   * **Expected Outcome:** The Chi-squared ($\chi^2$) and AIC outputs must match established standard model benchmarks, proving that floating-point calculations, cosmological integrations, and metric distance conversions are accurate.

3. **Known Failure-Mode Flagging:**
   * **The Test:** Execute the QFT vacuum energy script against the observed cosmological constant.
   * **Expected Outcome:** The IDE must explicitly flag the $10^{120}$ vacuum energy discrepancy, proving the software can correctly identify orthodox theoretical frictions rather than masking them with software errors.

Once these checks pass, the IDE is officially calibrated as a reliable instrument for comparative physics modeling.
