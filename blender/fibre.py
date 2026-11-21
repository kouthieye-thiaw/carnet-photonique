"""Fibre optique monomode dénudée couche par couche + connecteur SC/APC (vert, ferrule polie à 8°).
Échelle exagérée pour la lisibilité (unités arbitraires).
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
import bmesh
from mathutils import Vector

A = args()
reset()
P = palette()
gaine_opt = mat("gaine_optique", "#e8f3ff", rough=0.02, transmission=1.0, ior=1.444, alpha=0.32)
revet = mat("revetement_acrylate", "#9fc9e6", rough=0.35, alpha=0.9)
tampon = mat("tampon_900", "#f4efe6", rough=0.55)
aramide = mat("aramide", "#e8c66a", rough=0.95)
gaine_ext = mat("gaine_jaune", "#f6c21a", rough=0.5)
apc = mat("sc_apc_vert", "#1f9d55", rough=0.38)
zirc = mat("zircone", "#f8f6f2", rough=0.25)

def couche(nom, r, x0, x1, m, verts=64):
    return cyl_between(nom, (x0, 0, 0), (x1, 0, 0), r, m, verts=verts)

coeur_v = couche("coeur_verre", 0.75, 0, 82, mat("coeur", "#ffd9d2", rough=0.05, transmission=0.8, alpha=0.6), 32)
lum = beam("beam_coeur", (-122, 0, 0), (90, 0, 0), 0.6, "#e2372b", speed=2.5)
cl = couche("gaine_optique", 6.0, 0, 62, gaine_opt)
co = couche("revetement", 8.0, 0, 48, revet)
tb = couche("tampon", 11.0, 0, 36, tampon)
ar = couche("fils_aramide", 13.4, 0, 26, aramide)
# quelques brins d'aramide qui dépassent
brins = [tube(f"brin_{i}", [(26, 13.4 * math.cos(a), 13.4 * math.sin(a)), (31 + 3 * (i % 3), 15 * math.cos(a + .2), 15 * math.sin(a + .2)),
                            (34 + 4 * (i % 2), 17 * math.cos(a + .35), 17 * math.sin(a + .35))], 0.35, aramide)
         for i, a in enumerate([k * 2 * math.pi / 9 for k in range(9)])]
ge = couche("gaine_exterieure", 15.0, -44, 14, gaine_ext)

# connecteur SC/APC
manchon = cone("manchon", 17.5, 15.5, 30, (-59, 0, 0), P["plastique_noir"], rot=(0, 90, 0))
corps = box("corps_sc_apc", (62, 34, 28), (-105, 0, 0), apc, bevel=1.6)
# ferrule en zircone, face polie en angle de 8° (APC)
fer = cyl_between("ferrule", (-160, 0, 0), (-134, 0, 0), 5.0, zirc, verts=48)
select_only(fer)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bm = bmesh.new()
bm.from_mesh(fer.data)
n = Vector((-math.cos(math.radians(8)), 0, math.sin(math.radians(8))))
res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(-157, 0, 0), plane_no=n, clear_outer=True)
edges = [e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]
bmesh.ops.edgeloop_fill(bm, edges=edges)
bm.to_mesh(fer.data)
bm.free()

hotspot("hs_coeur", (78, 0, 2.2))
hotspot("hs_gaine_optique", (55, 0, 6.5))
hotspot("hs_revetement", (43, 0, 8.6))
hotspot("hs_tampon", (31, 0, 11.6))
hotspot("hs_aramide", (21, 0, 14))
hotspot("hs_gaine", (-10, 0, 15.6))
hotspot("hs_connecteur", (-100, 0, 15))
hotspot("hs_ferrule", (-150, 0, 5.6))

if A["glb"]:
    export_glb(A["glb"])
if A["png"]:
    render(A["png"], view=(0.45, -1.0, 0.7), w=A["w"], h=A["h"], samples=A["samples"], focal=60, margin=0.8)
