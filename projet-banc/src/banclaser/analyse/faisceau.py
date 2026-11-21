"""Analyse de profils de faisceau (caméra) et mesure de M² (ISO 11146). — À TOI DE CODER.

Deux pièges que les tests vont te faire découvrir :
  1. N'ÉCRÊTE PAS les valeurs négatives après soustraction du fond : le bruit doit pouvoir se
     compenser (+ et −). Si tu mets les négatifs à 0, il ne reste que le bruit positif, qui
     gonfle énormément les largeurs D4σ (les « ailes » de bruit pèsent lourd dans un moment d'ordre 2).
  2. Calcule D4σ dans une FENÊTRE autour du faisceau (norme ISO 11146 : 3 × D4σ, centrée sur le
     centroïde), et ITÈRE : centroïde + largeurs → nouvelle fenêtre → recalcul… jusqu'à stabilité.
"""
from __future__ import annotations

import numpy as np  # noqa: F401


def soustraire_fond(image, fond: float | None = None):
    """Renvoie une image float moins le fond, SANS écrêter les valeurs négatives.
    Si fond est None, l'estimer comme la médiane des pixels du bord (les 10 lignes/colonnes extérieures)."""
    raise NotImplementedError


def centroide(image) -> tuple[float, float]:
    """Barycentre (x, y) en pixels de l'intensité (x = colonne, y = ligne)."""
    raise NotImplementedError


def largeurs_d4sigma(image) -> tuple[float, float]:
    """Diamètres D4σ (4 × écart-type de la distribution d'intensité) en pixels selon x et y,
    calculés sur toute l'image fournie."""
    raise NotImplementedError


def mesurer_profil(image, facteur: float = 3.0, iterations: int = 20) -> dict:
    """Méthode ISO : en partant de toute l'image, calculer centroïde et D4σ, recadrer sur une fenêtre de
    facteur × D4σ (selon x et selon y) centrée sur le centroïde, recommencer jusqu'à ce que les largeurs
    ne bougent plus (< 0,1 %) ou `iterations` atteint. Renvoie {"cx", "cy", "dx", "dy"} en pixels,
    exprimés dans le repère de l'image COMPLÈTE (pense à rajouter le décalage de la fenêtre)."""
    raise NotImplementedError


def ajuster_caustique(z_mm, diametres_mm, lambda_nm: float) -> dict:
    """Ajuste w²(z) = a + b·z + c·z² sur les rayons w = d/2 (en mm) et renvoie
    {"w0_mm", "z0_mm", "m2", "zr_mm"} avec :
        z0 = −b/(2c), w0 = √(a − b²/(4c)), M² = (π/λ)·√(a·c − b²/4) (λ en mm !), zR = w0/θ avec θ = √c."""
    raise NotImplementedError
