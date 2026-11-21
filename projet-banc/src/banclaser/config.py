"""Chargement de la configuration du banc (fichier TOML). Fourni."""
from __future__ import annotations

import tomllib
from pathlib import Path

CHEMIN_PAR_DEFAUT = Path(__file__).resolve().parents[2] / "config" / "banc.toml"


def charger_config(chemin: str | Path | None = None) -> dict:
    """Lit config/banc.toml et renvoie un dictionnaire imbriqué.

    >>> cfg = charger_config()
    >>> cfg["driver"]["rs_ohm"]
    10.0
    """
    chemin = Path(chemin) if chemin else CHEMIN_PAR_DEFAUT
    with open(chemin, "rb") as f:
        return tomllib.load(f)
