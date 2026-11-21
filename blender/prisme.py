"""Prisme de verre dispersant un faisceau de lumière blanche (vignette du module physique)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
import bmesh
from mathutils import Vector

A = args()
reset()
P = palette()
verre = mat("verre_prisme", "#f4fbff", rough=0.0, transmission=1.0, ior=1.6, alpha=0.4)

# prisme équilatéral (arête verticale)
a = 40.0
pts = [(0, a / math.sqrt(3)), (-a / 2, -a / (2 * math.sqrt(3))), (a / 2, -a / (2 * math.sqrt(3)))]
bm = bmesh.new()
bot = [bm.verts.new((x, y, 0)) for x, y in pts]
top = [bm.verts.new((x, y, 38)) for x, y in pts]
bm.faces.new(bot[::-1]); bm.faces.new(top)
for i in range(3):
    j = (i + 1) % 3
    bm.faces.new((bot[i], bot[j], top[j], top[i]))
me = bpy.data.meshes.new("prisme"); bm.to_mesh(me); bm.free()
prisme = link(bpy.data.objects.new("prisme", me))
prisme.data.materials.append(verre)
bv = prisme.modifiers.new("bev", "BEVEL"); bv.width = 0.6; bv.segments = 3

# faisceau blanc incident, puis éventail de couleurs
zc = 19.0
inc = beam("beam_blanc", (-90, -14, zc), (-8, 2, zc), 1.8, "#ffd98a", speed=1.5)
cols = ["#8b2be2", "#3b5bff", "#22a7f0", "#22c55e", "#f2c230", "#ff8a1e", "#e2372b"]
for k, c in enumerate(cols):
    ang = math.radians(-26 + k * 4.2)
    p0 = Vector((9, 1.5 + k * 0.4, zc))
    p1 = p0 + Vector((math.cos(ang), math.sin(ang), 0)) * 95
    beam(f"beam_couleur_{k}", p0, p1, 1.1, c, speed=1.5)
socle = cyl("socle", 34, 3, (0, 0, -1.5), P["plastique_creme"], verts=96, bevel=0.8)

if A["png"]:
    render(A["png"], view=(0.15, -1.0, 0.62), w=A["w"], h=A["h"], samples=A["samples"], focal=50, margin=0.7,
           extra=[(85, 20, 19), (-85, -14, 19)], beam_strength=4.0)
