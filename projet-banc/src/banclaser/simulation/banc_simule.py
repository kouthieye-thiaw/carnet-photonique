"""Banc de test simulé : électronique + physique de la diode + thermique. Fourni.

Il imite au niveau des OCTETS les composants réels (ADS1115, MCP4725) : ton code
de pilote sera le même sur la Raspberry Pi et dans la simulation.

Physique simulée (diode rouge 650 nm, 5 mW) :
  * seuil Ith(T) = 20 mA · exp((T − 25)/70), pente 0,65 mW/mA à 25 °C (baisse à chaud) ;
  * tension V(I) réaliste, λ(T) = 650 nm + 0,22 nm/K ;
  * driver : I = V_dac × diviseur / Rs, limité par la compliance ;
  * relais de court-circuit (NF) : fermé → la diode est court-circuitée ;
  * interlock ouvert → driver coupé ET relais refermé (comme le câblage réel) ;
  * thermique : monture τ = 30 s, Peltier ±25 °C, CTN en retard de 3 s ;
  * au-delà de 60 mA dans la diode : destruction (COD), elle n'émet plus jamais.
Le temps est VIRTUEL : il n'avance que quand on appelle horloge.dormir(dt).
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

from ..config import charger_config


@dataclass
class ParametresDiode:
    ith25_ma: float = 20.0
    t0_k: float = 70.0
    pente25_mw_par_ma: float = 0.65
    lambda25_nm: float = 650.0
    dldt_nm_par_k: float = 0.22
    v_coude: float = 1.75
    r_serie_ohm: float = 6.0
    i_destruction_ma: float = 60.0
    couplage_moniteur_v_par_mw: float = 0.2      # TIA de la photodiode moniteur
    couplage_banc_v_par_mw: float = 0.43         # 10 % prélevés × 0,43 A/W × 10 kΩ


class ModeleBanc:
    def __init__(self, cfg: dict, bruit: bool = True, graine: int = 1):
        self.cfg = cfg
        self.rng = random.Random(graine)
        self.bruit = bruit
        self.d = ParametresDiode()
        self.t = 0.0
        self.t_amb = 25.0
        self.t_monture = 25.0
        self.t_ctn = 25.0
        self.commande_tec = 0.0
        self.eeprom_dac = 0
        self.code_dac = self.eeprom_dac          # au démarrage, le MCP4725 recharge son EEPROM
        self.historique_dac: list[tuple[float, int]] = []
        self._relais_commande = False            # False = bobine non alimentée = court-circuit fermé
        self.interlock = True
        self.diode_detruite = False
        self.impulsions_chien: list[float] = []
        self._evenements: list[tuple[float, callable]] = []

    # ------------------------------------------------------------ états
    @property
    def relais_ouvert(self) -> bool:
        return self._relais_commande and self.interlock

    def programmer(self, t: float, action) -> None:
        """Programme une action (fonction sans argument) à l'instant virtuel t (s)."""
        self._evenements.append((t, action))
        self._evenements.sort(key=lambda e: e[0])

    # ------------------------------------------------------------ électricité
    def v_dac(self) -> float:
        return self.code_dac / 4096 * self.cfg["dac"]["vref"]

    def v_diode(self, i_ma: float) -> float:
        if i_ma <= 0:
            return 0.0
        d = self.d
        return d.v_coude * (1 - 0.0012 * (self.t_monture - 25)) + 0.005 * math.log(1 + i_ma / 0.002) + d.r_serie_ohm * i_ma / 1000

    def courant_driver_ma(self) -> float:
        """Courant débité par le driver (dans la diode si le relais est ouvert, sinon dans le relais)."""
        if not self.interlock:
            return 0.0
        drv = self.cfg["driver"]
        rs, vplus = drv["rs_ohm"], drv["v_plus"]
        i_voulu = self.v_dac() * drv["diviseur"] / rs * 1000
        charge = (lambda i: self.v_diode(i)) if self.relais_ouvert else (lambda i: 0.0)
        if vplus - charge(i_voulu) - i_voulu / 1000 * rs >= 0.25:
            return i_voulu
        lo, hi = 0.0, i_voulu                      # compliance insuffisante : le courant plafonne
        for _ in range(40):
            m = (lo + hi) / 2
            lo, hi = (m, hi) if vplus - charge(m) - m / 1000 * rs >= 0.25 else (lo, m)
        return lo

    def courant_diode_ma(self) -> float:
        return self.courant_driver_ma() if self.relais_ouvert else 0.0

    # ------------------------------------------------------------ optique
    def seuil_ma(self) -> float:
        return self.d.ith25_ma * math.exp((self.t_monture - 25) / self.d.t0_k)

    def puissance_mw(self) -> float:
        i = self.courant_diode_ma()
        if self.diode_detruite or i <= 0:
            return 0.0
        T, s = self.t_monture, self.seuil_ma()
        if i <= s:
            return 0.02 * i / s
        pente = self.d.pente25_mw_par_ma * (1 - 0.006 * (T - 25))
        return max(0.0, pente * (i - s) - 0.000225 * max(0.0, T - 5) * (i - s) ** 2 + 0.02)

    def longueur_onde_nm(self) -> float:
        return self.d.lambda25_nm + self.d.dldt_nm_par_k * (self.t_monture - 25) + 0.004 * self.courant_diode_ma()

    # ------------------------------------------------------------ capteurs
    def _b(self, sigma: float) -> float:
        return self.rng.gauss(0.0, sigma) if self.bruit else 0.0

    def tension_canal(self, adresse: int, canal: int) -> float:
        a1, a2 = self.cfg["adc_principal"], self.cfg["adc_secondaire"]
        if adresse == a1["adresse"]:
            if canal == a1["canal_photodiode"]:
                return self.puissance_mw() * self.d.couplage_banc_v_par_mw + 0.002 + self._b(0.0006)
            if canal == a1["canal_moniteur"]:
                return self.puissance_mw() * self.d.couplage_moniteur_v_par_mw + self._b(0.0004)
            if canal == a1["canal_shunt"]:
                return self.courant_driver_ma() / 1000 * self.cfg["driver"]["rs_ohm"] + self._b(0.00005)
            if canal == a1["canal_vdrain"]:
                vd = self.cfg["driver"]["v_plus"] - self.v_diode(self.courant_diode_ma())
                return vd / 2 + self._b(0.0003)
        if adresse == a2["adresse"]:
            c = self.cfg["ctn"]
            if canal == a2["canal_ctn"]:
                r = c["r25_ohm"] * math.exp(c["beta_k"] * (1 / (self.t_ctn + 273.15) - 1 / 298.15))
                return c["v_alim"] * r / (r + c["r_fixe_ohm"]) + self._b(0.0003)
            if canal == a2["canal_vplus"]:
                return self.cfg["driver"]["v_plus"] / 2 + self._b(0.001)
        return 0.0 + self._b(0.0005)

    # ------------------------------------------------------------ dynamique
    def avancer(self, duree: float) -> None:
        n = max(1, int(math.ceil(duree / 0.01)))
        dt = duree / n
        for _ in range(n):
            while self._evenements and self._evenements[0][0] <= self.t:
                _, action = self._evenements.pop(0)
                action()
            i = self.courant_diode_ma()
            if i > self.d.i_destruction_ma and not self.diode_detruite:
                self.diode_detruite = True
            chaleur_w = (self.v_diode(i) * i - self.puissance_mw()) / 1000
            cible = self.t_amb + 25.0 * self.commande_tec + 40.0 * chaleur_w
            self.t_monture += dt * (cible - self.t_monture) / 30.0
            self.t_ctn += dt * (self.t_monture - self.t_ctn) / 3.0
            self.t += dt

    def etat(self) -> dict:
        return {"t_s": round(self.t, 3), "dac": self.code_dac, "i_driver_ma": self.courant_driver_ma(),
                "i_diode_ma": self.courant_diode_ma(), "p_mw": self.puissance_mw(),
                "t_monture_c": self.t_monture, "lambda_nm": self.longueur_onde_nm(),
                "relais_ouvert": self.relais_ouvert, "interlock": self.interlock, "diode_detruite": self.diode_detruite}


# ---------------------------------------------------------------- composants I²C simulés
class FauxADS1115:
    PGA = {0: 6.144, 1: 4.096, 2: 2.048, 3: 1.024, 4: 0.512, 5: 0.256, 6: 0.256, 7: 0.256}
    SPS = {0: 8, 1: 16, 2: 32, 3: 64, 4: 128, 5: 250, 6: 475, 7: 860}

    def __init__(self, modele: ModeleBanc, adresse: int):
        self.m, self.adresse = modele, adresse
        self.config = 0x8583            # valeur par défaut du composant
        self.pointeur = 0
        self.valeur = 0
        self.t_fin = 0.0

    def ecrire(self, octets: bytes) -> None:
        if not octets:
            return
        self.pointeur = octets[0] & 0x03
        if self.pointeur == 0x01 and len(octets) == 3:
            cfg = (octets[1] << 8) | octets[2]
            self.config = cfg & 0x7FFF
            if cfg & 0x8000:                                  # OS = 1 : démarre une conversion
                mux = (cfg >> 12) & 0x07
                fs = self.PGA[(cfg >> 9) & 0x07]
                sps = self.SPS[(cfg >> 5) & 0x07]
                v = self.m.tension_canal(self.adresse, mux - 4) if mux >= 4 else 0.0
                self.valeur = max(-32768, min(32767, int(round(v / fs * 32768))))
                self.t_fin = self.m.t + 1.0 / sps

    def ecrire_lire(self, octets: bytes, n: int) -> bytes:
        self.ecrire(octets[:1])
        if self.pointeur == 0x00:
            v = self.valeur if self.m.t >= self.t_fin - 1e-9 else getattr(self, "_ancienne", 0)
            if self.m.t >= self.t_fin - 1e-9:
                self._ancienne = self.valeur
            return (v & 0xFFFF).to_bytes(2, "big")[:n]
        if self.pointeur == 0x01:
            os_bit = 0x8000 if self.m.t >= self.t_fin - 1e-9 else 0
            return ((self.config & 0x7FFF) | os_bit).to_bytes(2, "big")[:n]
        return bytes(n)


class FauxMCP4725:
    def __init__(self, modele: ModeleBanc, adresse: int):
        self.m, self.adresse = modele, adresse

    def _regler(self, code: int) -> None:
        self.m.code_dac = code & 0x0FFF
        self.m.historique_dac.append((self.m.t, self.m.code_dac))

    def ecrire(self, octets: bytes) -> None:
        if len(octets) == 2 and (octets[0] & 0xC0) == 0:            # « fast write »
            self._regler(((octets[0] & 0x0F) << 8) | octets[1])
        elif len(octets) == 3 and (octets[0] & 0xE0) in (0x40, 0x60):
            code = (octets[1] << 4) | (octets[2] >> 4)
            self._regler(code)
            if (octets[0] & 0xE0) == 0x60:                            # écrit aussi l'EEPROM
                self.m.eeprom_dac = code & 0x0FFF
        else:
            raise OSError(5, "trame MCP4725 non reconnue")

    def ecrire_lire(self, octets: bytes, n: int) -> bytes:
        if octets:
            self.ecrire(octets)
        c, e = self.m.code_dac, self.m.eeprom_dac
        return bytes([0xC0, c >> 4, (c & 0x0F) << 4, e >> 8, e & 0xFF])[:n]


class FauxBusI2C:
    def __init__(self, modele: ModeleBanc):
        self.m = modele
        self.composants: dict[int, object] = {}
        self.journal: list[tuple[str, int, bytes]] = []

    def ajouter(self, composant) -> None:
        self.composants[composant.adresse] = composant

    def _comp(self, adresse: int):
        if adresse not in self.composants:
            raise OSError(121, f"Remote I/O error (aucun composant à l'adresse 0x{adresse:02X})")
        return self.composants[adresse]

    def ecrire(self, adresse: int, octets: bytes) -> None:
        octets = bytes(octets)
        self.journal.append(("w", adresse, octets))
        self._comp(adresse).ecrire(octets)

    def ecrire_lire(self, adresse: int, octets: bytes, n: int) -> bytes:
        octets = bytes(octets)
        self.journal.append(("wr", adresse, octets))
        return self._comp(adresse).ecrire_lire(octets, n)


# ---------------------------------------------------------------- GPIO, pont en H, horloge
class FausseSortie:
    def __init__(self, modele: ModeleBanc, role: str):
        self.m, self.role, self._v = modele, role, False

    def on(self) -> None:
        self._v = True
        self._maj()

    def off(self) -> None:
        self._v = False
        self._maj()

    def _maj(self) -> None:
        if self.role == "relais":
            self.m._relais_commande = self._v
        elif self.role == "chien" and self._v:
            self.m.impulsions_chien.append(self.m.t)

    @property
    def valeur(self) -> bool:
        return self._v


class FausseEntree:
    def __init__(self, modele: ModeleBanc, role: str):
        self.m, self.role = modele, role

    @property
    def valeur(self) -> bool:
        return bool(self.m.interlock) if self.role == "interlock" else False


class FauxPontH:
    def __init__(self, modele: ModeleBanc, commande_max: float = 0.6):
        self.m, self.commande_max = modele, commande_max

    def appliquer(self, commande: float) -> None:
        self.m.commande_tec = max(-self.commande_max, min(self.commande_max, float(commande)))


class HorlogeSimulee:
    def __init__(self, modele: ModeleBanc):
        self.m = modele

    def maintenant(self) -> float:
        return self.m.t

    def dormir(self, secondes: float) -> None:
        if secondes > 0:
            self.m.avancer(secondes)


@dataclass
class BancSimule:
    modele: ModeleBanc
    bus: FauxBusI2C
    relais: FausseSortie
    interlock: FausseEntree
    chien: FausseSortie
    pont_h: FauxPontH
    horloge: HorlogeSimulee
    config: dict = field(default_factory=dict)


def creer_banc_simule(config: dict | None = None, bruit: bool = True, graine: int = 1) -> BancSimule:
    """Construit un banc simulé complet, prêt à être passé à tes pilotes.

    >>> banc = creer_banc_simule()
    >>> banc.modele.etat()["i_diode_ma"]
    0.0
    """
    cfg = config or charger_config()
    m = ModeleBanc(cfg, bruit=bruit, graine=graine)
    bus = FauxBusI2C(m)
    bus.ajouter(FauxADS1115(m, cfg["adc_principal"]["adresse"]))
    bus.ajouter(FauxADS1115(m, cfg["adc_secondaire"]["adresse"]))
    bus.ajouter(FauxMCP4725(m, cfg["dac"]["adresse"]))
    return BancSimule(modele=m, bus=bus, relais=FausseSortie(m, "relais"), interlock=FausseEntree(m, "interlock"),
                      chien=FausseSortie(m, "chien"), pont_h=FauxPontH(m, cfg["regulation"]["commande_max"]),
                      horloge=HorlogeSimulee(m), config=cfg)
