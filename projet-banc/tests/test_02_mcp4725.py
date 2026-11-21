"""Étape 2 — pilote MCP4725."""
import pytest

from banclaser.instruments.mcp4725 import MCP4725


def dernieres_ecritures(banc, adresse=0x60):
    return [o for (t, a, o) in banc.bus.journal if a == adresse and t == "w"]


def test_fast_write(banc):
    dac = MCP4725(banc.bus, 0x60, 3.3)
    assert dac.dernier_code is None
    dac.ecrire_code(2758)
    assert dernieres_ecritures(banc)[-1] == bytes([0x0A, 0xC6])
    assert banc.modele.code_dac == 2758
    assert dac.dernier_code == 2758


def test_code_hors_limites_rien_envoye(banc):
    dac = MCP4725(banc.bus, 0x60, 3.3)
    n = len(banc.bus.journal)
    with pytest.raises(ValueError):
        dac.ecrire_code(4096)
    with pytest.raises(ValueError):
        dac.ecrire_code(-1)
    assert len(banc.bus.journal) == n


def test_conversions_tension(banc):
    dac = MCP4725(banc.bus, 0x60, 3.3)
    assert dac.code_pour_tension(1.65) == 2048
    assert dac.code_pour_tension(3.3) == 4095
    assert dac.code_pour_tension(0.0) == 0
    with pytest.raises(ValueError):
        dac.code_pour_tension(-0.1)
    with pytest.raises(ValueError):
        dac.code_pour_tension(3.4)
    assert dac.ecrire_tension(1.0) == 1241
    assert banc.modele.code_dac == 1241


def test_eeprom(banc):
    dac = MCP4725(banc.bus, 0x60, 3.3)
    dac.programmer_demarrage(0x123)
    assert dernieres_ecritures(banc)[-1] == bytes([0x60, 0x12, 0x30])
    assert banc.modele.eeprom_dac == 0x123
    dac.programmer_demarrage(0)
    assert banc.modele.eeprom_dac == 0
