"""Independent rigid kinematic, animation and isolated transform-bake checks."""

import hashlib
import json
import math
import runpy
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "models/xe215c/stage_06"
SOURCE = ROOT / "models/xe215c/stage_05/xe215c_stage_05.blend"
NODES = ("NODE_UNDERCARRIAGE", "NODE_UPPERSTRUCTURE", "NODE_BOOM", "NODE_STICK", "NODE_BUCKET")
IDS = {"undercarriage", "upperstructure", "power-unit", "boom", "stick", "bucket",
       "boom-cylinder", "stick-cylinder", "bucket-cylinder"}
POSES = {"neutral": (0, 0, 0, 0), "digging": (0, -10, -20, 5), "filled": (0, -15, -25, 65),
    "lifted": (0, -30, -20, 75), "slewed": (60, -30, -20, 75),
    "dump": (60, -25, -10, 5), "returned": (0, -10, -20, 5)}
EPS = 1e-5  # 0.01 mm pin/axis/geometry tolerance; numerical visual rig, not certification.


def hashes():
    files = [p for i in range(1, 6) for p in (ROOT / f"models/xe215c/stage_{i:02}").rglob("*") if p.is_file()]
    files += [p for p in (ROOT / "scripts/blender").glob("*.py") if any(
        p.name.startswith(prefix + f"{i:02}") for prefix in ("stage_", "check_stage_") for i in range(1, 6))]
    return {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}


def points(obj):
    return [obj.matrix_world @ v.co for v in obj.data.vertices]


def capture_source():
    bpy.context.view_layer.update()
    return {"hashes": hashes(), "objects": {o.name: {"type": o.type,
        "parent": o.parent.name if o.parent else None, "basis": o.matrix_basis.copy(),
        "world": o.matrix_world.copy(), "meta": {k: o[k] for k in o.keys() if k.startswith("edu_")},
        "local": [v.co.copy() for v in o.data.vertices] if o.type == "MESH" else [],
        "world_vertices": points(o) if o.type == "MESH" else [],
        "faces": [tuple(p.vertices) for p in o.data.polygons] if o.type == "MESH" else [],
        "edges": [tuple(e.vertices) for e in o.data.edges] if o.type == "MESH" else []}
        for o in bpy.context.scene.objects}}


def set_pose(angles):
    for name, degrees in zip(NODES[1:], angles):
        bpy.data.objects[name].rotation_euler = (0, 0, 0)
        bpy.data.objects[name].rotation_euler[2 if name == NODES[1] else 1] = math.radians(degrees)
    bpy.context.view_layer.update()


def center(name):
    ps = points(bpy.data.objects[name])
    return sum(ps, Vector()) / len(ps)


def endpoints(name):
    ps = points(bpy.data.objects[name])
    n = len(ps)//2
    return sum(ps[:n], Vector())/n, sum(ps[n:], Vector())/n


def pose_check(source, label):
    ob = bpy.data.objects
    def pos(name):
        return ob[name].matrix_world.translation.copy()
    cylinders = {}
    for kind in ("boom", "stick", "bucket"):
        a, b = [pos(f"ANCHOR_{kind.upper()}_CYL_{part}") for part in ("BASE", "ROD")]
        ba, bb = endpoints(kind + "_cylinder_barrel")
        ra, rb = endpoints(kind + "_cylinder_rod")
        axis = (b-a).normalized()
        pin_error = max((ba-a).length, (rb-b).length,
            (center(kind + "_cylinder_end_base")-a).length, (center(kind + "_cylinder_end_rod")-b).length)
        line_error = max((bb-a).cross(axis).length, (ra-a).cross(axis).length,
            (rb-a).cross(axis).length)
        source_a = Vector(source["objects"][f"ANCHOR_{kind.upper()}_CYL_BASE"]["world"].translation)
        source_b = Vector(source["objects"][f"ANCHOR_{kind.upper()}_CYL_ROD"]["world"].translation)
        d0, d = (source_b-source_a).length, (b-a).length
        overlap = .66*d0 + .54*d0 - d
        assert pin_error < EPS and line_error < EPS, (label, kind, pin_error, line_error)
        assert abs((bb-ba).length-.66*d0) < EPS and abs((rb-ra).length-.54*d0) < EPS
        assert overlap > .02 and d > .69*d0+.01, (label, kind, "disconnected/over-compressed", overlap, d)
        cylinders[kind] = {"pin_error_m": pin_error, "axis_error_m": line_error,
            "length_m": d, "overlap_m": overlap, "extension_beyond_gland_m": d-.69*d0}
    o, l, b, i = [pos("ANCHOR_LINKAGE_"+s) for s in ("ROCKER_PIVOT", "LINK_PIN", "BUCKET_PIN", "CYL_PIN")]
    o0, l0, b0, i0 = [source["objects"]["ANCHOR_LINKAGE_"+s]["world"].translation for s in
                     ("ROCKER_PIVOT", "LINK_PIN", "BUCKET_PIN", "CYL_PIN")]
    r, length = (l0-o0).length, (b0-l0).length
    assert abs((l-o).length-r) < EPS and abs((b-l).length-length) < EPS
    assert abs((i-o).length-(i0-o0).length) < EPS
    inv = ob["NODE_STICK"].matrix_world.inverted()
    ol, ll, bl = [inv @ p for p in (o, l, b)]
    dx, dz = (bl-ol).x, (bl-ol).z
    distance = math.hypot(dx, dz)
    along = (r*r-length*length+distance*distance)/(2*distance)
    h2 = r*r-along*along
    branch = dx*(ll-ol).z-dz*(ll-ol).x
    assert h2 > .001 and branch < 0, (label, "unreachable/singular/branch flip", h2, branch)
    # Independent circle intersection reconstruction; never use rig solver properties.
    expected = ol + Vector(((along*dx+math.sqrt(h2)*dz)/distance, 0,
                            (along*dz-math.sqrt(h2)*dx)/distance))
    assert (ll-expected).length < EPS
    assert (i-pos("ANCHOR_BUCKET_CYL_ROD")).length < EPS
    assert max((center("linkage_"+s+"_pin_boss")-p).length for s, p in
               (("rocker", o), ("input", i), ("link", l), ("bucket", b))) < EPS
    link_obj = ob["bucket_linkage_connecting_link"]
    delta = link_obj.matrix_world @ source["objects"][link_obj.name]["world"].inverted()
    assert (delta @ l0-l).length < EPS and (delta @ b0-b).length < EPS
    primary_error = 0
    for name, old in source["objects"].items():
        obj = ob[name]
        if obj.type != "MESH":
            continue
        assert all(math.isfinite(c) for row in obj.matrix_world for c in row)
        assert (obj.scale-Vector((1, 1, 1))).length < EPS
        if obj.get("edu_component") in IDS - {"boom-cylinder", "stick-cylinder", "bucket-cylinder"}:
            node = old["parent"]
            delta = ob[node].matrix_world @ source["objects"][node]["world"].inverted()
            primary_error = max(primary_error, max((p-delta @ q).length for p, q in zip(points(obj), old["world_vertices"])))
    assert primary_error < EPS
    for name in ("PIVOT_SLEW", "PIVOT_BOOM", "PIVOT_STICK", "PIVOT_BUCKET"):
        old = source["objects"][name]
        expected = ob[old["parent"]].matrix_world @ source["objects"][old["parent"]]["world"].inverted() @ old["world"].translation
        assert (pos(name)-expected).length < EPS
    return {"cylinders": cylinders, "linkage_rocker_length_m": (l-o).length,
        "linkage_connecting_length_m": (b-l).length, "branch": "negative cross product",
        "singularity_margin_h_m": math.sqrt(h2), "primary_geometry_error_m": primary_error}


def gate_a(source, poses):
    assert poses == POSES
    state = []
    for name in NODES[1:]:
        obj = bpy.data.objects[name]
        if obj.animation_data and obj.animation_data.action:
            state.append((obj, obj.animation_data.action, obj.animation_data.action_slot))
            obj.animation_data.action = None
    result = {}
    try:
        for name, angles in POSES.items():
            set_pose(angles)
            result[name] = pose_check(source, name)
            if angles[0]:
                for obj in bpy.context.scene.objects:
                    if obj.get("edu_component") == "undercarriage":
                        assert max((p-q).length for p, q in zip(points(obj), source["objects"][obj.name]["world_vertices"])) < EPS
        set_pose(POSES["neutral"])
        error = max((p-q).length for name, data in source["objects"].items() if data["type"] == "MESH"
                    for p, q in zip(points(bpy.data.objects[name]), data["world_vertices"]))
        assert error < EPS, ("neutral geometry", error)
        result["neutral"]["stage05_full_geometry_error_m"] = error
    finally:
        set_pose(POSES["neutral"])
        for obj, action, slot in state:
            obj.animation_data.action, obj.animation_data.action_slot = action, slot
        if state:
            bpy.context.scene.frame_set(0)
    print(f"PASS Gate A: {len(result)} poses; neutral error {error:.9f} m")
    return result


def bake_test(keep_copy=False):
    scene = bpy.context.scene
    originals = [o for o in scene.objects if o.type == "MESH" or o.name.startswith(("NODE_", "RIG_", "ANCHOR_"))]
    old_actions = set(bpy.data.actions)
    baked_scene = bpy.data.scenes.new("STAGE06_BAKE_VALIDATION_COPY")
    copies = {}
    for obj in originals:
        copy = obj.copy()
        copy.animation_data_clear()
        copy.constraints.clear()
        copy.rotation_mode = "QUATERNION"
        baked_scene.collection.objects.link(copy)
        copies[obj.name] = copy
    for obj in originals:
        copies[obj.name].parent = copies.get(obj.parent.name) if obj.parent else None
        copies[obj.name].matrix_parent_inverse = Matrix.Identity(4)
    snapshots = {}
    sample_frames = list(range(0, 282, 7)) + [1, 41, 81, 131, 166, 191, 236, 281]
    try:
        for frame in range(282):
            scene.frame_set(frame)
            if frame in sample_frames:
                snapshots[frame] = {o.name: o.matrix_world.copy() for o in originals if o.type == "MESH"}
            for obj in originals:
                copy = copies[obj.name]
                basis = obj.parent.matrix_world.inverted() @ obj.matrix_world if obj.parent and obj.parent.name in copies else obj.matrix_world
                loc, rot, scale = basis.decompose()
                assert (scale-Vector((1, 1, 1))).length < EPS
                copy.location, copy.rotation_quaternion, copy.scale = loc, rot, (1, 1, 1)
                for path in ("location", "rotation_quaternion"):
                    copy.keyframe_insert(data_path=path, frame=frame)
        bpy.context.window.scene = baked_scene
        max_error = 0
        for frame, matrices in snapshots.items():
            baked_scene.frame_set(frame)
            bpy.context.view_layer.update()
            for name, expected in matrices.items():
                copy = copies[name]
                max_error = max(max_error, max((copy.matrix_world @ v.co - expected @ v.co).length for v in copy.data.vertices))
        assert max_error < EPS, ("bake error", max_error)
        assert all(not o.constraints and not (o.animation_data and o.animation_data.drivers) for o in copies.values())
    finally:
        bpy.context.window.scene = scene
        if not keep_copy:
            bpy.data.scenes.remove(baked_scene)
            for obj in copies.values():
                bpy.data.objects.remove(obj, do_unlink=True)
            for action in set(bpy.data.actions)-old_actions:
                bpy.data.actions.remove(action)
        scene.frame_set(0)
    return {"pass": True, "baked_integer_frames": 282, "comparison_frames": len(snapshots),
        "maximum_world_vertex_error_m": max_error, "constraints_drivers_removed_on_copy": True,
        "procedural_rig_retained": True, "retained_copy_scene": baked_scene.name if keep_copy else None,
        "method": "local location/quaternion keys per integer frame on isolated copies; identity scale, no scale animation"}


def validate(source, poses, write=False):
    scene = bpy.context.scene
    scene.frame_set(0)
    ob = bpy.data.objects
    checks = {}
    def check(name, value):
        checks[name] = bool(value)
        assert value, name
    check("source_stages01_to05_immutable", source["hashes"] == hashes())
    meshes = [o for o in scene.objects if o.type == "MESH"]
    check("inventory_101_meshes", len(meshes) == 101 and {o.name for o in meshes} ==
          {n for n, d in source["objects"].items() if d["type"] == "MESH"})
    triangles = 0
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
        d = source["objects"][obj.name]
        check("unchanged_mesh_"+obj.name, [v.co for v in obj.data.vertices] == d["local"] and
              [tuple(p.vertices) for p in obj.data.polygons] == d["faces"] and [tuple(e.vertices) for e in obj.data.edges] == d["edges"])
    check("7004_triangles", triangles == 7004)
    check("metadata_preserved", all({k: ob[n][k] for k in ob[n].keys() if k.startswith("edu_")} == d["meta"] for n, d in source["objects"].items()))
    check("nine_component_ids", {o.get("edu_component") for o in scene.objects if o.get("edu_component")} == IDS)
    check("five_node_chain", all((ob[n].parent.name if ob[n].parent else None) == (NODES[i-1] if i else None) for i, n in enumerate(NODES)))
    check("canonical_neutral_basis", all(max(abs(ob[n].matrix_basis[i][j]-source["objects"][n]["basis"][i][j]) for i in range(4) for j in range(4)) < EPS for n in NODES))
    check("main_mesh_parenting", all(ob[n].parent.name == d["parent"] for n, d in source["objects"].items() if d["type"] == "MESH" and ob[n].get("edu_component") in IDS-{"boom-cylinder", "stick-cylinder", "bucket-cylinder"}))
    check("metric_identity_scales", scene.unit_settings.system == "METRIC" and scene.unit_settings.scale_length == 1 and all((o.scale-Vector((1, 1, 1))).length < EPS for o in scene.objects))
    helpers = [o for o in scene.objects if o.name not in source["objects"]]
    check("new_helpers_technical", all(o.type == "EMPTY" and o.get("edu_machine") == "excavator" and o.get("edu_role") == "technical" and o.get("edu_selectable") is False and o.get("edu_renderable") is False for o in helpers))
    check("no_armature_materials_modifiers", not any(o.type == "ARMATURE" for o in scene.objects) and all(not o.data.materials and not o.modifiers for o in meshes))
    representative = gate_a(source, poses)
    check("representative_poses_and_reset", bool(representative))
    action = bpy.data.actions.get("excavator_work_cycle_demo")
    check("exact_clip", action is not None and len(action.slots) == 4 and all(ob[n].animation_data.action == action for n in NODES[1:]))
    curves = [c for layer in action.layers for strip in layer.strips for slot in action.slots for c in strip.channelbag(slot).fcurves]
    check("four_primary_channels_only", len(curves) == 4 and all(c.data_path == "rotation_euler" for c in curves))
    check("explicit_clip_range", action.use_frame_range and action.frame_start == 1 and action.frame_end == 281)
    check("loop_stationary_tangents", all(abs(k.handle_left.y-k.co.y) < EPS and abs(k.handle_right.y-k.co.y) < EPS
        for c in curves for k in c.keyframe_points if k.co.x in (1, 281)))
    check("drivers_valid", all(c.driver.is_valid for o in scene.objects if o.animation_data for c in o.animation_data.drivers))
    api = runpy.run_path(str(ROOT / "scripts/blender/stage_05_segmentation.py"))
    selection_checks = api["exercise_controls"]()
    check("stage05_select_highlight_hide_isolate", set(selection_checks) == IDS and
          all(all(v.values()) for v in selection_checks.values()))
    # Validate every integer animation frame, not only the authored key phases.
    frames = range(1, 282)
    animation = {}
    for frame in frames:
        scene.frame_set(frame)
        animation[str(frame)] = pose_check(source, f"frame {frame}")
    scene.frame_set(1)
    first = {o.name: o.matrix_world.copy() for o in meshes}
    scene.frame_set(281)
    check("loop_first_last", max(abs(o.matrix_world[i][j]-first[o.name][i][j]) for o in meshes for i in range(4) for j in range(4)) < EPS)
    bake = bake_test()
    check("isolated_bake_pass", bake["pass"])
    scene.frame_set(0)
    check("full_visible_rest", all(not o.hide_render and not o.hide_get() for o in meshes) and all(Vector(ob[n].rotation_euler).length < EPS for n in NODES))
    check("source_hashes_after_bake", source["hashes"] == hashes())
    report = {"stage": "06 visual kinematics and animation", "source_sha256": source["hashes"],
        "checks": checks, "mesh_count": len(meshes), "triangle_count": triangles,
        "pin_axis_tolerance_m": EPS, "geometry_edits": [], "anchor_position_edits": [],
        "reparented_objects": [{"name": n, "before": d["parent"], "after": ob[n].parent.name} for n, d in source["objects"].items() if ob[n].parent and ob[n].parent.name != d["parent"]],
        "representative_poses_deg": POSES, "gate_a": representative, "animation_frames": animation,
        "clip": {"name": action.name, "frames": [1, 281], "fps": 24, "rest_frame": 0, "timing": "illustrative only"},
        "bake_test": bake, "linkage": json.loads(scene["stage06_linkage"]),
        "limits": "Reconstructed visual mechanism; negative bucket-angle reach gap; no engineering collisions, hydraulic force, ground or productivity simulation."}
    if write:
        (OUT / "inspection.json").write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
    print(f"PASS: {len(checks)} checks; Gate A/B; 101 meshes/7004 triangles; bake error {bake['maximum_world_vertex_error_m']:.9f} m")
    return report


def main():
    artifact = Path(bpy.data.filepath)
    assert artifact.name == "xe215c_stage_06.blend"
    saved = json.loads((OUT / "inspection.json").read_text(encoding="utf-8"))
    assert hashes() == saved["source_sha256"]
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    source = capture_source()
    bpy.ops.wm.open_mainfile(filepath=str(artifact))
    validate(source, POSES)


if __name__ == "__main__":
    main()
