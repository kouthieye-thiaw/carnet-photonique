"""Exceptions liées à la sécurité du banc. Fourni.

Règle d'or : le logiciel n'est qu'une couche de sécurité EN PLUS du matériel
(interlock câblé, relais de court-circuit normalement fermé, limite de courant
par le diviseur de consigne, chien de garde). Il ne la remplace jamais.
"""


class ErreurSecurite(Exception):
    """Une action a été refusée pour une raison de sécurité."""


class InterlockOuvert(ErreurSecurite):
    """La boucle d'interlock (clé, arrêt d'urgence, capot) est ouverte."""


class TemperatureHorsFenetre(ErreurSecurite):
    """La température de la diode est hors de la fenêtre autorisée."""
