"""Mesure (CTN) et régulation (PID + pont en H) de la température. — À TOI DE CODER.

Carnet : physique/thermique (CTN, pont diviseur) et electronique/tec-pid (PID numérique).
Montage du pont : V_alim — R_fixe — (point milieu → ADC) — CTN — masse.
"""
from __future__ import annotations

from ..securite import TemperatureHorsFenetre  # noqa: F401


def ctn_resistance(v_mesure: float, v_alim: float = 3.3, r_fixe: float = 10_000.0) -> float:
    """Résistance de la CTN (Ω) à partir de la tension du point milieu.
    Tension hors de ]0, v_alim[ → ValueError (capteur débranché ou en court-circuit !)."""
    raise NotImplementedError


def ctn_vers_celsius(r_ohm: float, r25: float = 10_000.0, beta: float = 3950.0) -> float:
    """Modèle β : 1/T = 1/298,15 + ln(R/R25)/β  (T en kelvins), renvoie des °C."""
    raise NotImplementedError


class PID:
    """Régulateur PID numérique.
    * dérivée calculée sur la MESURE (pas sur l'erreur) : pas de « coup de pied » au changement de consigne ;
      au tout premier appel, il n'y a pas de mesure précédente : D = 0 ;
    * anti-windup : on n'intègre pas quand la sortie est saturée ET que l'erreur pousse dans le même sens ;
    * sortie bornée à [sortie_min, sortie_max]."""

    def __init__(self, kp: float, ki: float, kd: float, sortie_min: float = -1.0, sortie_max: float = 1.0):
        raise NotImplementedError

    def reinitialiser(self) -> None:
        """Remet l'intégrale à 0 et oublie la mesure précédente."""
        raise NotImplementedError

    def calculer(self, consigne: float, mesure: float, dt: float) -> float:
        """Renvoie la commande bornée."""
        raise NotImplementedError


class RegulateurTemperature:
    def __init__(self, adc, canal: int, pont_h, pid: PID, cfg_ctn: dict, horloge):
        raise NotImplementedError

    def lire_temperature(self) -> float:
        """Lit l'ADC, convertit en résistance puis en °C."""
        raise NotImplementedError

    def pas(self, consigne: float, dt: float) -> tuple[float, float]:
        """Une itération : mesure, calcul PID, application au pont en H. Renvoie (température, commande)."""
        raise NotImplementedError

    def stabiliser(self, consigne: float, tolerance: float = 0.1, duree_stable: float = 10.0,
                   timeout: float = 300.0, dt: float = 0.2) -> bool:
        """Boucle (pas + horloge.dormir(dt)) jusqu'à ce que |T − consigne| ≤ tolerance pendant
        duree_stable secondes d'affilée → True. Si le timeout est atteint → False."""
        raise NotImplementedError

    def arreter(self) -> None:
        """Commande du pont à 0."""
        raise NotImplementedError
