"""Étape 6 — exploitation d'une courbe L-I-V (données synthétiques)."""
import numpy as np
import pytest

from banclaser.analyse.liv import (ajuster_droite, rendement_quantique_externe, resistance_serie,
                                   seuil_derivee_seconde, seuil_regression)


@pytest.fixture
def courbe():
    rng = np.random.default_rng(0)
    i = np.arange(0, 60.01, 0.5)
    p = np.where(i > 25, 0.8 * (i - 25), 0.02 * i / 25) + rng.normal(0, 0.02, i.size)
    return i, p


def test_droite():
    a, b = ajuster_droite([0, 1, 2], [1, 3, 5])
    assert a == pytest.approx(2) and b == pytest.approx(1)
    with pytest.raises(ValueError):
        ajuster_droite([1], [1])


def test_seuil_regression(courbe):
    r = seuil_regression(*courbe)
    assert r["seuil_ma"] == pytest.approx(25, abs=0.4)
    assert r["pente_mw_par_ma"] == pytest.approx(0.8, rel=0.025)
    assert r["r2"] > 0.999 and r["n_points"] > 10


def test_seuil_derivee_seconde(courbe):
    assert seuil_derivee_seconde(*courbe) == pytest.approx(25, abs=1.0)


def test_resistance_serie():
    i = np.arange(0.5, 50, 0.5)
    v = 1.75 + 0.005 * np.log(1 + i / 0.002) + 6.0 * i / 1000
    # dV/dI = 6 Ω + une petite contribution de la jonction (≈ 5 mV / I) : ≈ 6,15 Ω entre 20 et 50 mA
    assert resistance_serie(i, v, i_min_ma=20) == pytest.approx(6.15, abs=0.3)


def test_rendement_quantique():
    assert rendement_quantique_externe(0.6, 650) == pytest.approx(0.3145, abs=0.001)
