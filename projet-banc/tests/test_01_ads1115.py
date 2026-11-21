"""Étape 1 — pilote ADS1115."""
import pytest

from banclaser.instruments.ads1115 import ADS1115


class HorlogeMuette:
    def maintenant(self):
        return 0.0

    def dormir(self, s):
        pass


class BusFixe:
    """Faux bus qui renvoie toujours la même valeur de conversion."""
    def __init__(self, octets):
        self.octets, self.ecrits = octets, []

    def ecrire(self, adresse, octets):
        self.ecrits.append(bytes(octets))

    def ecrire_lire(self, adresse, octets, n):
        self.ecrits.append(bytes(octets))
        return self.octets if octets[0] == 0x00 else b"\x85\x83"


def test_mot_config_reference(banc):
    adc = ADS1115(banc.bus, 0x48, 4.096, 128, banc.horloge)
    assert adc.mot_config(0) == 0xC383
    assert adc.mot_config(1) == 0xD383
    assert adc.mot_config(3) == 0xF383


def test_mot_config_autre_gamme(banc):
    adc = ADS1115(banc.bus, 0x48, 2.048, 860, banc.horloge)
    assert adc.mot_config(0) == 0xC5E3


def test_parametres_invalides(banc):
    with pytest.raises(ValueError):
        ADS1115(banc.bus, 0x48, 5.0, 128, banc.horloge)
    with pytest.raises(ValueError):
        ADS1115(banc.bus, 0x48, 4.096, 100, banc.horloge)
    adc = ADS1115(banc.bus, 0x48, 4.096, 128, banc.horloge)
    with pytest.raises(ValueError):
        adc.mot_config(4)


def test_trame_de_configuration(banc):
    adc = ADS1115(banc.bus, 0x48, 4.096, 128, banc.horloge)
    adc.lire_brut(0)
    ecritures = [o for (t, a, o) in banc.bus.journal if a == 0x48 and o[0] == 0x01 and len(o) == 3]
    assert ecritures[0] == bytes([0x01, 0xC3, 0x83])


def test_entier_signe():
    adc = ADS1115(BusFixe(b"\xff\x38"), 0x48, 4.096, 128, HorlogeMuette())
    assert adc.lire_brut(0) == -200
    adc2 = ADS1115(BusFixe(b"\x7f\xff"), 0x48, 4.096, 128, HorlogeMuette())
    assert adc2.lire_brut(0) == 32767


def test_tension_reelle_attend_la_conversion(banc, cfg):
    a2 = cfg["adc_secondaire"]
    adc = ADS1115(banc.bus, a2["adresse"], 4.096, 128, banc.horloge)
    # V+ = 5 V divisé par 2 : 2,5 V. Si tu ne patientes pas, tu lis l'ancienne conversion (0 V) !
    assert adc.lire_tension(a2["canal_vplus"]) == pytest.approx(2.5, abs=0.002)


def test_moyenne(banc_bruite, cfg):
    a2 = cfg["adc_secondaire"]
    adc = ADS1115(banc_bruite.bus, a2["adresse"], 4.096, 860, banc_bruite.horloge)
    assert adc.lire_moyenne(a2["canal_vplus"], n=16) == pytest.approx(2.5, abs=0.002)
