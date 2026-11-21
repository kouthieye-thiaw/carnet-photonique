"""Pilote du convertisseur ADS1115 (16 bits, I²C). — À TOI DE CODER.

Fiche technique (l'essentiel) :
  * registres : 0x00 = conversion (16 bits signés), 0x01 = configuration ;
  * on écrit un registre en envoyant [pointeur, octet_fort, octet_faible] ;
  * on lit en écrivant [pointeur] puis en lisant 2 octets (poids fort en premier) ;
  * mot de configuration (bits 15 → 0) :
        15     OS        1 = démarrer une conversion (en lecture : 1 = conversion terminée)
        14:12  MUX       100 = AIN0/GND, 101 = AIN1/GND, 110 = AIN2/GND, 111 = AIN3/GND
        11:9   PGA       pleine échelle (voir GAMMES)
        8      MODE      1 = conversion unique (single-shot)
        7:5    DR        cadence (voir CADENCES)
        4:0    COMP      00011 = comparateur désactivé
  * exemple à retrouver : AIN0, ±4,096 V, 128 éch./s, single-shot → 0xC383.
"""
from __future__ import annotations

GAMMES = {6.144: 0b000, 4.096: 0b001, 2.048: 0b010, 1.024: 0b011, 0.512: 0b100, 0.256: 0b101}
CADENCES = {8: 0b000, 16: 0b001, 32: 0b010, 64: 0b011, 128: 0b100, 250: 0b101, 475: 0b110, 860: 0b111}
REG_CONVERSION = 0x00
REG_CONFIG = 0x01


class ADS1115:
    def __init__(self, bus, adresse: int = 0x48, gamme: float = 4.096, cadence: int = 128, horloge=None):
        """
        bus      : objet BusI2C (vrai ou simulé)
        adresse  : 0x48 à 0x4B
        gamme    : pleine échelle en volts (clé de GAMMES), sinon ValueError
        cadence  : échantillons/s (clé de CADENCES), sinon ValueError
        horloge  : objet Horloge (pour attendre la fin de conversion)
        """
        raise NotImplementedError("À toi : vérifie gamme et cadence, mémorise les paramètres.")

    def mot_config(self, canal: int) -> int:
        """Mot de configuration 16 bits pour une conversion unique sur AINcanal (0 à 3).
        canal hors de 0..3 → ValueError."""
        raise NotImplementedError("À toi : assemble les champs avec des décalages (<<) et des OU (|).")

    def lire_brut(self, canal: int) -> int:
        """Lance une conversion, attend qu'elle soit finie (≈ 1/cadence + marge), renvoie
        l'entier SIGNÉ du registre de conversion (-32768 … 32767)."""
        raise NotImplementedError("À toi : écrire la config, dormir, lire 2 octets, convertir en entier signé.")

    def lire_tension(self, canal: int) -> float:
        """Tension en volts : brut × gamme / 32768."""
        raise NotImplementedError

    def lire_moyenne(self, canal: int, n: int = 8) -> float:
        """Moyenne de n lectures (réduit le bruit d'un facteur √n)."""
        raise NotImplementedError
