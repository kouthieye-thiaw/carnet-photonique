"""Pilote du driver de diode laser (DAC → source de courant). — À TOI DE CODER.

Rappels (carnet, module 05) :
  * I = V_set / Rs, avec V_set = V_dac × diviseur ;
  * le relais de court-circuit est NORMALEMENT FERMÉ : relais.on() l'ouvre (laser autorisé),
    relais.off() le referme (diode court-circuitée = état sûr) ;
  * interlock.valeur == True  ⇔  boucle d'interlock fermée (sûr). Si elle s'ouvre, le matériel
    coupe déjà tout ; le logiciel doit le détecter, remettre la consigne à 0 et lever InterlockOuvert ;
  * on ne change JAMAIS le courant d'un coup : rampe par pas de cfg["pas_rampe_ma"],
    avec horloge.dormir(cfg["delai_rampe_s"]) entre deux pas.

`cfg` est la section [driver] de config/banc.toml, complétée par :
    cfg_adc = section [adc_principal] (canaux), vref = section [dac]["vref"].
"""
from __future__ import annotations

from ..securite import ErreurSecurite, InterlockOuvert  # noqa: F401  (tu en auras besoin)


class DriverLaser:
    def __init__(self, dac, adc, relais, interlock, cfg: dict, cfg_adc: dict, vref: float, horloge):
        """Ne touche pas au matériel ici : le laser doit rester éteint (relais fermé)."""
        raise NotImplementedError("À toi : mémorise tout ; état initial : inactif, consigne 0 mA.")

    # -- conversions -------------------------------------------------------------------
    def courant_max_materiel_ma(self) -> float:
        """Courant obtenu avec le code DAC maximal (4095) : la limite imposée par le diviseur."""
        raise NotImplementedError

    def code_pour_courant(self, i_ma: float) -> int:
        """Code DAC (arrondi) pour un courant donné. i_ma < 0 ou > i_max_ma (logiciel) → ValueError."""
        raise NotImplementedError

    # -- états ---------------------------------------------------------------------------
    @property
    def est_actif(self) -> bool:
        raise NotImplementedError

    @property
    def consigne_ma(self) -> float:
        """Dernière consigne appliquée (mA)."""
        raise NotImplementedError

    def activer(self) -> None:
        """Séquence d'allumage sûre :
        1. si l'interlock est ouvert → InterlockOuvert (le relais reste fermé) ;
        2. consigne DAC à 0 ;  3. attendre 0,1 s ;  4. ouvrir le relais (relais.on()) ;  5. état actif."""
        raise NotImplementedError

    def desactiver(self) -> None:
        """Séquence d'arrêt : rampe jusqu'à 0 (si actif), DAC à 0, relais fermé (off), état inactif.
        Ne doit JAMAIS lever d'exception (on l'appelle aussi en cas d'urgence)."""
        raise NotImplementedError

    # -- courant -----------------------------------------------------------------------------
    def verifier_interlock(self) -> None:
        """Si la boucle est ouverte : met tout en sécurité (desactiver) puis lève InterlockOuvert."""
        raise NotImplementedError

    def regler_courant(self, i_ma: float, rampe: bool = True) -> None:
        """Amène le courant à i_ma.
        * pas actif → ErreurSecurite ;  * i_ma hors limites → ValueError (rien n'est changé) ;
        * interlock vérifié AVANT et À CHAQUE PAS de la rampe."""
        raise NotImplementedError

    # -- mesures -------------------------------------------------------------------------------
    def mesurer_courant_ma(self) -> float:
        """Courant réel : tension du shunt / Rs."""
        raise NotImplementedError

    def mesurer_tension_diode(self) -> float:
        """Tension de la diode : V+ − 2 × (tension lue sur le canal vdrain)."""
        raise NotImplementedError
