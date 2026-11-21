"""Bruit relatif d'intensité (RIN) à partir d'un enregistrement de la photodiode. — À TOI DE CODER.

RIN(f) = DSP(f) / P̄²  avec DSP unilatérale (V²/Hz) des fluctuations (signal − moyenne).
Outil conseillé : scipy.signal.welch(x, fs=fe, nperseg=…, window="hann") — il renvoie (f, DSP).
"""
from __future__ import annotations

import numpy as np  # noqa: F401


def rin_db_par_hz(signal_v, fe_hz: float, nperseg: int = 1024) -> tuple:
    """Renvoie (f, rin_db) : f en Hz (sans la composante f = 0), rin_db = 10·log10(DSP / moyenne²)."""
    raise NotImplementedError


def rin_moyen_db(f, rin_db, f_min: float, f_max: float) -> float:
    """Moyenne du RIN entre f_min et f_max, calculée sur les valeurs LINÉAIRES puis remise en dB."""
    raise NotImplementedError


def raies_parasites(f, rin_db, seuil_db: float = 10.0) -> list[float]:
    """Fréquences des raies qui dépassent de plus de seuil_db la médiane du spectre (ex. 50 Hz)."""
    raise NotImplementedError
