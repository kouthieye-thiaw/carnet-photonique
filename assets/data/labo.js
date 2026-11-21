/* Exercices du labo Python. Chaque exercice : énoncé (HTML), code de départ, tests (Python, exécutés après ton code),
   indice et solution. numpy: true → le paquet numpy est chargé avant l'exécution. */
window.CARNET_LABO = [
  {
    id: "dbm", titre: "convertir mW ⇄ dBm", m: "maths", niveau: 1,
    enonce: "Écris <code>mw_vers_dbm(p_mw)</code> et <code>dbm_vers_mw(p_dbm)</code>. Une puissance nulle ou négative n'a pas d'équivalent en dBm : lève une <code>ValueError</code>.",
    code: String.raw`import math

def mw_vers_dbm(p_mw):
    # 0 dBm = 1 mW
    ...

def dbm_vers_mw(p_dbm):
    ...

print(mw_vers_dbm(2))      # ≈ 3,01
print(dbm_vers_mw(-20))    # 0,01`,
    tests: String.raw`assert abs(mw_vers_dbm(1)) < 1e-12, "mw_vers_dbm(1) doit valoir 0"
assert abs(mw_vers_dbm(10) - 10) < 1e-9, "mw_vers_dbm(10) doit valoir 10"
assert abs(mw_vers_dbm(2) - 3.0103) < 1e-3, "mw_vers_dbm(2) ≈ 3,0103"
assert abs(dbm_vers_mw(-20) - 0.01) < 1e-12, "dbm_vers_mw(-20) doit valoir 0,01"
assert abs(dbm_vers_mw(mw_vers_dbm(4.2)) - 4.2) < 1e-9, "l'aller-retour doit redonner la valeur de départ"
try:
    mw_vers_dbm(0)
    raise AssertionError("mw_vers_dbm(0) doit lever ValueError")
except ValueError:
    pass`,
    indice: "<code>math.log10</code> pour le logarithme décimal ; l'inverse de 10·log<sub>10</sub>(x) est 10<sup>x/10</sup>, soit <code>10 ** (x / 10)</code>.",
    solution: String.raw`import math

def mw_vers_dbm(p_mw):
    if p_mw <= 0:
        raise ValueError("puissance strictement positive attendue")
    return 10 * math.log10(p_mw)

def dbm_vers_mw(p_dbm):
    return 10 ** (p_dbm / 10)`
  },
  {
    id: "photons", titre: "énergie et nombre de photons", m: "physique", niveau: 1,
    enonce: "Écris <code>energie_photon_ev(lambda_nm)</code> (énergie d'un photon en électron-volts) et <code>photons_par_seconde(p_mw, lambda_nm)</code>. Les constantes sont fournies.",
    code: String.raw`H = 6.62607015e-34     # J·s
C = 299792458.0        # m/s
E = 1.602176634e-19    # C (1 eV = E joules)

def energie_photon_ev(lambda_nm):
    ...

def photons_par_seconde(p_mw, lambda_nm):
    ...

print(energie_photon_ev(650))          # ≈ 1,91
print(photons_par_seconde(1, 650))     # ≈ 3,3e15`,
    tests: String.raw`assert abs(energie_photon_ev(650) - 1.9074) < 2e-3, "650 nm → ≈ 1,907 eV"
assert abs(energie_photon_ev(1550) - 0.7999) < 2e-3, "1550 nm → ≈ 0,80 eV"
n = photons_par_seconde(1, 650)
assert abs(n / 3.272e15 - 1) < 0.01, "1 mW à 650 nm → ≈ 3,27e15 photons/s (obtenu : %.3g)" % n
assert abs(photons_par_seconde(2, 650) / n - 2) < 1e-9, "le flux doit être proportionnel à la puissance"`,
    indice: "Attention aux unités : λ en mètres (×1e−9), P en watts (×1e−3). E = hc/λ en joules, puis divise par E pour avoir des eV.",
    solution: String.raw`def energie_photon_ev(lambda_nm):
    return H * C / (lambda_nm * 1e-9) / E

def photons_par_seconde(p_mw, lambda_nm):
    return (p_mw * 1e-3) / (H * C / (lambda_nm * 1e-9))`
  },
  {
    id: "signe", titre: "le complément à deux, à la main", m: "electronique", niveau: 2,
    enonce: "Un convertisseur 16 bits renvoie deux octets, poids fort d'abord, en complément à deux. Écris <code>entier_signe(fort, faible)</code> <strong>sans</strong> <code>int.from_bytes</code> : assemble le mot de 16 bits, puis s'il dépasse 32 767, retranche 65 536.",
    code: String.raw`def entier_signe(fort, faible):
    ...

print(entier_signe(0xFF, 0x38))   # -200
print(entier_signe(0x7F, 0xFF))   # 32767`,
    tests: String.raw`assert entier_signe(0xFF, 0x38) == -200, "FF 38 → -200"
assert entier_signe(0x7F, 0xFF) == 32767, "7F FF → 32767"
assert entier_signe(0x80, 0x00) == -32768, "80 00 → -32768"
assert entier_signe(0x00, 0x05) == 5, "00 05 → 5"
assert entier_signe(0xFF, 0xFF) == -1, "FF FF → -1"`,
    indice: "Le mot vaut <code>(fort &lt;&lt; 8) | faible</code>. Le bit de signe est le bit 15 (<code>mot &amp; 0x8000</code>).",
    solution: String.raw`def entier_signe(fort, faible):
    mot = (fort << 8) | faible
    return mot - 65536 if mot & 0x8000 else mot`
  },
  {
    id: "bits", titre: "champs de bits d'un registre", m: "electronique", niveau: 2,
    enonce: "Un capteur (fictif) a un registre de 16 bits : bits 15–12 = <b>canal</b> (4 bits), bits 11–8 = <b>gain</b> (4 bits), bit 7 = <b>mode</b>, bits 6–0 = <b>moyenne</b> (7 bits). Écris <code>assembler(canal, gain, mode, moyenne)</code> (valeurs hors limites → <code>ValueError</code>) et <code>extraire(mot, bit_bas, nb_bits)</code>.",
    code: String.raw`def assembler(canal, gain, mode, moyenne):
    ...

def extraire(mot, bit_bas, nb_bits):
    ...

m = assembler(3, 2, 1, 16)
print(hex(m))                # 0x3290
print(extraire(m, 8, 4))     # 2 (le gain)`,
    tests: String.raw`assert assembler(3, 2, 1, 16) == 0x3290, "assembler(3, 2, 1, 16) doit valoir 0x3290 (obtenu : %s)" % hex(assembler(3, 2, 1, 16))
assert assembler(15, 15, 1, 127) == 0xFFFF, "tous les champs au maximum → 0xFFFF"
assert assembler(0, 0, 0, 0) == 0
assert extraire(0x3290, 12, 4) == 3 and extraire(0x3290, 8, 4) == 2
assert extraire(0x3290, 7, 1) == 1 and extraire(0x3290, 0, 7) == 16
for mauvais in [(16, 0, 0, 0), (0, -1, 0, 0), (0, 0, 2, 0), (0, 0, 0, 128)]:
    try:
        assembler(*mauvais)
        raise AssertionError("assembler%s doit lever ValueError" % (mauvais,))
    except ValueError:
        pass`,
    indice: "Pour placer : <code>valeur &lt;&lt; bit_bas</code>, puis assembler avec <code>|</code>. Pour extraire : décaler vers la droite de <code>bit_bas</code>, puis garder <code>nb_bits</code> bits avec le masque <code>(1 &lt;&lt; nb_bits) - 1</code>.",
    solution: String.raw`def assembler(canal, gain, mode, moyenne):
    for v, n in [(canal, 4), (gain, 4), (mode, 1), (moyenne, 7)]:
        if not 0 <= v < (1 << n):
            raise ValueError("champ hors limites")
    return (canal << 12) | (gain << 8) | (mode << 7) | moyenne

def extraire(mot, bit_bas, nb_bits):
    return (mot >> bit_bas) & ((1 << nb_bits) - 1)`
  },
  {
    id: "stats", titre: "moyenne, écart-type, incertitude", m: "maths", niveau: 1,
    enonce: "Écris <code>statistiques(valeurs)</code> qui renvoie <code>(moyenne, ecart_type, incertitude_moyenne)</code> : écart-type expérimental (division par n − 1) et incertitude-type sur la moyenne s/√n. Moins de 2 valeurs → <code>ValueError</code>. Sans numpy !",
    code: String.raw`import math

def statistiques(valeurs):
    ...

print(statistiques([20.1, 19.8, 20.3, 20.0, 19.9]))`,
    tests: String.raw`m, s, u = statistiques([20.1, 19.8, 20.3, 20.0, 19.9])
assert abs(m - 20.02) < 1e-9, "moyenne attendue : 20,02"
assert abs(s - 0.192354) < 1e-5, "écart-type (n − 1) attendu : 0,1924 (obtenu : %.5f)" % s
assert abs(u - 0.0860233) < 1e-5, "incertitude sur la moyenne : s/√n ≈ 0,0860"
try:
    statistiques([1.0])
    raise AssertionError("une seule valeur doit lever ValueError")
except ValueError:
    pass`,
    indice: "s = √( Σ(x − m)² / (n − 1) ). L'incertitude sur la moyenne diminue en 1/√n : 4 fois plus de mesures, 2 fois moins d'incertitude.",
    solution: String.raw`import math

def statistiques(valeurs):
    n = len(valeurs)
    if n < 2:
        raise ValueError("au moins deux valeurs")
    m = sum(valeurs) / n
    s = math.sqrt(sum((x - m) ** 2 for x in valeurs) / (n - 1))
    return m, s, s / math.sqrt(n)`
  },
  {
    id: "pont", titre: "la tension d'un pont CTN", m: "physique", niveau: 2,
    enonce: "Le pont du banc : V<sub>alim</sub> — R<sub>fixe</sub> — point milieu — CTN — masse. Écris <code>tension_pont(t_c)</code> qui renvoie la tension du point milieu pour une température en °C (modèle β : R = R<sub>25</sub>·e<sup>β(1/T − 1/T<sub>25</sub>)</sup>).",
    code: String.raw`import math

R25, BETA, R_FIXE, V_ALIM = 10_000.0, 3950.0, 10_000.0, 3.3

def tension_pont(t_c):
    ...

for t in (0, 25, 40, 60):
    print(t, "°C →", round(tension_pont(t), 4), "V")`,
    tests: String.raw`assert abs(tension_pont(25) - 1.65) < 1e-9, "à 25 °C, la CTN vaut R_fixe : 1,65 V"
assert abs(tension_pont(40) - 1.1433) < 2e-3, "à 40 °C : ≈ 1,143 V (obtenu : %.4f)" % tension_pont(40)
assert tension_pont(0) > tension_pont(25) > tension_pont(60), "la tension doit diminuer quand la température monte"`,
    indice: "Convertis d'abord en kelvins (+273,15), calcule R, puis le diviseur : V = V<sub>alim</sub>·R/(R + R<sub>fixe</sub>).",
    solution: String.raw`import math

def tension_pont(t_c):
    t = t_c + 273.15
    r = R25 * math.exp(BETA * (1 / t - 1 / 298.15))
    return V_ALIM * r / (r + R_FIXE)`
  },
  {
    id: "gauss", titre: "propager un faisceau gaussien", m: "lasers", niveau: 2,
    enonce: "Écris <code>rayleigh_mm(w0_um, lambda_nm, m2=1.0)</code> et <code>rayon_um(z_mm, w0_um, lambda_nm, m2=1.0)</code> (col en z = 0). Attention aux unités !",
    code: String.raw`import math

def rayleigh_mm(w0_um, lambda_nm, m2=1.0):
    ...

def rayon_um(z_mm, w0_um, lambda_nm, m2=1.0):
    ...

print(rayleigh_mm(45, 650, 1.1))        # ≈ 8,9 mm
print(rayon_um(8.897, 45, 650, 1.1))   # ≈ 45·√2 ≈ 63,6 µm`,
    tests: String.raw`zr = rayleigh_mm(45, 650, 1.1)
assert abs(zr - 8.8975) < 0.01, "z_R attendu ≈ 8,90 mm (obtenu : %.4f)" % zr
assert abs(rayon_um(0, 45, 650, 1.1) - 45) < 1e-9, "au col, le rayon vaut w0"
assert abs(rayon_um(zr, 45, 650, 1.1) / 45 - math.sqrt(2)) < 1e-6, "à z_R, le rayon vaut w0·√2"
assert abs(rayleigh_mm(45, 650, 2.2) - zr / 2) < 1e-9, "z_R est inversement proportionnel à M²"`,
    indice: "Travaille en mm partout : w0 = w0_um × 1e−3 mm, λ = lambda_nm × 1e−6 mm. z<sub>R</sub> = πw<sub>0</sub>²/(M²λ), w(z) = w<sub>0</sub>√(1 + (z/z<sub>R</sub>)²).",
    solution: String.raw`import math

def rayleigh_mm(w0_um, lambda_nm, m2=1.0):
    return math.pi * (w0_um * 1e-3) ** 2 / (m2 * lambda_nm * 1e-6)

def rayon_um(z_mm, w0_um, lambda_nm, m2=1.0):
    return w0_um * math.sqrt(1 + (z_mm / rayleigh_mm(w0_um, lambda_nm, m2)) ** 2)`
  },
  {
    id: "glissante", titre: "moyenne glissante", m: "maths", niveau: 2,
    enonce: "Écris <code>moyenne_glissante(valeurs, n)</code> : la liste des moyennes de n valeurs consécutives (longueur : len(valeurs) − n + 1). n &lt; 1 ou plus grand que la liste → <code>ValueError</code>. Bonus : un seul passage sur les données (somme qu'on met à jour).",
    code: String.raw`def moyenne_glissante(valeurs, n):
    ...

print(moyenne_glissante([1, 2, 3, 4, 5], 3))   # [2.0, 3.0, 4.0]`,
    tests: String.raw`assert moyenne_glissante([1, 2, 3, 4, 5], 3) == [2.0, 3.0, 4.0], "[1..5], n = 3 → [2, 3, 4]"
assert moyenne_glissante([4, 8], 1) == [4.0, 8.0]
assert moyenne_glissante([4, 8], 2) == [6.0]
r = moyenne_glissante(list(range(1000)), 10)
assert len(r) == 991 and abs(r[0] - 4.5) < 1e-9 and abs(r[-1] - 994.5) < 1e-9
for mauvais in [0, 6]:
    try:
        moyenne_glissante([1, 2, 3, 4, 5], mauvais)
        raise AssertionError("n = %d doit lever ValueError" % mauvais)
    except ValueError:
        pass`,
    indice: "Calcule la somme des n premières valeurs ; à chaque pas, ajoute la valeur qui entre et retire celle qui sort.",
    solution: String.raw`def moyenne_glissante(valeurs, n):
    if not 1 <= n <= len(valeurs):
        raise ValueError("fenêtre invalide")
    s = sum(valeurs[:n])
    out = [s / n]
    for i in range(n, len(valeurs)):
        s += valeurs[i] - valeurs[i - n]
        out.append(s / n)
    return out`
  },
  {
    id: "d4s", titre: "largeur D4σ d'un profil (numpy)", m: "projet", niveau: 3, numpy: true,
    enonce: "Pour un profil d'intensité à une dimension (tableau numpy <code>e</code>, positions <code>x</code>), écris <code>centroide_d4s(x, e)</code> qui renvoie (centroïde, D4σ) avec les moments d'ordre 1 et 2. Vérifie que D4σ = 2w pour un profil gaussien.",
    code: String.raw`import numpy as np

def centroide_d4s(x, e):
    ...

x = np.arange(0, 200.0)
e = np.exp(-2 * (x - 80.3) ** 2 / 15 ** 2)     # rayon w = 15
print(centroide_d4s(x, e))                      # ≈ (80,3 ; 30)`,
    tests: String.raw`import numpy as np
x = np.arange(0, 200.0)
c, d = centroide_d4s(x, np.exp(-2 * (x - 80.3) ** 2 / 15 ** 2))
assert abs(c - 80.3) < 1e-6, "centroïde attendu : 80,3 (obtenu : %.4f)" % c
assert abs(d - 30) < 1e-3, "pour un gaussien de rayon 15, D4σ = 30 (obtenu : %.4f)" % d
c2, d2 = centroide_d4s(x, 3.7 * np.exp(-2 * (x - 120) ** 2 / 8 ** 2))
assert abs(c2 - 120) < 1e-6 and abs(d2 - 16) < 1e-3, "le résultat ne doit pas dépendre de l'amplitude"`,
    indice: "Centroïde : Σx·e / Σe. Variance : Σ(x − c)²·e / Σe. D4σ = 4√variance. Avec numpy : <code>np.sum</code>, <code>np.sqrt</code>.",
    solution: String.raw`import numpy as np

def centroide_d4s(x, e):
    x, e = np.asarray(x, float), np.asarray(e, float)
    s = e.sum()
    c = (x * e).sum() / s
    var = ((x - c) ** 2 * e).sum() / s
    return c, 4 * np.sqrt(var)`
  },
  {
    id: "fiabilite", titre: "fiabilité et disponibilité", m: "systemes", niveau: 1,
    enonce: "Écris <code>fiabilite(t_h, mtbf_h)</code> (probabilité de fonctionner sans panne jusqu'à t, taux constant) et <code>disponibilite(mtbf_h, mttr_h)</code>. Puis réponds dans un commentaire : quelle est la fiabilité à t = MTBF ?",
    code: String.raw`import math

def fiabilite(t_h, mtbf_h):
    ...

def disponibilite(mtbf_h, mttr_h):
    ...

print(fiabilite(1000, 1000))       # ?
print(disponibilite(1000, 4))      # ≈ 0,996`,
    tests: String.raw`import math
assert abs(fiabilite(0, 500) - 1) < 1e-12, "R(0) = 1"
assert abs(fiabilite(1000, 1000) - math.exp(-1)) < 1e-12, "R(MTBF) = e⁻¹ ≈ 0,37"
assert abs(disponibilite(1000, 4) - 1000 / 1004) < 1e-12, "D = MTBF / (MTBF + MTTR)"
assert fiabilite(2000, 1000) < fiabilite(1000, 1000), "la fiabilité décroît avec le temps"`,
    indice: "R(t) = e<sup>−t/MTBF</sup> pour un taux de défaillance constant (λ = 1/MTBF).",
    solution: String.raw`import math

def fiabilite(t_h, mtbf_h):
    return math.exp(-t_h / mtbf_h)

def disponibilite(mtbf_h, mttr_h):
    return mtbf_h / (mtbf_h + mttr_h)

# R(MTBF) = e^-1 ≈ 0,37 : seulement 37 % des équipements atteignent le MTBF sans panne !`
  }
];
