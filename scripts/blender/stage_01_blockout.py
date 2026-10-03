"""XE215C stage 01 only. Run: blender --background --python this_file.

Owned collections are rebuilt; unrelated scene objects are preserved. All mesh
coordinates are meters, scales stay identity. No rig, shaders, animation/export.
"""

import argparse
import csv
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "models" / "xe215c" / "stage_01"
PACK = ROOT / "models" / "XCMG_XE215C_MODEL_SHEET"
COLLECTIONS = (
    "00_GUIDES", "10_UNDERCARRIAGE", "20_UPPERSTRUCTURE",
    "30_WORKGROUP", "90_CHECKS",
)
OWNER = "xe215c_stage_01"


def master_dimensions():
    with (PACK / "blockout_dimensions.csv").open(encoding="utf-8-sig") as stream:
        rows = {r["parameter"]: float(r["value"]) for r in csv.DictReader(stream)}
    expected = {
        "Overall length": 9625, "Overall width": 2990, "Overall height": 3100,
        "Upper platform width": 2830, "Crawler overall length": 4255,
        "Track length on ground": 3462, "Crawler gauge": 2390,
        "Boom length": 5680, "Arm length": 2910,
        "Counterweight clearance": 1050, "Ground clearance": 485,
        "Min. tail swing radius": 2890,
    }
    for key, value in expected.items():
        if rows[key] != value:
            raise ValueError(f"Unexpected master value: {key}: {rows[key]}")
    config = json.loads((PACK / "meta/master.json").read_text(encoding="utf-8-sig"))
    assert config["master_configuration"]["operating_weight_kg"] == 21900
    # Explicit user override, not the optional 800 mm source configuration.
    expected["Track shoe width"] = 600
    return {key: value / 1000 for key, value in expected.items()}


D = master_dimensions()


def reset_owned():
    for obj in list(bpy.data.objects):
        if obj.get("stage_owner") == OWNER:
            data = obj.data
            bpy.data.objects.remove(obj, do_unlink=True)
            if data and data.users == 0:
                for registry in (bpy.data.meshes, bpy.data.curves, bpy.data.cameras):
                    if data.name in registry and registry[data.name] == data:
                        registry.remove(data)
                        break
    result = {}
    for name in COLLECTIONS:
        col = bpy.data.collections.get(name)
        if col is None:
            col = bpy.data.collections.new(name)
            bpy.context.scene.collection.children.link(col)
        elif col.get("stage_owner") != OWNER:
            raise ValueError(f"Collection name belongs to another asset: {name}")
        col["stage_owner"] = OWNER
        col.hide_render = name == "00_GUIDES"
        result[name] = col
    return result


def register(obj, collection):
    if obj.name in bpy.context.scene.objects:
        for col in list(obj.users_collection):
            col.objects.unlink(obj)
    COLS[collection].objects.link(obj)
    obj["stage_owner"] = OWNER
    return obj


def mesh(name, vertices, faces, collection, origin=(0, 0, 0), tone=0.62):
    if bpy.data.objects.get(name):
        raise ValueError(f"Object name collision: {name}")
    origin = Vector(origin)
    data = bpy.data.meshes.new(name + "_mesh")
    data.from_pydata([Vector(v) - origin for v in vertices], [], faces)
    data.update()
    obj = register(bpy.data.objects.new(name, data), collection)
    obj.location = origin
    obj.color = (tone, tone, tone, 1)
    # Recalculate normals without relying on selection or an active UI editor.
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data)
    bm.free()
    return obj


def profile(name, xz, ymin, ymax, collection, origin=(0, 0, 0), tone=0.62):
    n = len(xz)
    verts = [(x, y, z) for y in (ymin, ymax) for x, z in xz]
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    faces += [(i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)]
    return mesh(name, verts, faces, collection, origin, tone)


def plan_volume(name, xy, bottom, top, collection, tone=0.62, origin=(0, 0, 0)):
    n = len(xy)
    verts = [(x, y, z) for z in (bottom, top) for x, y in xy]
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    faces += [(i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)]
    return mesh(name, verts, faces, collection, origin=origin, tone=tone)


def box(name, lo, hi, collection, tone=0.62):
    return profile(name, [(lo[0], lo[2]), (hi[0], lo[2]),
                          (hi[0], hi[2]), (lo[0], hi[2])],
                   lo[1], hi[1], collection, tone=tone)


def empty(name, position, transverse=False):
    obj = register(bpy.data.objects.new(name, None), "00_GUIDES")
    obj.location = position
    obj.empty_display_type = "ARROWS"
    obj.empty_display_size = 0.35
    if transverse:
        obj.rotation_euler.x = math.pi / 2
    obj["axis_world"] = "Y" if transverse else "Z"
    return obj


def guide(name, points, value):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    spline = data.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points):
        p.co = (*co, 1)
    obj = register(bpy.data.objects.new(name, data), "00_GUIDES")
    obj["dimension_m"] = value
    obj.show_in_front = True
    obj.hide_render = True
    return obj


def build():
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1
    scene.unit_settings.length_unit = "METERS"
    scene["stage"] = "01 geometric blockout ONLY"
    scene["master_configuration"] = "21900 kg / 128.5 kW / 9625x2990x3100 mm"
    scene["shoe_override_mm"] = 600
    scene["pose"] = "Reconstructed canonical transport pose from master page 2"

    under = "10_UNDERCARRIAGE"
    upper = "20_UPPERSTRUCTURE"
    work = "30_WORKGROUP"
    length = D["Crawler overall length"]
    contact = D["Track length on ground"]
    # Faceted continuous profile: real contact segment, rising front idler and
    # rear drive regions. Height 0.88 m is a photograph-based reconstruction.
    xz = [(-contact / 2, 0), (contact / 2, 0), (length / 2 - .10, .20),
          (length / 2, .43), (length / 2 - .12, .68),
          (contact / 2, .86), (.8, .88), (-.8, .85),
          (-contact / 2, .84), (-length / 2 + .10, .66),
          (-length / 2, .42), (-length / 2 + .09, .19)]
    for side, y in (("left", 1.195), ("right", -1.195)):
        track = profile(f"{side}_track_blockout", xz, y - .3, y + .3,
                        under, (0, y, .44), .38)
        track["shoe_width_m"] = .6
        track["contact_length_m"] = contact
        track["front_region"] = "+X idler; -X sprocket/final drive"
        # Distinct beam inset within continuous track mass; no rollers/links.
        profile(f"{side}_crawler_frame",
                [(-1.65, .24), (1.65, .24), (1.72, .56),
                 (1.52, .70), (-1.50, .69), (-1.72, .54)],
                y - .22, y + .22, under, tone=.49)
    plan_volume("central_x_frame",
                [(-.95, -.43), (-1.40, -.94), (-.64, -.94), (0, -.62),
                 (.64, -.94), (1.4, -.94), (.95, -.43), (.95, .43),
                 (1.4, .94), (.64, .94), (0, .62), (-.64, .94),
                 (-1.4, .94), (-.95, .43)], .485, .77, under, .45)
    circle = [(math.cos(i * math.tau / 32) * .81,
               math.sin(i * math.tau / 32) * .81) for i in range(32)]
    plan_volume("slew_support", circle, .77, 1.05, under, .48)

    # Counterweight rear arc centered on slew axis: maximum radius 2.890 m.
    radius = D["Min. tail swing radius"]
    half_width = D["Upper platform width"] / 2
    a = math.asin(half_width / radius)
    arc = [(-radius * math.cos(t), radius * math.sin(t))
           for t in [-a + 2 * a * i / 12 for i in range(13)]]
    footprint = arc + [(1.45, half_width), (1.58, 1.25),
                       (1.58, -1.25), (1.45, -half_width)]
    plan_volume("main_upper_platform", footprint, 1.05, 1.30, upper, .51,
                origin=(0, 0, 1.05))
    # Large planes only. Rear corners follow tail envelope; no decorative trim.
    counter = arc + [(-2.13, half_width), (-2.13, -half_width)]
    cw = plan_volume("counterweight", counter, 1.05, 2.13, upper, .61)
    cw["shell_status"] = "P2 rear massing reconstruction, not CAD"
    profile("engine_body", [(-2.25, 1.30), (.65, 1.30), (.65, 2.10),
                            (.32, 2.30), (-2.12, 2.30), (-2.25, 2.16)],
            -1.36, 1.32, upper, tone=.64)
    # Cab on machine's left (+Y), front sloping windshield silhouette and roof.
    cab = profile("cab", [(-.62, 1.30), (1.53, 1.30), (1.53, 1.66),
                           (1.35, 2.78), (1.11, 3.10), (-.47, 3.10),
                           (-.65, 2.91)], .43, 1.405, upper, tone=.72)
    cab["shell_status"] = "P1 side/front faceted envelope; no windows/interior"
    profile("boom_mounting_base", [(.35, 1.30), (1.35, 1.30),
                                   (1.30, 1.74), (.86, 1.92), (.35, 1.72)],
            -.38, .38, upper, tone=.55)

    # Meter pivot lengths, solved pose. No scaling of the boom envelope.
    root = Vector((.75, 0, 1.48))
    # The folded stick head, rather than the boom cap, is the foremost point.
    # Solve pin pose with its fixed envelope instead of scaling any mesh.
    stick_dx = -math.sqrt(D["Arm length"] ** 2 - .90 ** 2)
    stick_head_margin = -.26 * stick_dx / D["Arm length"] + .24 * .90 / D["Arm length"]
    target_end_x = D["Overall length"] - radius - max(.12, stick_head_margin)
    dx = target_end_x - root.x
    dz = -math.sqrt(D["Boom length"] ** 2 - dx ** 2)
    end = root + Vector((dx, 0, dz))
    bucket_pivot = end + Vector((stick_dx, 0, -.90))
    empty("PIVOT_SLEW", (0, 0, 1.05))
    empty("PIVOT_BOOM", root, True)
    empty("PIVOT_STICK", end, True)
    empty("PIVOT_BUCKET", bucket_pivot, True)
    # Side-profile offsets relative to pivot chord. Broad knee near root and
    # taper to distal pin reproduce the bent welded box silhouette in P1/P2.
    chord = end - root
    outline = [(-.16, -.20), (.35, -.19), (1.35, .79), (2.0, 1.00),
               (3.35, .73), (5.25, -.02), (5.68, -.15),
               (5.68, .19), (5.2, .31), (3.25, 1.21),
               (2.05, 1.51), (1.52, 1.42), (.18, .26), (-.16, .16)]
    # Longitudinal offsets are expressed along chord, vertical shell offsets
    # reconstructed from photos; end cap max X extends 0.12 m past pivot.
    boom_xz = [(root.x + t * chord.x / 5.68, root.z + t * chord.z / 5.68 + h)
               for t, h in outline]
    boom_xz += [(end.x + .12, end.z + .13), (end.x + .12, end.z - .13)]
    # Insert distal cap into outline order rather than crossing the polygon.
    boom_xz = boom_xz[:7] + boom_xz[-2:][::-1] + boom_xz[7:-2]
    boom = profile("boom", boom_xz, -.255, .255, work, root, .68)
    boom["pivot_length_m"] = 5.68
    boom["length_basis"] = "Main root-to-stick pin centers; shell is reconstructed"

    v = (bucket_pivot - end).normalized()
    normal = Vector((-v.z, 0, v.x))
    stick_outline = [(-.26, -.26), (.18, -.32), (2.60, -.15), (2.91, -.13),
                     (3.04, 0), (2.91, .16), (2.55, .22), (.12, .38), (-.26, .24)]
    stick_xz = []
    for t, h in stick_outline:
        p = end + v * t + normal * h
        stick_xz.append((p.x, p.z))
    stick = profile("stick", stick_xz, -.22, .22, work, end, .59)
    stick["pivot_length_m"] = 2.91

    # Open scoop shell, separate side cheeks and lip, all sharing bucket origin.
    # Curvature is a controlled faceted strip, never a filled rectangular box.
    scoop = [(-.12, 0), (-.44, .29), (-.51, .73), (-.42, 1.07),
             (-.17, 1.38), (.35, 1.55), (.65, 1.57)]
    bx, bz = bucket_pivot.x, bucket_pivot.z
    thick = .065
    shell_profile = [(bx + x, bz + z) for x, z in scoop]
    shell_profile += [(bx + x + thick, bz + z - thick) for x, z in reversed(scoop)]
    profile("bucket", shell_profile, -.53, .53, work, bucket_pivot, .43)
    cheek = [(bx + x, bz + z) for x, z in scoop] + [(bx + .30, bz + .42), (bx + .10, bz + .04)]
    for side, y in (("left", .53), ("right", -.59)):
        profile(f"bucket_{side}_cheek", cheek, y, y + .06, work, bucket_pivot, .47)
    profile("bucket_cutting_edge", [(bx + .59, bz + 1.49), (bx + .78, bz + 1.57),
                                     (bx + .78, bz + 1.64), (bx + .60, bz + 1.63)],
            -.59, .59, work, bucket_pivot, .40)

    guide("DIM_overall_width_2.990m", [(0, -1.495, 0), (0, 1.495, 0)], 2.990)
    guide("DIM_overall_height_3.100m", [(0, 1.70, 0), (0, 1.70, 3.10)], 3.100)
    guide("DIM_crawler_length_4.255m", [(-2.1275, -1.70, 0), (2.1275, -1.70, 0)], 4.255)
    guide("DIM_contact_length_3.462m", [(-1.731, 1.70, 0), (1.731, 1.70, 0)], 3.462)
    for side, y in (("left", 1.195), ("right", -1.195)):
        guide(f"GUIDE_{side}_track_centerline", [(-2.4, y, .02), (2.4, y, .02)], y)
    guide("DIM_platform_width_2.830m", [(0, -1.415, 1.30), (0, 1.415, 1.30)], 2.830)
    guide("DIM_tail_radius_2.890m", [(radius * math.cos(i * math.tau / 64),
                                            radius * math.sin(i * math.tau / 64), 1.05)
                                           for i in range(65)], radius)
    guide("DIM_transport_length_9.625m", [(-radius, -1.85, 0), (6.735, -1.85, 0)], 9.625)
    guide("GUIDE_boom_pin_centers", [root, end], 5.680)
    guide("GUIDE_stick_pin_centers", [end, bucket_pivot], 2.910)
    bpy.context.view_layer.update()


def bounds(obj):
    points = [obj.matrix_world @ Vector(p) for p in obj.bound_box]
    return ([min(p[i] for p in points) for i in range(3)],
            [max(p[i] for p in points) for i in range(3)])


def inspect(write=True):
    """Compact inventory and assertions, also usable on a reopened checkpoint."""
    objects = [o for o in bpy.context.scene.objects if o.get("stage_owner") == OWNER]
    geometry = [o for o in objects if o.type == "MESH"]
    records = []
    for obj in sorted(objects, key=lambda o: o.name):
        if obj.type not in ("MESH", "EMPTY"):
            continue
        lo, hi = bounds(obj) if obj.type == "MESH" else (None, None)
        records.append({
            "name": obj.name, "type": obj.type,
            "collection": [c.name for c in obj.users_collection],
            "dimensions_m": list(obj.dimensions),
            "world_position_m": list(obj.matrix_world.translation),
            "origin_pivot_m": list(obj.matrix_world.translation),
            "parent": obj.parent.name if obj.parent else None,
            "bbox_world_m": {"min": lo, "max": hi},
        })
    checks = {}

    def near(name, actual, target):
        checks[name] = {"actual_m": actual, "target_m": target,
                        "pass": abs(actual - target) <= .005}

    ob = bpy.data.objects
    left, right = ob["left_track_blockout"], ob["right_track_blockout"]
    near("total_track_width", bounds(left)[1][1] - bounds(right)[0][1], 2.990)
    near("track_gauge", left.location.y - right.location.y, 2.390)
    for side in ("left", "right"):
        obj = ob[f"{side}_track_blockout"]
        near(f"{side}_track_width", obj.dimensions.y, .600)
        near(f"{side}_crawler_length", obj.dimensions.x, 4.255)
        # Actual lowest vertices, not just an asserted metadata value.
        ground = [obj.matrix_world @ v.co for v in obj.data.vertices
                  if abs((obj.matrix_world @ v.co).z) < 1e-6]
        near(f"{side}_ground_contact", max(p.x for p in ground) - min(p.x for p in ground), 3.462)
    g = ob["DIM_contact_length_3.462m"]
    near("contact_length_guide", (Vector(g.data.splines[0].points[1].co[:3]) -
                                  Vector(g.data.splines[0].points[0].co[:3])).length, 3.462)
    near("platform_width", ob["main_upper_platform"].dimensions.y, 2.830)
    near("boom_pin_distance", (ob["PIVOT_BOOM"].location - ob["PIVOT_STICK"].location).length, 5.680)
    near("stick_pin_distance", (ob["PIVOT_STICK"].location - ob["PIVOT_BUCKET"].location).length, 2.910)
    near("counterweight_clearance", bounds(ob["counterweight"])[0][2], 1.050)
    near("x_frame_clearance", bounds(ob["central_x_frame"])[0][2], .485)
    cw_points = [ob["counterweight"].matrix_world @ v.co for v in ob["counterweight"].data.vertices]
    near("tail_swing_radius", max(math.hypot(p.x, p.y) for p in cw_points), 2.890)
    model_bounds = [bounds(obj) for obj in geometry]
    lo = [min(b[0][i] for b in model_bounds) for i in range(3)]
    hi = [max(b[1][i] for b in model_bounds) for i in range(3)]
    near("transport_envelope_length", hi[0] - lo[0], 9.625)
    near("transport_envelope_height", hi[2] - lo[2], 3.100)
    checks["metric_identity_scale"] = {"pass":
        bpy.context.scene.unit_settings.system == "METRIC" and
        bpy.context.scene.unit_settings.scale_length == 1 and
        all(all(abs(s - 1) < 1e-6 for s in obj.scale) for obj in objects)}
    checks["independent_workgroup"] = {"pass": all(ob.get(n) and ob[n].type == "MESH"
                                                          for n in ("boom", "stick", "bucket"))}
    pivots = ["PIVOT_SLEW", "PIVOT_BOOM", "PIVOT_STICK", "PIVOT_BUCKET"]
    checks["four_pivots"] = {"pass": all(ob.get(n) and ob[n].type == "EMPTY" for n in pivots)}
    checks["transverse_pivot_axes"] = {"pass": all(
        abs((ob[n].rotation_euler.to_matrix() @ Vector((0, 0, 1))).y) > .999
        for n in pivots[1:])}
    checks["slew_world_axis"] = {"pass": ob["PIVOT_SLEW"].location.xy.length < 1e-6}
    checks["origins_match_pivots"] = {"pass": all(
        (ob[n].location - ob[p].location).length < 1e-6
        for n, p in (("boom", "PIVOT_BOOM"), ("stick", "PIVOT_STICK"),
                     ("bucket", "PIVOT_BUCKET"),
                     ("main_upper_platform", "PIVOT_SLEW")))}
    checks["no_800mm_track_shoe"] = {"pass": all(
        abs(o.dimensions.y - .600) < .005 and o.get("shoe_width_m") == .600
        for o in (left, right)) and not any(o.get("shoe_width_m") == .800 for o in objects)}
    checks["no_rig_animation_constraints_materials"] = {"pass": all(
        not o.animation_data and not o.constraints and o.type != "ARMATURE" and
        (o.type != "MESH" or not o.data.materials) for o in objects)}
    report = {"blender_version": bpy.app.version_string, "units": "meters",
              "master": D, "checks": checks, "objects": records,
              "machine_bbox_world_m": {"min": lo, "max": hi}}
    if write:
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / "inspection.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    failed = [name for name, result in checks.items() if not result["pass"]]
    if failed:
        raise AssertionError(f"Blockout inspection failed: {failed}")
    return report


def render_checkpoints():
    scene = bpy.context.scene
    # Solid viewport renderer: no authored materials or lights on model.
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.studiolight_rotate_z = .35
    shading.color_type = "OBJECT"
    shading.show_shadows = False
    shading.show_cavity = False
    shading.show_specular_highlight = False
    shading.background_type = "WORLD"
    scene.world.color = (.36, .36, .36)
    scene.view_settings.view_transform = "Standard"
    target = Vector((1.9225, 0, 1.55))
    views = {
        "left": (0, 1, 0), "right": (0, -1, 0),
        "front": (1, 0, 0), "rear": (-1, 0, 0), "top": (0, 0, 1),
        "three_quarter_front": (1, 1, .65),
        "three_quarter_rear": (-1, -1, .65),
    }
    folder = OUT / "checkpoints"
    folder.mkdir(parents=True, exist_ok=True)
    for name, direction in views.items():
        data = bpy.data.cameras.new("CAM_" + name)
        cam = register(bpy.data.objects.new("CAM_" + name, data), "90_CHECKS")
        cam.location = target + Vector(direction).normalized() * 24
        cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
        data.type = "ORTHO"
        # Same scale across all seven views; orthographic projection throughout.
        data.ortho_scale = 11.7
        scene.camera = cam
        scene.render.filepath = str(folder / (name + ".png"))
        bpy.ops.render.render(write_still=True)
    scene.camera = bpy.data.objects["CAM_three_quarter_front"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inspect-only", action="store_true")
    parser.add_argument("--skip-renders", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    if args.inspect_only:
        inspect()
        return
    # Dedicated scene keeps factory defaults and unrelated user content out of
    # the checkpoint without deleting them. Repeated calls reuse this scene.
    scene = bpy.data.scenes.get("XE215C_STAGE_01")
    if scene is None:
        scene = bpy.data.scenes.new("XE215C_STAGE_01")
        scene.world = bpy.data.worlds.new("XE215C_STAGE_01_world")
    bpy.context.window.scene = scene
    global COLS
    COLS = reset_owned()
    build()
    inspect()
    if not args.skip_renders:
        render_checkpoints()
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    bpy.data.objects["boom"].select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects["boom"]
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                area.spaces.active.region_3d.view_distance = 13
                area.spaces.active.region_3d.view_location = (1.5, 0, 1.5)
                area.spaces.active.clip_end = 1000
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "xe215c_stage_01.blend"))


if __name__ == "__main__":
    main()
