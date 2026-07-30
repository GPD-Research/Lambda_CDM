# 00-MASTER-AXIOMS: The Lambda-CDM Framework

In this software architecture, an "axiom" acts as an immutable global state. If a downstream function or simulation violates it, the model mathematically breaks. 

The entire $\Lambda\text{CDM}$ framework can be distilled into five irreducible mathematical pillars. Every script in the `src/` directory is logically downstream of these five equations.

## Axiom I: The Engine of Gravity (Einstein Field Equations)

The foundational premise that geometry dictates gravity, and mass-energy dictates geometry. Without this, there is no mechanism for cosmic expansion.

$$G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4} T_{\mu\nu}$$

* **The Constraint:** Space is not a static background; it is a dynamic manifold ($G_{\mu\nu}$) perfectly coupled to the stress-energy tensor ($T_{\mu\nu}$). Dark energy is explicitly hardcoded as an intrinsic geometric constant ($\Lambda$).

## Axiom II: The Cosmological Principle (The FLRW Metric)

The assumption that on the largest scales, the universe is perfectly homogeneous (the same everywhere) and isotropic (the same in all directions). 

$$ds^2 = -c^2 dt^2 + a(t)^2 \left[ \frac{dr^2}{1 - kr^2} + r^2 (d\theta^2 + \sin^2\theta \, d\phi^2) \right]$$

* **The Constraint:** Because of Axiom II, the universe only has one permitted degree of geometric freedom: it can only expand or contract globally via the scale factor $a(t)$.

## Axiom III: The Kinematics of Expansion (First Friedmann Equation)

Derived by plugging Axiom II into Axiom I. This is the master clock of the $\Lambda\text{CDM}$ universe, defining exactly how the expansion rate ($H$) changes based on what the universe is made of.

$$H^2 = \frac{8\pi G}{3}\rho - \frac{kc^2}{a^2} + \frac{\Lambda c^2}{3}$$

* **The Constraint:** The expansion rate is a strict zero-sum competition between the density of matter/radiation ($\rho$), the curvature of space ($k$), and the outward push of dark energy ($\Lambda$).

## Axiom IV: Conservation of Energy (The Fluid Equation)

The universe is a closed thermodynamic system. Energy is neither created nor destroyed, only diluted or redshifted as the volume of the universe changes.

$$\dot{\rho} + 3H \left(\rho + \frac{P}{c^2}\right) = 0$$

* **The Constraint:** As the scale factor $a(t)$ grows, the density ($\rho$) of any component in the universe must decrease at a rate strictly governed by its internal pressure ($P$).

## Axiom V: The Component Equations of State

To solve Axiom IV, $\Lambda\text{CDM}$ requires rigid definitions for the physical nature of its ingredients. This is defined by the equation of state parameter ($w$), where $P = w \rho c^2$.

* **Cold Dark Matter (CDM):** $w = 0$ (Pressureless dust; density scales as $a^{-3}$)
* **Radiation:** $w = \frac{1}{3}$ (Relativistic particles; density scales as $a^{-4}$)
* **Dark Energy ($\Lambda$):** $w = -1$ (Negative pressure; density scales as $a^0$, meaning density remains constant as volume expands).
