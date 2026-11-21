"""Pilote du convertisseur numérique-analogique MCP4725 (12 bits, I²C). — À TOI DE CODER.

Fiche technique (l'essentiel) :
  * sortie : V = code / 4096 × VDD (VDD = vref, 3,3 V ici), code de 0 à 4095 ;
  * écriture rapide (« fast write ») : 2 octets
        octet 1 = 0 0 PD1 PD0 D11 D10 D9 D8   (PD = 00 : fonctionnement normal)
        octet 2 = D7 … D0
  * écriture registre DAC + EEPROM : 3 octets
        octet 1 = 0x60, octet 2 = D11 … D4, octet 3 = D3 D2 D1 D0 0 0 0 0
    L'EEPROM est rechargée À CHAQUE MISE SOUS TENSION : pour la sécurité du laser,
    elle doit contenir 0 (programmer_demarrage(0)), une fois pour toutes.
"""
from __future__ import annotations

CODE_MAX = 4095


class MCP4725:
    def __init__(self, bus, adresse: int = 0x60, vref: float = 3.3):
        raise NotImplementedError("À toi : mémorise bus, adresse, vref ; garde le dernier code écrit (None au départ).")

    def ecrire_code(self, code: int) -> None:
        """Écriture rapide d'un code 0..4095. Hors limites → ValueError (et rien n'est envoyé)."""
        raise NotImplementedError

    def code_pour_tension(self, volts: float) -> int:
        """Code entier le plus proche pour obtenir `volts`, plafonné à 4095
        (ValueError si volts est hors de [0, vref])."""
        raise NotImplementedError

    def ecrire_tension(self, volts: float) -> int:
        """Écrit la tension demandée ; renvoie le code utilisé."""
        raise NotImplementedError

    def programmer_demarrage(self, code: int = 0) -> None:
        """Écrit le registre ET l'EEPROM (valeur reprise à la mise sous tension)."""
        raise NotImplementedError

    @property
    def dernier_code(self):
        """Dernier code écrit (None si rien n'a encore été écrit)."""
        raise NotImplementedError
