"""Étape 8 — taux d'extinction de polarisation (PER)."""
import numpy as np
import pytest

from banclaser.analyse.polarisation import ajuster_malus, per_db


def test_per_simple():
    assert per_db(100, 1) == pytest.approx(20)
    with pytest.raises(ValueError):
        per_db(4.2, 0)


def test_ajustement_malus():
    rng = np.random.default_rng(2)
    th = np.arange(0, 360, 5.0)
    pmax, per, th0 = 4.2, 25.0, 17.0
    pmin = pmax / 10 ** (per / 10)
    p = pmin + (pmax - pmin) * np.cos(np.radians(th - th0)) ** 2 + rng.normal(0, 0.0015, th.size)
    r = ajuster_malus(th, p)
    assert r["p_max"] == pytest.approx(pmax, rel=0.01)
    assert per_db(r["p_max"], r["p_min"]) == pytest.approx(per, abs=1.0)
    assert r["angle0_deg"] == pytest.approx(th0, abs=1.0)
    assert 0 <= r["angle0_deg"] < 180
