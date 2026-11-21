"""Image d'accueil : un carnet en cuir, sa diode laser et un crayon orange, en lumière d'après-midi.
Nécessite assets/models/to-can.glb (lancer to_can.py avant).
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
from mathutils import Vector

A = args()
reset()
P = palette()
cuir = mat("cuir", "#7a4a2e", rough=0.62, coat=0.15)
cuir_fonce = mat("cuir_fonce", "#5a3420", rough=0.6)
pages = mat("pages", "#f6efe4", rough=0.85)
elastique = mat("elastique", "#2a1d14", rough=0.7)
signet = mat("signet", "#ff6f1e", rough=0.6)
etiquette = mat("etiquette", "#ffffff", rough=0.5)
trait = mat("trait_gris", "#b9b2aa", rough=0.6)
bois = mat("bois", "#e7c9a0", rough=0.7)
mine = mat("mine", "#2b2b2e", metal=0.4, rough=0.35)

ROT = 7.0  # carnet légèrement tourné
carnet = [box("couverture_bas", (150, 212, 3), (0, 0, 1.5), cuir, bevel=1.4),
          box("bloc_pages", (144, 206, 13), (2, 0, 9.5), pages, bevel=0.6),
          box("couverture_haut", (150, 212, 3), (0, 0, 17.5), cuir, bevel=1.4),
          cyl_between("dos", (-75, -106, 9.5), (-75, 106, 9.5), 9.6, cuir_fonce),
          box("elastique", (5, 214.5, 19.8), (58, 0, 9.5), elastique, bevel=0.4),
          box("signet", (5, 34, 0.5), (20, -122, 1.2), signet),
          box("etiquette", (76, 44, 0.5), (8, 46, 19.25), etiquette, bevel=0.5)]
for k in range(3):
    carnet.append(box(f"etiquette_ligne_{k}", (58, 0.7, 0.2), (14, 58 - k * 12, 19.6), trait))
g_carnet = group("G_carnet", carnet)
g_carnet.rotation_euler = (0, 0, math.radians(ROT))

# diode laser (modèle 3D importé), grossie ×4, couchée sur le carnet
before = set(bpy.context.scene.objects)
glb = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "models", "to-can.glb")
bpy.ops.import_scene.gltf(filepath=os.path.abspath(glb))
imported = [o for o in bpy.context.scene.objects if o not in before]
tops = [o for o in imported if o.parent is None or o.parent not in imported]
g_diode = group("G_diode", tops)
g_diode.scale = (4, 4, 4)
g_diode.rotation_euler = (0, math.radians(90), math.radians(28))   # couchée, faisceau vers la droite-haut
g_diode.location = (-18, -40, 30.8)

# crayon orange
L = 150
crayon = [cyl("crayon_corps", 4.2, L, (0, 0, 0), P["orange"], rot=(0, 90, 0), verts=6),
          cone("crayon_bois", 4.0, 1.1, 18, (L / 2 + 9, 0, 0), bois, rot=(0, 90, 0), verts=24),
          cone("crayon_mine", 1.1, 0.05, 4, (L / 2 + 20, 0, 0), mine, rot=(0, 90, 0), verts=16),
          cyl("crayon_virole", 4.35, 10, (-L / 2 - 5, 0, 0), P["alu"], rot=(0, 90, 0), verts=32),
          cyl("crayon_gomme", 4.1, 8, (-L / 2 - 14, 0, 0), P["rose_sticker"], rot=(0, 90, 0), verts=32, bevel=1.0)]
g_crayon = group("G_crayon", crayon)
g_crayon.rotation_euler = (0, 0, math.radians(97))
g_crayon.location = (104, -6, 4.2)

if A["png"]:
    render(A["png"], view=(0.32, -0.85, 1.5), w=A["w"], h=A["h"], samples=A["samples"], focal=60, margin=0.74,
           sun_dir=(-0.6, -0.25, 0.62), beam_strength=5.0, exclude=("beam", "hs_"))
