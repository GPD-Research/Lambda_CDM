# Chapter QFT-2: Gauge Symmetries and the Standard Model

The Standard Model of particle physics is mathematically formulated as a **gauge quantum field theory**. In this framework, the fundamental forces of nature (excluding gravity) are not arbitrary additions; they are rigorously derived by requiring that the physical laws remain invariant under local continuous symmetry transformations.

## The Gauge Group

The interactions between fundamental particles are dictated by the model's underlying local gauge symmetry group:

$$SU(3)_C \times SU(2)_L \times U(1)_Y$$

1. **$SU(3)_C$ (Strong Interaction):** This symmetry governs quantum chromodynamics (QCD). It operates on the color charge ($C$) of quarks and is mediated by 8 massless gauge bosons known as gluons.
2. **$SU(2)_L \times U(1)_Y$ (Electroweak Interaction):** A unified mathematical description of both the electromagnetic and weak nuclear forces. It operates on weak isospin ($L$, which only affects left-handed fermions) and weak hypercharge ($Y$).

## The Standard Model Lagrangian

The complete dynamics of these fields—how they move and how they interact—are encapsulated in the Standard Model Lagrangian density. It is broadly constructed from four distinct sectors:

$$\mathcal{L}_{\text{SM}} = \mathcal{L}_{\text{Gauge}} + \mathcal{L}_{\text{Fermion}} + \mathcal{L}_{\text{Higgs}} + \mathcal{L}_{\text{Yukawa}}$$

* **Gauge Sector ($\mathcal{L}_{\text{Gauge}}$):** Describes the kinetic energy and self-interactions of the force-carrying bosons (gluons, $W$, $Z$, and the $B$ field) using field strength tensors.
* **Fermion Sector ($\mathcal{L}_{\text{Fermion}}$):** Describes the kinematics of quarks and leptons and dictates how they interact with the gauge bosons via the covariant derivative.
* **Higgs Sector ($\mathcal{L}_{\text{Higgs}}$):** Introduces the complex scalar Higgs field $\phi$ and its specific symmetry-breaking potential $V(\phi)$.
* **Yukawa Sector ($\mathcal{L}_{\text{Yukawa}}$):** Couples the matter fermions directly to the Higgs field, which mathematically generates their rest masses.

## Electroweak Symmetry Breaking (The Higgs Mechanism)

At extremely high energies, such as the earliest epochs of the Big Bang, the electroweak symmetry $SU(2)_L \times U(1)_Y$ remains completely unbroken. In this state, the electromagnetic and weak forces are unified, and all associated gauge bosons are strictly massless.

As the universe expanded and cooled below the electroweak energy scale (approximately $159 \text{ GeV}$), the Higgs field underwent a phase transition. It acquired a non-zero vacuum expectation value (VEV), denoted as $v \approx 246 \text{ GeV}$. This caused the Higgs potential to fall into a lower-energy ground state, spontaneously breaking the overarching symmetry down to the simpler electromagnetic subgroup:

$$SU(2)_L \times U(1)_Y \xrightarrow{\text{Higgs VEV}} U(1)_{em}$$

This spontaneous symmetry breaking is the **Higgs Mechanism**. It mathematically transfers mass to the $W^\pm$ and $Z^0$ bosons (which explains why the weak nuclear force has such an extremely short range) while leaving the photon ($U(1)_{em}$) strictly massless. Simultaneously, the fermions acquire their distinct rest masses proportionally to the strength of their Yukawa couplings with the Higgs field.
