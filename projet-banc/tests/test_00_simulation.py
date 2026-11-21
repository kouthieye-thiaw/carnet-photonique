"""Le simulateur lui-même (ces tests passent dès le départ : ils montrent comment il marche)."""
import pytest


def test_banc_demarre_eteint(banc):
    e = banc.modele.etat()
    assert e["i_diode_ma"] == 0.0 and e["dac"] == 0 and not e["relais_ouvert"]


def test_adresse_inconnue_leve_oserror(banc):
    with pytest.raises(OSError):
        banc.bus.ecrire(0x55, bytes([0x00]))


def test_relais_ferme_si_interlock_ouvert(banc):
    banc.relais.on()
    assert banc.modele.relais_ouvert
    banc.modele.interlock = False
    assert not banc.modele.relais_ouvert


def test_dac_fast_write_et_courant(banc):
    banc.bus.ecrire(0x60, bytes([0x0A, 0xC6]))        # code 2758 ≈ 40 mA
    banc.relais.on()
    assert banc.modele.code_dac == 2758
    assert banc.modele.courant_diode_ma() == pytest.approx(40.0, abs=0.05)


def test_temps_virtuel(banc):
    banc.horloge.dormir(1.5)
    assert banc.horloge.maintenant() == pytest.approx(1.5)
