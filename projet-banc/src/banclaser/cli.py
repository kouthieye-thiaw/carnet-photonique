"""Interface en ligne de commande du banc. — À COMPLÉTER (carnet, page « code 4 »).

Utilisation visée :
    banclaser --simule etat                 # état du banc simulé
    banclaser --simule liv --fin 40         # courbe L-I-V, enregistrée en CSV + PNG
    banclaser --simule temperature 25       # stabiliser la monture à 25 °C
Sur la Raspberry Pi, même commande sans --simule.

L'assemblage (fonction construire_banc) est fourni : il montre comment on « branche » tes pilotes
sur le vrai matériel ou sur la simulation. Les commandes, elles, sont à écrire.
"""
from __future__ import annotations

import argparse
from types import SimpleNamespace

from .config import charger_config


def construire_banc(simule: bool, cfg: dict | None = None) -> SimpleNamespace:
    cfg = cfg or charger_config()
    if simule:
        from .simulation import creer_banc_simule
        s = creer_banc_simule(cfg)
        bus, relais, interlock, chien, pont_h, horloge, modele = s.bus, s.relais, s.interlock, s.chien, s.pont_h, s.horloge, s.modele
    else:
        from .materiel.raspberry import BusI2CSmbus, SortieGPIO, EntreeGPIO, PontHPWM, HorlogeReelle
        g = cfg["gpio"]
        bus = BusI2CSmbus(cfg["bus_i2c"]["numero"])
        relais = SortieGPIO(g["relais_court_circuit"], initial=False)
        interlock = EntreeGPIO(g["interlock"], pull_up=False)
        chien = SortieGPIO(g["chien_de_garde"], initial=False)
        pont_h = PontHPWM(commande_max=cfg["regulation"]["commande_max"])
        horloge, modele = HorlogeReelle(), None
    from .instruments.ads1115 import ADS1115
    from .instruments.mcp4725 import MCP4725
    from .instruments.laser import DriverLaser
    from .instruments.temperature import PID, RegulateurTemperature
    a1, a2 = cfg["adc_principal"], cfg["adc_secondaire"]
    adc1 = ADS1115(bus, a1["adresse"], a1["gamme_v"], a1["cadence"], horloge)
    adc2 = ADS1115(bus, a2["adresse"], a2["gamme_v"], a2["cadence"], horloge)
    dac = MCP4725(bus, cfg["dac"]["adresse"], cfg["dac"]["vref"])
    driver = DriverLaser(dac, adc1, relais, interlock, cfg["driver"], a1, cfg["dac"]["vref"], horloge)
    r = cfg["regulation"]
    regul = RegulateurTemperature(adc2, a2["canal_ctn"], pont_h, PID(r["kp"], r["ki"], r["kd"], -r["commande_max"], r["commande_max"]), cfg["ctn"], horloge)
    return SimpleNamespace(cfg=cfg, adc1=adc1, adc2=adc2, dac=dac, driver=driver, regul=regul, chien=chien, horloge=horloge, modele=modele)


def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="banclaser", description="Banc de test de diode laser")
    p.add_argument("--simule", action="store_true", help="utiliser le banc simulé (pas de matériel)")
    sub = p.add_subparsers(dest="commande", required=True)
    sub.add_parser("etat", help="afficher températures, courant, puissance")
    pl = sub.add_parser("liv", help="mesurer la courbe L-I-V")
    pl.add_argument("--debut", type=float, default=0.0)
    pl.add_argument("--fin", type=float, default=40.0)
    pl.add_argument("--pas", type=float, default=0.5)
    pt = sub.add_parser("temperature", help="réguler la monture")
    pt.add_argument("consigne", type=float)
    args = p.parse_args(argv)
    banc = construire_banc(args.simule)
    raise NotImplementedError(f"À toi : écris la commande « {args.commande} » en utilisant `banc` "
                              "(et n'oublie pas driver.desactiver() dans un finally).")


if __name__ == "__main__":
    raise SystemExit(main())
