"""common.py — boîte à outils Blender (bpy) pour les modèles du carnet photonique.

Lancer un modèle (Blender en mode « sans interface ») :
    blender -b --factory-startup --python blender/to_can.py -- --glb assets/models/to-can.glb --png assets/img/mod-lasers.png

Conventions reconnues par le viewer web (assets/js/viewer3d.js) :
  * objet nommé "hs_xxx"          -> étiquette cliquable (point d'intérêt)
  * objet nommé "beam..."         -> faisceau laser animé (couleur = propriété "color")
  * propriété "explode" [x, y, z] -> déplacement en vue éclatée (unités Blender)
  * propriétés "spin" 1.5 + "spin_axis" "z" -> rotation continue autour d'un axe
  * propriété "glow" 1            -> émission qui « respire »
"""
import bpy
import bmesh
import math
import os
import sys
from mathutils import Vector, Matrix

# ---------------------------------------------------------------- arguments
def args():
    """Récupère --glb / --png / --samples passés après « -- »."""
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = {"glb": None, "png": None, "samples": 96, "w": 1200, "h": 900}
    for i, k in enumerate(a):
        if k == "--glb": out["glb"] = a[i + 1]
        if k == "--png": out["png"] = a[i + 1]
        if k == "--samples": out["samples"] = int(a[i + 1])
        if k == "--size": out["w"], out["h"] = (int(x) for x in a[i + 1].split("x"))
    return out

# ---------------------------------------------------------------- scène
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()
    sc = bpy.context.scene
    sc.unit_settings.system = "METRIC"
    return sc

def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj

def select_only(obj):
    for o in bpy.context.selected_objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

# ---------------------------------------------------------------- couleurs & matériaux
def srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hexc(h, a=1.0):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return (srgb_to_lin(r), srgb_to_lin(g), srgb_to_lin(b), a)

MATS = {}

def mat(name, color="#cccccc", metal=0.0, rough=0.5, emit=None, strength=0.0,
        alpha=1.0, transmission=0.0, ior=1.45, coat=0.0, spec=0.5):
    """Matériau « Principled » simple, exportable en glTF."""
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    col = hexc(color) if isinstance(color, str) else color
    b.inputs["Base Color"].default_value = col
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    try:
        b.inputs["Specular IOR Level"].default_value = spec
    except KeyError:
        pass
    if emit:
        b.inputs["Emission Color"].default_value = hexc(emit) if isinstance(emit, str) else emit
        b.inputs["Emission Strength"].default_value = strength
    if transmission:
        b.inputs["Transmission Weight"].default_value = transmission
        b.inputs["IOR"].default_value = ior
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    if alpha < 1.0:
        b.inputs["Alpha"].default_value = alpha
        for attr, val in (("surface_render_method", "BLENDED"), ("blend_method", "BLEND")):
            try:
                setattr(m, attr, val)
            except Exception:
                pass
    m.diffuse_color = col
    MATS[name] = m
    return m

# palette commune (proche de la charte du site)
def palette():
    return {
        "alu": mat("alu", "#b9bcc2", metal=1.0, rough=0.32),
        "alu_noir": mat("alu_noir", "#2a2a2d", metal=0.6, rough=0.42),
        "acier": mat("acier", "#cfd2d6", metal=1.0, rough=0.22),
        "or": mat("or", "#e0b252", metal=1.0, rough=0.24),
        "cuivre": mat("cuivre", "#c9784a", metal=1.0, rough=0.3),
        "nickel": mat("nickel", "#d6d6d2", metal=1.0, rough=0.18),
        "plastique_noir": mat("plastique_noir", "#1e1e20", rough=0.55),
        "plastique_creme": mat("plastique_creme", "#f3ebe3", rough=0.6),
        "caoutchouc": mat("caoutchouc", "#26221f", rough=0.85),
        "ceramique": mat("ceramique", "#ecebe6", rough=0.45),
        "verre": mat("verre", "#eaf4ff", rough=0.02, transmission=1.0, ior=1.5, alpha=0.35),
        "pcb_vert": mat("pcb_vert", "#1f6b3c", rough=0.45, coat=0.4),
        "pcb_bleu": mat("pcb_bleu", "#1d3f7a", rough=0.45, coat=0.4),
        "puce_noire": mat("puce_noire", "#222225", rough=0.4),
        "silicium": mat("silicium", "#3b4150", metal=0.35, rough=0.28),
        "orange": mat("orange", "#ff6f1e", rough=0.45),
        "orange_trans": mat("orange_trans", "#ff7a2a", rough=0.08, alpha=0.32, transmission=0.6),
        "rouge_btn": mat("rouge_btn", "#d22a20", rough=0.35, coat=0.6),
        "jaune": mat("jaune", "#f2c230", rough=0.5),
        "bleu_sticker": mat("bleu_sticker", "#3b82f6", rough=0.5),
        "vert_sticker": mat("vert_sticker", "#22c55e", rough=0.5),
        "rose_sticker": mat("rose_sticker", "#ff66cf", rough=0.5),
        "fibre_jaune": mat("fibre_jaune", "#f6c21a", rough=0.5),
        "papier": mat("papier", "#fdfbf9", rough=0.9),
    }

def beam_mat(name, color, strength=5.0, alpha=0.7):
    return mat(name, color, rough=0.5, emit=color, strength=strength, alpha=alpha)

# ---------------------------------------------------------------- géométrie
def _finish(obj, material=None, bevel=0.0, seg=3, smooth=False, angle=35):
    if material is not None:
        obj.data.materials.clear()
        obj.data.materials.append(material)
    if bevel > 0:
        m = obj.modifiers.new("bev", "BEVEL")
        m.width = bevel
        m.segments = seg
        m.limit_method = "ANGLE"
        m.angle_limit = math.radians(40)
    if smooth:
        select_only(obj)
        try:
            bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle))
        except Exception:
            try:
                bpy.ops.object.shade_smooth()
            except Exception:
                pass
    return obj

def box(name, size, loc=(0, 0, 0), material=None, bevel=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=[math.radians(r) for r in rot])
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    select_only(o)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, material, bevel, smooth=bevel > 0)

def cyl(name, r, depth, loc=(0, 0, 0), material=None, rot=(0, 0, 0), verts=48, bevel=0.0, fill="NGON"):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, vertices=verts, location=loc,
                                        rotation=[math.radians(x) for x in rot], end_fill_type=fill)
    o = bpy.context.active_object
    o.name = name
    return _finish(o, material, bevel, smooth=True)

def cone(name, r1, r2, depth, loc=(0, 0, 0), material=None, rot=(0, 0, 0), verts=48):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, vertices=verts, location=loc,
                                    rotation=[math.radians(x) for x in rot])
    o = bpy.context.active_object
    o.name = name
    return _finish(o, material, smooth=True)

def sphere(name, r, loc=(0, 0, 0), material=None, seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=seg // 2)
    o = bpy.context.active_object
    o.name = name
    return _finish(o, material, smooth=True)

def torus(name, R, r, loc=(0, 0, 0), material=None, rot=(0, 0, 0), maj=64, mino=16):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc,
                                     rotation=[math.radians(x) for x in rot],
                                     major_segments=maj, minor_segments=mino)
    o = bpy.context.active_object
    o.name = name
    return _finish(o, material, smooth=True)

def align_z(obj, p0, p1):
    """Oriente l'axe Z local de obj de p0 vers p1 et le place au milieu."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    obj.location = (p0 + p1) / 2
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    return d.length

def cyl_between(name, p0, p1, r, material=None, verts=32):
    L = (Vector(p1) - Vector(p0)).length
    o = cyl(name, r, L, material=material, verts=verts)
    align_z(o, p0, p1)
    return o

def beam(name, p0, p1, r, color="#e2372b", r_end=None, flat=1.0, flat_axis="y", opacity=0.85, speed=1.6, strength=6.0, from_start=False):
    """Faisceau laser : cylindre (ou cône si r_end) orienté de p0 vers p1.
    flat < 1 aplatit la section selon flat_axis (faisceau elliptique de diode)."""
    L = (Vector(p1) - Vector(p0)).length
    if r_end is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=L, vertices=40, end_fill_type="NOTHING")
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r_end, depth=L, vertices=48, end_fill_type="NOTHING")
    o = bpy.context.active_object
    o.name = name if name.startswith("beam") else "beam_" + name
    if flat != 1.0:
        o.scale = (flat, 1.0, 1.0) if flat_axis == "x" else (1.0, flat, 1.0)
        select_only(o)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(beam_mat("beam_" + color, color, strength=strength, alpha=0.6))
    if from_start:  # origine au point de départ (pour animer la longueur par l'échelle Z)
        for v in o.data.vertices:
            v.co.z += L / 2
    align_z(o, p0, p1)
    if from_start:
        o.location = Vector(p0)
    o["color"] = color
    o["opacity"] = opacity
    o["speed"] = speed
    try:
        o.visible_shadow = False
    except Exception:
        pass
    _finish(o, None, smooth=True)
    return o

def tube(name, pts, r, material=None, res=6, closed=False, smooth_curve=True):
    """Tube le long d'une liste de points (câbles, fibres) -> converti en maillage."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    cu.resolution_u = res
    if smooth_curve and len(pts) > 2:
        sp = cu.splines.new("NURBS")
        sp.points.add(len(pts) - 1)
        for i, p in enumerate(pts):
            sp.points[i].co = (p[0], p[1], p[2], 1)
        sp.use_endpoint_u = True
        sp.order_u = min(4, len(pts))
    else:
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        for i, p in enumerate(pts):
            sp.points[i].co = (p[0], p[1], p[2], 1)
    sp.use_cyclic_u = closed
    o = link(bpy.data.objects.new(name, cu))
    select_only(o)
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.active_object
    o.name = name
    return _finish(o, material, smooth=True)

def helix(name, R, pitch, turns, r, z0=0.0, center=(0, 0), material=None, pts_per_turn=48):
    pts = []
    n = int(turns * pts_per_turn)
    for i in range(n + 1):
        a = 2 * math.pi * i / pts_per_turn
        pts.append((center[0] + R * math.cos(a), center[1] + R * math.sin(a), z0 + pitch * i / pts_per_turn))
    return tube(name, pts, r, material, smooth_curve=False)

def shell_cylinder(name, r, h, thick, loc=(0, 0, 0), material=None, top=True, hole=0.0, verts=64):
    """Cylindre creux (capot, tube) avec dessus optionnellement percé (fenêtre)."""
    bm = bmesh.new()
    res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts, radius1=r, radius2=r, depth=h)
    # supprimer la face du bas (et du haut si top=False)
    faces = sorted([f for f in bm.faces if abs(f.normal.z) > 0.99], key=lambda f: f.calc_center_median().z)
    bottom, upper = faces[0], faces[-1]
    if hole > 0 and top:
        ins = bmesh.ops.inset_region(bm, faces=[upper], thickness=r - hole, depth=0)
        bmesh.ops.delete(bm, geom=[upper], context="FACES")
    elif not top:
        bmesh.ops.delete(bm, geom=[upper], context="FACES")
    bmesh.ops.delete(bm, geom=[bottom], context="FACES")
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = link(bpy.data.objects.new(name, me))
    o.location = loc
    s = o.modifiers.new("epaisseur", "SOLIDIFY")
    s.thickness = thick
    s.offset = -1
    return _finish(o, material, smooth=True)

# ---------------------------------------------------------------- organisation
def group(name, objs, loc=(0, 0, 0), explode=None, spin=None):
    """Empty parent (nœud glTF) qui regroupe des objets ; vue éclatée possible."""
    g = link(bpy.data.objects.new(name, None))
    g.empty_display_size = 1
    g.location = loc
    bpy.context.view_layer.update()
    for o in objs:
        mw = o.matrix_world.copy()
        o.parent = g
        o.matrix_world = mw
    if explode is not None:
        g["explode"] = list(explode)
    if spin is not None:          # ("x", vitesse en rad/s)
        g["spin_axis"] = str(spin[0])
        g["spin"] = float(spin[1])
    return g

def hotspot(name, loc, parent=None):
    e = link(bpy.data.objects.new(name if name.startswith("hs_") else "hs_" + name, None))
    e.empty_display_size = 0.5
    e.location = loc
    if parent is not None:
        bpy.context.view_layer.update()
        mw = e.matrix_world.copy()
        e.parent = parent
        e.matrix_world = mw
    return e

def array_holes(name, nx, ny, pitch, r, depth, z, material, x0=None, y0=None):
    """Grille de trous (breadboard) : un seul maillage joint."""
    objs = []
    x0 = -(nx - 1) * pitch / 2 if x0 is None else x0
    y0 = -(ny - 1) * pitch / 2 if y0 is None else y0
    for i in range(nx):
        for j in range(ny):
            objs.append(cyl(f"{name}_{i}_{j}", r, depth, (x0 + i * pitch, y0 + j * pitch, z), material, verts=16))
    select_only(objs[0])
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    return o

def join(name, objs):
    for o in objs:                      # appliquer les modificateurs (biseaux…) avant de fusionner
        if o.modifiers:
            select_only(o)
            bpy.ops.object.convert(target="MESH")
    select_only(objs[0])
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    return o

# ---------------------------------------------------------------- export
def export_glb(path, anim=False):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    kw = dict(filepath=os.path.abspath(path), export_format="GLB", export_extras=True, export_apply=True,
              export_yup=True, export_cameras=False, export_lights=False, export_animations=anim)
    try:
        bpy.ops.export_scene.gltf(**kw)
    except TypeError:
        kw.pop("export_lights", None)
        bpy.ops.export_scene.gltf(**kw)
    print("GLB_OK", path, os.path.getsize(path))

# ---------------------------------------------------------------- rendu « photo produit »
def _bbox(objs):
    pts = []
    for o in objs:
        if o.type != "MESH":
            continue
        pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx

def cleanup_render():
    """Supprime sol, caméra et lumières ajoutés par render() (pour un 2e rendu)."""
    for o in list(bpy.context.scene.objects):
        if o.name.startswith(("_sol", "cam", "soleil", "boite")):
            bpy.data.objects.remove(o, do_unlink=True)

def keep_only(names_prefix):
    """Supprime tous les objets sauf ceux (et leurs enfants) dont le nom commence par names_prefix."""
    keep = set()
    for o in bpy.context.scene.objects:
        if o.name.startswith(names_prefix):
            keep.add(o)
            keep.update(o.children_recursive)
    for o in list(bpy.context.scene.objects):
        if o not in keep:
            bpy.data.objects.remove(o, do_unlink=True)

def lay_down(axis="Y", deg=90):
    """Regroupe toute la scène sous un parent et la fait pivoter (pour la photo)."""
    tops = [o for o in bpy.context.scene.objects if o.parent is None]
    g = group("ROOT", tops)
    g.rotation_euler = {"X": (math.radians(deg), 0, 0), "Y": (0, math.radians(deg), 0), "Z": (0, 0, math.radians(deg))}[axis]
    bpy.context.view_layer.update()
    # reposer sur le sol (z min = 0)
    mn, mx = _bbox([o for o in bpy.context.scene.objects if o.type == "MESH" and not o.name.startswith("beam")])
    g.location.z -= mn.z
    bpy.context.view_layer.update()
    return g

def render(path, view=(1.0, -1.35, 0.85), w=1200, h=900, samples=96, focal=70, margin=1.12,
           target=None, sun_dir=(-0.55, -0.35, 0.75), exclude=("beam",), roll_deg=0.0, extra=(), beam_strength=5.0):
    """Rendu Cycles : fond transparent + ombre douce (shadow catcher), lumière d'après-midi chaude."""
    sc = bpy.context.scene
    bpy.context.view_layer.update()
    for m in bpy.data.materials:
        if m.name.startswith("beam_") and m.use_nodes:
            b = m.node_tree.nodes.get("Principled BSDF")
            if b:
                b.inputs["Emission Strength"].default_value = beam_strength
                b.inputs["Alpha"].default_value = 0.85
    objs = [o for o in sc.objects if o.type == "MESH" and not any(o.name.startswith(e) for e in exclude)]
    mn, mx = _bbox(objs)
    for p in extra:
        p = Vector(p)
        mn = Vector((min(mn.x, p.x), min(mn.y, p.y), min(mn.z, p.z)))
        mx = Vector((max(mx.x, p.x), max(mx.y, p.y), max(mx.z, p.z)))
    c = (mn + mx) / 2 if target is None else Vector(target)
    radius = (mx - mn).length / 2
    # sol « shadow catcher »
    bpy.ops.mesh.primitive_plane_add(size=radius * 40, location=(c.x, c.y, mn.z - radius * 0.002))
    floor = bpy.context.active_object
    floor.name = "_sol"
    floor.is_shadow_catcher = True
    # caméra
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = focal
    cam_data.sensor_width = 36
    cam = link(bpy.data.objects.new("cam", cam_data))
    fh = 2 * math.atan(cam_data.sensor_width / (2 * focal))
    aspect = w / h
    if aspect >= 1:   # le capteur couvre la largeur : l'angle vertical limite
        flim = 2 * math.atan(math.tan(fh / 2) / aspect)
    else:
        flim = 2 * math.atan(math.tan(fh / 2) * aspect)
    dist = radius / math.sin(flim / 2) * margin
    d = Vector(view).normalized()
    cam.location = c + d * dist
    cam.rotation_mode = "QUATERNION"
    q = (-d).to_track_quat("-Z", "Y")
    cam.rotation_quaternion = q
    if roll_deg:
        cam.rotation_mode = "XYZ"
        cam.rotation_euler.rotate_axis("Z", math.radians(roll_deg))
    cam_data.clip_start = dist / 200
    cam_data.clip_end = dist * 20
    sc.camera = cam
    # lumières : soleil chaud + grande boîte à lumière + rappel
    sun = link(bpy.data.objects.new("soleil", bpy.data.lights.new("soleil", "SUN")))
    sun.data.energy = 3.2
    sun.data.color = (1.0, 0.9, 0.78)
    sun.data.angle = math.radians(6)
    sun.rotation_mode = "QUATERNION"
    sun.rotation_quaternion = (-Vector(sun_dir)).to_track_quat("-Z", "Y")
    area = link(bpy.data.objects.new("boite", bpy.data.lights.new("boite", "AREA")))
    area.data.shape = "DISK"
    area.data.size = radius * 6
    area.data.energy = 900 * (radius ** 2) / 4
    area.data.color = (1.0, 0.97, 0.94)
    area.location = c + Vector((-1.2, -0.6, 1.6)).normalized() * dist * 0.8
    area.rotation_mode = "QUATERNION"
    area.rotation_quaternion = (c - area.location).to_track_quat("-Z", "Y")
    # monde : papier crème
    world = bpy.data.worlds.new("monde")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = hexc("#fdf3ea")
    bg.inputs[1].default_value = 0.65
    # réglages
    sc.render.engine = "CYCLES"
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        for dev in ("OPTIX", "CUDA"):
            try:
                prefs.compute_device_type = dev
                prefs.get_devices()
                if any(x.type == dev for x in prefs.devices):
                    for x in prefs.devices:
                        x.use = True
                    sc.cycles.device = "GPU"
                    print("RENDER_DEVICE", dev)
                    break
            except Exception:
                continue
    except Exception as e:
        print("GPU indisponible :", e)
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 8
    sc.cycles.transmission_bounces = 8
    sc.cycles.transparent_max_bounces = 12
    sc.render.film_transparent = True
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = 100
    try:  # couleurs : CP_VIEW / CP_LOOK / CP_EXPO permettent d'essayer d'autres rendus
        sc.view_settings.view_transform = os.environ.get("CP_VIEW", "Standard")
        sc.view_settings.look = os.environ.get("CP_LOOK", "None")
        sc.view_settings.exposure = float(os.environ.get("CP_EXPO", "-0.5"))
    except Exception as e:
        print("view transform :", e)
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.filepath = os.path.abspath(path)
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    bpy.ops.render.render(write_still=True)
    print("PNG_OK", path)
