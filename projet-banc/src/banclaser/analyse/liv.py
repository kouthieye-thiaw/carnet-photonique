"""Exploitation d'une courbe L-I-V. — À TOI DE CODER (numpy autorisé, et encouragé)."""
from __future__ import annotations

import numpy as np  # noqa: F401


def ajuster_droite(x, y) -> tuple[float, float]:
    """Moindres carrés : renvoie (pente, ordonnée à l'origine). Moins de 2 points → ValueError."""
    raise NotImplementedError


def seuil_regression(i_ma, p_mw, frac_min: float = 0.2, frac_max: float = 0.8) -> dict:
    """Méthode « droite » : ajuste une droite sur les points dont la puissance est comprise entre
    frac_min et frac_max de la puissance maximale, puis prolonge jusqu'à P = 0.
    Renvoie {"seuil_ma": …, "pente_mw_par_ma": …, "r2": …, "n_points": …}."""
    raise NotImplementedError


def seuil_derivee_seconde(i_ma, p_mw, lissage: int = 5) -> float:
    """Méthode « dérivée seconde » : lisser P (moyenne glissante sur `lissage` points), dériver deux fois
    (numpy.gradient), renvoyer le courant où d²P/dI² est maximale."""
    raise NotImplementedError


def resistance_serie(i_ma, v_v, i_min_ma: float) -> float:
    """Résistance série (Ω) : pente de V(I) pour I ≥ i_min_ma. Attention aux unités (mA → A)."""
    raise NotImplementedError


def rendement_quantique_externe(pente_mw_par_ma: float, lambda_nm: float) -> float:
    """η_ext = pente(W/A) × λ(nm) / 1240 (sans unité). NB : 1 mW/mA = 1 W/A."""
    raise NotImplementedError
