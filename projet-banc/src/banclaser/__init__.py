"""banclaser — banc de test de diode laser sur Raspberry Pi.

Organisation :
    config.py          chargement de config/banc.toml                       (fourni)
    securite.py        exceptions de sécurité                                (fourni)
    materiel/          interfaces matérielles et implémentation Raspberry Pi (fourni)
    simulation/        banc simulé pour développer et tester sans matériel   (fourni)
    instruments/       pilotes : ADC, DAC, driver laser, température         (À TOI)
    mesures/           séquences de mesure (L-I-V…)                          (À TOI)
    analyse/           traitement des données (seuil, D4σ, M², PER, RIN)     (À TOI)
    cli.py             interface en ligne de commande                        (À TOI)
"""
__version__ = "0.1.0"
