"""Profil d'intensité d'un faisceau gaussien I(x,y) = exp(-2 r²/w²) en relief (vignette du module maths
+ modèle 3D de la leçon « faisceau gaussien »). Un anneau marque le rayon w (niveau 1/e² ≈ 13,5 %).
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
import bmesh

A = args()
reset()
P = palette()
N, S, H, Wb = 140, 52.0, 40.0, 21.0  # résolution, demi-taille, hauteur du pic, rayon w

# surface avec couleurs par sommet (crème -> orange -> sienne)
bm = bmesh.new()
verts = []
for j in range(N + 1):
    row = []
    for i in range(N + 1):
        x = -S + 2 * S * i / N
        y = -S + 2 * S * j / N
        z = H * math.exp(-2 * (x * x + y * y) / (Wb * Wb))
        row.append(bm.verts.new((x, y, z)))
    verts.append(row)
for j in range(N):
    for i in range(N):
        bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
me = bpy.data.meshes.new("surface_gauss")
bm.to_mesh(me)
bm.free()
surf = link(bpy.data.objects.new("surface_gauss", me))
col = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
stops = [(0.0, (0.99, 0.97, 0.95)), (0.135, (1.0, 0.86, 0.72)), (0.5, (1.0, 0.44, 0.12)), (1.0, (0.81, 0.31, 0.04))]
def ramp(t):
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(srgb_to_lin(c0[n] + (c1[n] - c0[n]) * k) for n in range(3))
    return tuple(srgb_to_lin(c) for c in stops[-1][1])
for k, v in enumerate(me.vertices):
    r, g, b = ramp(v.co.z / H)
    col.data[k].color = (r, g, b, 1.0)
m = bpy.data.materials.new("degrade_gauss")
m.use_nodes = True
nt = m.node_tree
bsdf = nt.nodes["Principled BSDF"]
attr = nt.nodes.new("ShaderNodeVertexColor")
attr.layer_name = "Col"
nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.42
me.materials.append(m)
select_only(surf)
bpy.ops.object.shade_smooth()

# anneau à 1/e² (rayon w) et axes
lvl = H * math.exp(-2)
anneau = torus("anneau_w", Wb, 0.45, (0, 0, lvl), P["plastique_noir"], maj=128)
base = box("socle_papier", (2 * S + 8, 2 * S + 8, 2), (0, 0, -1.05), P["papier"], bevel=0.8)
axes = [cyl_between("axe_x", (-S - 2, -S - 4, 0.6), (S + 6, -S - 4, 0.6), 0.5, P["plastique_noir"]),
        cone("fleche_x", 1.6, 0, 4, (S + 8, -S - 4, 0.6), P["plastique_noir"], rot=(0, 90, 0)),
        cyl_between("axe_z", (-S - 4, -S - 4, 0), (-S - 4, -S - 4, H + 6), 0.5, P["plastique_noir"]),
        cone("fleche_z", 1.6, 0, 4, (-S - 4, -S - 4, H + 8), P["plastique_noir"])]

hotspot("hs_pic", (0, 0, H + 2))
hotspot("hs_w", (Wb, 0, lvl + 2))
hotspot("hs_aile", (-26, 22, 1.5))

if A["glb"]:
    export_glb(A["glb"])
if A["png"]:
    render(A["png"], view=(0.75, -1.0, 0.62), w=A["w"], h=A["h"], samples=A["samples"], focal=55, margin=0.66)
