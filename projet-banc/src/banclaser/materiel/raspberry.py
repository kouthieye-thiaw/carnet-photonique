"""Implémentation « vrai matériel » des interfaces, pour la Raspberry Pi. Fourni.

Les imports se font à l'intérieur des classes : sur ton PC (sans smbus2 ni
gpiozero), le reste du paquet reste utilisable avec le banc simulé.
Raspberry Pi 5 : RPi.GPIO ne fonctionne PAS ; on utilise gpiozero (+ lgpio).
"""
from __future__ import annotations

import time


class BusI2CSmbus:
    """Bus I²C via smbus2 (transactions i2c_rdwr, comme un vrai maître I²C)."""

    def __init__(self, numero: int = 1):
        from smbus2 import SMBus, i2c_msg
        self._bus = SMBus(numero)
        self._msg = i2c_msg

    def ecrire(self, adresse: int, octets: bytes) -> None:
        self._bus.i2c_rdwr(self._msg.write(adresse, list(octets)))

    def ecrire_lire(self, adresse: int, octets: bytes, n: int) -> bytes:
        w = self._msg.write(adresse, list(octets))
        r = self._msg.read(adresse, n)
        self._bus.i2c_rdwr(w, r)
        return bytes(list(r))

    def fermer(self) -> None:
        self._bus.close()


class SortieGPIO:
    """Sortie numérique (gpiozero). `initial=False` : état sûr au démarrage du programme."""

    def __init__(self, broche: int, actif_haut: bool = True, initial: bool = False):
        from gpiozero import DigitalOutputDevice
        self._d = DigitalOutputDevice(broche, active_high=actif_haut, initial_value=initial)

    def on(self) -> None:
        self._d.on()

    def off(self) -> None:
        self._d.off()

    @property
    def valeur(self) -> bool:
        return bool(self._d.value)


class EntreeGPIO:
    """Entrée numérique (gpiozero)."""

    def __init__(self, broche: int, pull_up: bool | None = False):
        from gpiozero import DigitalInputDevice
        self._d = DigitalInputDevice(broche, pull_up=pull_up)

    @property
    def valeur(self) -> bool:
        return bool(self._d.value)


class PontHPWM:
    """Pont en H (type DRV8871) commandé par deux PWM matérielles (IN1, IN2).

    Prérequis : overlay PWM activé dans /boot/firmware/config.txt (par ex. dtoverlay=pwm-2chan)
    et bibliothèque rpi-hardware-pwm. Vérifie dans sa documentation le numéro de « chip »
    propre à la Raspberry Pi 5 et passe-le en paramètre si besoin.
    """

    def __init__(self, frequence: float = 20_000, commande_max: float = 0.6, canal_in1: int = 0,
                 canal_in2: int = 1, chip: int | None = None):
        from rpi_hardware_pwm import HardwarePWM
        kw = {} if chip is None else {"chip": chip}
        self._in1 = HardwarePWM(pwm_channel=canal_in1, hz=frequence, **kw)
        self._in2 = HardwarePWM(pwm_channel=canal_in2, hz=frequence, **kw)
        self._in1.start(0)
        self._in2.start(0)
        self.commande_max = commande_max

    def appliquer(self, commande: float) -> None:
        c = max(-self.commande_max, min(self.commande_max, float(commande)))
        if c >= 0:
            self._in2.change_duty_cycle(0)
            self._in1.change_duty_cycle(100 * c)
        else:
            self._in1.change_duty_cycle(0)
            self._in2.change_duty_cycle(-100 * c)

    def arreter(self) -> None:
        self._in1.change_duty_cycle(0)
        self._in2.change_duty_cycle(0)


class HorlogeReelle:
    def maintenant(self) -> float:
        return time.monotonic()

    def dormir(self, secondes: float) -> None:
        if secondes > 0:
            time.sleep(secondes)
