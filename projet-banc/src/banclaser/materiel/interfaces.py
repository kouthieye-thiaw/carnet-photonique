"""Interfaces matérielles minimales. Fourni.

Ton code (instruments/, mesures/) ne parle qu'à ces interfaces. Il existe deux
implémentations interchangeables :
  * materiel/raspberry.py      : le vrai matériel (smbus2, gpiozero…)
  * simulation/banc_simule.py  : un banc simulé, pour coder et tester sur ton PC
C'est l'« injection de dépendances » : on passe les objets au constructeur.
"""
from __future__ import annotations

from typing import Protocol


class BusI2C(Protocol):
    def ecrire(self, adresse: int, octets: bytes) -> None:
        """Écrit une suite d'octets vers le composant d'adresse `adresse`."""

    def ecrire_lire(self, adresse: int, octets: bytes, n: int) -> bytes:
        """Écrit `octets` (ex. le numéro de registre) puis lit `n` octets."""


class SortieNumerique(Protocol):
    def on(self) -> None: ...
    def off(self) -> None: ...
    @property
    def valeur(self) -> bool: ...


class EntreeNumerique(Protocol):
    @property
    def valeur(self) -> bool:
        """True si l'entrée est à l'état haut."""


class PontH(Protocol):
    def appliquer(self, commande: float) -> None:
        """commande dans [-1, 1] : signe = sens du courant, valeur = rapport cyclique."""


class Horloge(Protocol):
    def maintenant(self) -> float:
        """Temps en secondes (monotone)."""

    def dormir(self, secondes: float) -> None: ...
