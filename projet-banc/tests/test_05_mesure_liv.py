"""Étape 5 — séquence de mesure L-I-V sur le banc simulé."""
import pytest

from banclaser.mesures.liv import enregistrer_csv, mesurer_liv
from banclaser.securite import InterlockOuvert
from conftest import faire_driver


def test_liv_complete(banc, cfg):
    drv, adc = faire_driver(banc)
    drv.activer()
    coef = cfg["etalonnage"]["photodiode_mw_par_v"]
    r = mesurer_liv(drv, adc, cfg["adc_principal"]["canal_photodiode"], coef, 0, 40, 1.0, attente_s=0.05, horloge=banc.horloge)
    assert len(r["i_ma"]) == len(r["p_mw"]) == len(r["v_v"]) == len(r["i_consigne_ma"]) == 41
    assert r["i_ma"][-1] == pytest.approx(40, abs=0.1)
    assert r["p_mw"][10] < 0.1                      # sous le seuil
    assert r["p_mw"][-1] > 8                        # bien au-dessus
    assert drv.consigne_ma == 0 and banc.modele.courant_diode_ma() == pytest.approx(0, abs=0.05)


def test_liv_interlock(banc, cfg):
    drv, adc = faire_driver(banc)
    drv.activer()
    m = banc.modele
    m.programmer(m.t + 0.5, lambda: setattr(m, "interlock", False))
    with pytest.raises(InterlockOuvert):
        mesurer_liv(drv, adc, 0, 2.326, 0, 40, 1.0, attente_s=0.05, horloge=banc.horloge)
    assert m.code_dac == 0 and not banc.relais.valeur


def test_csv(tmp_path):
    r = {"i_consigne_ma": [0, 1], "i_ma": [0.0, 1.01], "v_v": [0.0, 1.7], "p_mw": [0.0, 0.001]}
    f = enregistrer_csv(r, tmp_path / "liv.csv", {"diode": "test", "temperature_c": 25})
    lignes = f.read_text(encoding="utf-8").strip().splitlines()
    assert lignes[0].startswith("#")
    donnees = [l for l in lignes if not l.startswith("#")]
    assert ";" in donnees[0] and len(donnees) == 3        # titres + 2 lignes
