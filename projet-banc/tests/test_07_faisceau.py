"""Étape 7 — profil de faisceau (D4σ, norme ISO 11146) et M² (images synthétiques)."""
import numpy as np
import pytest

from banclaser.analyse.faisceau import ajuster_caustique, centroide, largeurs_d4sigma, mesurer_profil, soustraire_fond


def image_gauss(wx, wy, x0=210.5, y0=140.2, fond=20.0, bruit=2.0, h=300, l=400, graine=1):
    rng = np.random.default_rng(graine)
    y, x = np.mgrid[0:h, 0:l]
    img = 1000 * np.exp(-2 * ((x - x0) ** 2 / wx ** 2 + (y - y0) ** 2 / wy ** 2)) + fond
    return img + rng.normal(0, bruit, img.shape)


def test_fond_sans_ecretage():
    img = soustraire_fond(image_gauss(40, 40))
    assert abs(np.median(img[:10, :])) < 0.5          # le fond est bien retiré
    assert img.min() < 0                               # … et le bruit négatif est CONSERVÉ


def test_primitives_sans_bruit():
    img = image_gauss(40, 40, fond=0, bruit=0)
    x, y = centroide(img)
    assert x == pytest.approx(210.5, abs=0.01) and y == pytest.approx(140.2, abs=0.01)
    dx, dy = largeurs_d4sigma(img)
    assert dx == pytest.approx(80, abs=0.1) and dy == pytest.approx(80, abs=0.1)   # D4σ = 2w pour un gaussien


@pytest.mark.parametrize("wx, wy", [(40, 40), (50, 30), (25, 25)])
def test_profil_bruite_iso(wx, wy):
    r = mesurer_profil(soustraire_fond(image_gauss(wx, wy)))
    assert r["cx"] == pytest.approx(210.5, abs=0.3) and r["cy"] == pytest.approx(140.2, abs=0.3)
    assert r["dx"] == pytest.approx(2 * wx, rel=0.02) and r["dy"] == pytest.approx(2 * wy, rel=0.02)


def test_caustique_m2():
    lam_nm, w0, m2, z0 = 650.0, 0.1, 1.3, 50.0
    lam = lam_nm * 1e-6
    zr = np.pi * w0 ** 2 / (m2 * lam)
    z = np.linspace(0, 150, 15)
    w = w0 * np.sqrt(1 + ((z - z0) / zr) ** 2)
    d = 2 * w * (1 + np.random.default_rng(3).normal(0, 0.01, z.size))
    r = ajuster_caustique(z, d, lam_nm)
    assert r["m2"] == pytest.approx(1.3, abs=0.06)
    assert r["w0_mm"] == pytest.approx(0.1, abs=0.004)
    assert r["z0_mm"] == pytest.approx(50, abs=2)
    assert r["zr_mm"] == pytest.approx(zr, rel=0.08)
