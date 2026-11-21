"""Étape 3 — driver de diode laser (sécurité d'abord !)."""
import pytest

from banclaser.securite import ErreurSecurite, InterlockOuvert
from conftest import faire_driver


def test_etat_initial_sur(banc):
    drv, _ = faire_driver(banc)
    assert not drv.est_actif
    assert not banc.relais.valeur
    assert banc.modele.courant_diode_ma() == 0.0


def test_conversions(banc):
    drv, _ = faire_driver(banc)
    assert drv.courant_max_materiel_ma() == pytest.approx(59.385, abs=0.01)
    assert drv.code_pour_courant(40) == 2758
    with pytest.raises(ValueError):
        drv.code_pour_courant(50)          # au-dessus de i_max_ma = 45
    with pytest.raises(ValueError):
        drv.code_pour_courant(-1)


def test_refus_si_inactif(banc):
    drv, _ = faire_driver(banc)
    with pytest.raises(ErreurSecurite):
        drv.regler_courant(10)


def test_activation_refusee_interlock_ouvert(banc):
    drv, _ = faire_driver(banc)
    banc.modele.interlock = False
    with pytest.raises(InterlockOuvert):
        drv.activer()
    assert not banc.relais.valeur and not drv.est_actif


def test_courant_et_mesures(banc):
    drv, _ = faire_driver(banc)
    drv.activer()
    assert banc.relais.valeur and drv.est_actif
    drv.regler_courant(30)
    assert drv.consigne_ma == 30
    assert banc.modele.courant_diode_ma() == pytest.approx(30, abs=0.05)
    assert drv.mesurer_courant_ma() == pytest.approx(30, abs=0.05)
    assert drv.mesurer_tension_diode() == pytest.approx(banc.modele.v_diode(banc.modele.courant_diode_ma()), abs=0.01)


def test_rampe(banc):
    drv, _ = faire_driver(banc)
    drv.activer()
    n0 = len(banc.modele.historique_dac)
    drv.regler_courant(30)
    codes = [c for (_, c) in banc.modele.historique_dac[n0:]]
    assert len(codes) >= 25, "le courant doit monter par petits pas"
    assert codes == sorted(codes), "une rampe montante ne redescend jamais"
    n1 = len(banc.modele.historique_dac)
    drv.regler_courant(31, rampe=False)
    assert len(banc.modele.historique_dac) - n1 == 1


def test_valeur_interdite_ne_change_rien(banc):
    drv, _ = faire_driver(banc)
    drv.activer()
    drv.regler_courant(20)
    code = banc.modele.code_dac
    with pytest.raises(ValueError):
        drv.regler_courant(80)
    assert banc.modele.code_dac == code


def test_interlock_pendant_la_rampe(banc):
    drv, _ = faire_driver(banc)
    drv.activer()
    m = banc.modele
    m.programmer(m.t + 0.1, lambda: setattr(m, "interlock", False))
    with pytest.raises(InterlockOuvert):
        drv.regler_courant(40)
    assert m.code_dac == 0 and not banc.relais.valeur and not drv.est_actif


def test_desactiver(banc):
    drv, _ = faire_driver(banc)
    drv.activer()
    drv.regler_courant(30)
    drv.desactiver()
    assert banc.modele.code_dac == 0 and not banc.relais.valeur and not drv.est_actif
    drv.desactiver()        # deux fois de suite : aucune exception


def test_la_diode_survit(banc):
    drv, _ = faire_driver(banc)
    drv.activer()
    drv.regler_courant(45)
    banc.horloge.dormir(5)
    assert not banc.modele.diode_detruite
    assert banc.modele.puissance_mw() > 5
