"""Étape 9 — bruit relatif d'intensité (RIN)."""
import numpy as np
import pytest

from banclaser.analyse.bruit import raies_parasites, rin_db_par_hz, rin_moyen_db


def signal(fe=10_000, n=2 ** 16, v0=2.0, sigma=0.002, raie=0.0, graine=5):
    rng = np.random.default_rng(graine)
    t = np.arange(n) / fe
    return v0 + rng.normal(0, sigma, n) + raie * np.sin(2 * np.pi * 50 * t)


def test_rin_bruit_blanc():
    # DSP unilatérale d'un bruit blanc = 2σ²/fe → RIN = 2σ²/(fe·V0²) = 2·10⁻¹⁰ → −97 dB/Hz
    f, rin = rin_db_par_hz(signal(), 10_000, nperseg=4096)
    assert f[0] > 0
    assert rin_moyen_db(f, rin, 100, 4000) == pytest.approx(-97.0, abs=0.7)


def test_raie_50hz():
    f, rin = rin_db_par_hz(signal(raie=0.02), 10_000, nperseg=4096)
    raies = raies_parasites(f, rin, seuil_db=10)
    assert any(abs(r - 50) < 3 for r in raies)
