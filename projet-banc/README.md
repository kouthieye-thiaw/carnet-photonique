# banclaser — le code de mon banc de test laser

Kit de démarrage du projet « banc de test laser sur Raspberry Pi » du **carnet photonique** de Kouthieye Thiaw.
Le principe : **tu écris le code**, les tests te disent quand il est juste. Un **banc simulé** (fourni)
imite le vrai matériel au niveau des octets I²C : tout se développe et se teste sur ton PC, puis
tourne tel quel sur la Raspberry Pi.

## Installation (PC ou Raspberry Pi)

```bash
cd projet-banc
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"          # sur la Pi : pip install -e ".[dev,pi]"
pytest                           # au début, seuls les tests du simulateur passent
```

## Ordre de travail (suis le carnet, module 07 « code 1 » à « code 4 »)

| étape | fichier à compléter | tests |
|---|---|---|
| 1 | `src/banclaser/instruments/ads1115.py` | `pytest tests/test_01_ads1115.py` |
| 2 | `src/banclaser/instruments/mcp4725.py` | `tests/test_02_mcp4725.py` |
| 3 | `src/banclaser/instruments/laser.py` (sécurité !) | `tests/test_03_laser.py` |
| 4 | `src/banclaser/instruments/temperature.py` | `tests/test_04_temperature.py` |
| 5 | `src/banclaser/mesures/liv.py` | `tests/test_05_mesure_liv.py` |
| 6 | `src/banclaser/analyse/liv.py` | `tests/test_06_analyse_liv.py` |
| 7 | `src/banclaser/analyse/faisceau.py` | `tests/test_07_faisceau.py` |
| 8 | `src/banclaser/analyse/polarisation.py` | `tests/test_08_polarisation.py` |
| 9 | `src/banclaser/analyse/bruit.py` | `tests/test_09_bruit.py` |
| 10 | `src/banclaser/cli.py` | essais à la main : `banclaser --simule liv` |

Astuce : `pytest -x` s'arrête au premier échec ; `pytest -k rampe` ne lance que les tests contenant « rampe ».

## Ce qui est fourni

- `config/banc.toml` : adresses I²C, canaux, brochage GPIO, limites, gains PID, étalonnage ;
- `materiel/interfaces.py` : les interfaces que ton code utilise (bus I²C, GPIO, pont en H, horloge) ;
- `materiel/raspberry.py` : leur implémentation réelle (smbus2, gpiozero, rpi-hardware-pwm) ;
- `simulation/banc_simule.py` : le banc simulé (diode 650 nm, driver, relais, interlock, thermique, CTN) ;
- `securite.py` : les exceptions de sécurité.

## Sécurité (à lire avant de brancher quoi que ce soit)

Le logiciel est une **couche de sécurité en plus** du matériel, jamais la seule : interlock câblé
en série, relais de court-circuit normalement fermé, limite de courant par le diviseur de consigne,
chien de garde, EEPROM du DAC à zéro. Diode de classe 3R : lunettes adaptées, capot fermé.

Auteur : Kouthieye Thiaw — BUT3 GEII, technicien laser & photonique en devenir.
