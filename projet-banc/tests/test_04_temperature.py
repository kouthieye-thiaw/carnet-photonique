"""Étape 4 — CTN, PID et régulation de la monture."""
import pytest

from banclaser.instruments.ads1115 import ADS1115
from banclaser.instruments.temperature import PID, RegulateurTemperature, ctn_resistance, ctn_vers_celsius


def test_ctn_resistance():
    assert ctn_resistance(1.65) == pytest.approx(10_000, rel=1e-9)
    with pytest.raises(ValueError):
        ctn_resistance(0.0)
    with pytest.raises(ValueError):
        ctn_resistance(3.3)


def test_ctn_celsius():
    assert ctn_vers_celsius(10_000) == pytest.approx(25.0, abs=1e-9)
    assert ctn_vers_celsius(5301) == pytest.approx(40.0, abs=0.05)
    assert ctn_vers_celsius(20_000) < 25


def test_pid_proportionnel():
    pid = PID(0.5, 0, 0)
    assert pid.calculer(26, 25, 0.1) == pytest.approx(0.5)
    assert PID(2, 0, 0).calculer(26, 25, 0.1) == pytest.approx(1.0)       # borné


def test_pid_integral():
    pid = PID(0, 0.1, 0)
    assert pid.calculer(26, 25, 1.0) == pytest.approx(0.1)
    assert pid.calculer(26, 25, 1.0) == pytest.approx(0.2)
    pid.reinitialiser()
    assert pid.calculer(26, 25, 1.0) == pytest.approx(0.1)


def test_pid_anti_windup():
    pid = PID(10, 1, 0)
    for _ in range(100):
        pid.calculer(26, 25, 1.0)             # erreur +1 pendant 100 s, sortie saturée à 1
    u = pid.calculer(25, 25.05, 1.0)          # légère erreur négative
    assert u < 0.9, "l'intégrale ne doit pas avoir grossi pendant la saturation"


def test_pid_derivee_sur_la_mesure():
    pid = PID(0, 0, 0.5)
    assert pid.calculer(25, 20, 1.0) == pytest.approx(0.0)    # premier appel : pas de dérivée
    assert pid.calculer(40, 20, 1.0) == pytest.approx(0.0)    # la consigne saute : aucun « coup de pied »
    assert pid.calculer(40, 21, 1.0) == pytest.approx(-0.5)   # la mesure monte : D freine


def test_regulation_simulee(banc_bruite, cfg):
    a2, r = cfg["adc_secondaire"], cfg["regulation"]
    adc = ADS1115(banc_bruite.bus, a2["adresse"], 4.096, 128, banc_bruite.horloge)
    pid = PID(r["kp"], r["ki"], r["kd"], -r["commande_max"], r["commande_max"])
    reg = RegulateurTemperature(adc, a2["canal_ctn"], banc_bruite.pont_h, pid, cfg["ctn"], banc_bruite.horloge)
    assert reg.lire_temperature() == pytest.approx(25.0, abs=0.1)
    assert reg.stabiliser(20.0, tolerance=0.1, duree_stable=10, timeout=400, dt=0.2)
    assert banc_bruite.modele.t_monture == pytest.approx(20.0, abs=0.2)
    reg.arreter()
    assert banc_bruite.modele.commande_tec == 0
