"""Fixtures communes : un banc simulé neuf pour chaque test."""
import pytest

from banclaser.config import charger_config
from banclaser.simulation import creer_banc_simule


@pytest.fixture
def cfg():
    return charger_config()


@pytest.fixture
def banc(cfg):
    """Banc simulé SANS bruit (résultats exacts)."""
    return creer_banc_simule(cfg, bruit=False)


@pytest.fixture
def banc_bruite(cfg):
    """Banc simulé AVEC bruit de mesure."""
    return creer_banc_simule(cfg, bruit=True, graine=4)


def faire_driver(banc):
    """Assemble ADC + DAC + driver comme dans cli.construire_banc."""
    from banclaser.instruments.ads1115 import ADS1115
    from banclaser.instruments.mcp4725 import MCP4725
    from banclaser.instruments.laser import DriverLaser
    cfg = banc.config
    a1 = cfg["adc_principal"]
    adc = ADS1115(banc.bus, a1["adresse"], a1["gamme_v"], a1["cadence"], banc.horloge)
    dac = MCP4725(banc.bus, cfg["dac"]["adresse"], cfg["dac"]["vref"])
    return DriverLaser(dac, adc, banc.relais, banc.interlock, cfg["driver"], a1, cfg["dac"]["vref"], banc.horloge), adc
