"""Taux d'extinction de polarisation (PER) à partir d'un polariseur tournant. — À TOI DE CODER.

Astuce : P(θ) = Pmin + (Pmax − Pmin)·cos²(θ − θ0) s'écrit aussi  A + B·cos 2θ + C·sin 2θ.
C'est LINÉAIRE en (A, B, C) : un simple numpy.linalg.lstsq suffit, pas besoin de curve_fit.
"""
from __future__ import annotations

import numpy as np  # noqa: F401


def ajuster_malus(angles_deg, puissances) -> dict:
    """Renvoie {"p_max", "p_min", "angle0_deg"} (angle0 ramené dans [0, 180[)."""
    raise NotImplementedError


def per_db(p_max: float, p_min: float) -> float:
    """10·log10(p_max/p_min). p_min ≤ 0 → ValueError (mesure à revoir : offset ?)."""
    raise NotImplementedError
