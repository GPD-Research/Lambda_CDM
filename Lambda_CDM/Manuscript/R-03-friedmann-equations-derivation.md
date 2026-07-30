# Chapter R-3: Derivation of the Friedmann Equations

To move from the general tensor equations of General Relativity to the practical expansion models used in our IDE's `src/core.py`, we apply the Einstein Field Equations to a universe that is **homogeneous and isotropic** on large scales.

## The FLRW Metric

Homogeneity (the same everywhere) and isotropy (the same in all directions) force the spacetime metric into the **Friedmann-Lemaître-Robertson-Walker (FLRW)** form:

$$ds^2 = -c^2 dt^2 + a(t)^2 \left[ \frac{dr^2}{1 - kr^2} + r^2 (d\theta^2 + \sin^2\theta \, d\phi^2) \right]$$

Where:
* $a(t)$ is the dimensionless scale factor tracking the expansion of space over cosmic time $t$.
* $k$ represents the spatial curvature parameter ($k = 0$ for a flat universe, $+1$ for closed, $-1$ for open).

## Perfect Fluid Stress-Energy Tensor

On cosmic scales, galaxies and clusters blend into a smoothed "fluid" characterized by an energy density $\rho(t)$ and isotropic pressure $P(t)$. Its stress-energy tensor takes the diagonal form:

$$T^\mu_\nu = \text{diag}(-\rho c^2, P, P, P)$$

## Solving the Field Equations

When we plug the FLRW metric and the perfect fluid stress-energy tensor into the Einstein Field Equations ($G^\mu_\nu = \frac{8\pi G}{c^4} T^\mu_\nu$), the tensor equations collapse into two scalar equations—the **Friedmann Equations**:

1. **The First Friedmann Equation (Expansion Rate):**
   $$H^2 \equiv \left(\frac{\dot{a}}{a}\right)^2 = \frac{8\pi G}{3}\rho - \frac{kc^2}{a^2} + \frac{\Lambda c^2}{3}$$

2. **The Second Friedmann Equation (Acceleration):**
   $$\frac{\ddot{a}}{a} = -\frac{4\pi G}{3} \left(\rho + \frac{3P}{c^2}\right) + \frac{\Lambda c^2}{3}$$

These two equations form the mathematical engine that calculates how radiation, matter, and dark energy dictate the past, present, and future trajectory of the cosmos.
