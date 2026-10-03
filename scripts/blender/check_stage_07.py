"""Frozen geometry/rig/action and compact material audit; no exporter invoked."""

import hashlib
import importlib.util
import json
import math
import runpy
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "models/xe215c/stage_07"
SOURCE = ROOT / "models/xe215c/stage_06/xe215c_stage_06.blend"
FRAMES = (0, 1, 13, 27, 41, 59, 81, 103, 131, 148, 166, 191, 209, 236, 253, 281)
EPS = 1e-5
MATERIALS = {"industrial_body_yellow", "dark_chassis", "track_dark", "cab_glass_dark",
             "hydraulic_dark", "hydraulic_rod_metal", "cutting_edge_steel"}


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


kin = module("stage06_regression", "check_stage_06.py")


def hashes():
    files = [p for i in range(1, 7) for p in (ROOT / f"models/xe215c/stage_{i:02}").rglob("*") if p.is_file()]
    files += [p for p in (ROOT / "scripts/blender").glob("*.py") if any(p.name.startswith(prefix+f"{i:02}")
        for prefix in ("stage_", "check_stage_") for i in range(1, 7))]
    return {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}


def serial(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, bpy.types.ID):
        return value.name
    return [serial(x) for x in value]


def constraint_config(constraint):
    return {p.identifier: serial(getattr(constraint, p.identifier)) for p in constraint.bl_rna.properties
            if not p.is_readonly and p.identifier != "rna_type"}


def drivers(obj):
    if not obj.animation_data:
        return []
    return [{"path": c.data_path, "index": c.array_index, "type": c.driver.type,
        "expression": c.driver.expression, "use_self": c.driver.use_self,
        "variables": [{"name": v.name, "type": v.type, "targets": [{"id": t.id.name if t.id else None,
            "path": t.data_path, "bone": t.bone_target, "transform": t.transform_type,
            "space": t.transform_space} for t in v.targets]} for v in c.driver.variables]}
        for c in obj.animation_data.drivers]


def action_signature():
    a = bpy.data.actions["excavator_work_cycle_demo"]
    return {"name": a.name, "range": [a.use_frame_range, a.frame_start, a.frame_end],
        "slots": [{"name": slot.identifier, "curves": [{"path": c.data_path, "index": c.array_index,
            "keys": [{"co": list(k.co), "left": list(k.handle_left), "right": list(k.handle_right),
                "left_type": k.handle_left_type, "right_type": k.handle_right_type,
                "interpolation": k.interpolation} for k in c.keyframe_points]}
            for layer in a.layers for strip in layer.strips for c in strip.channelbag(slot).fcurves]}
            for slot in a.slots]}


def capture_source():
    scene = bpy.context.scene
    scene.frame_set(0)
    source = kin.capture_source()
    source["hashes"] = hashes()
    source["rig"] = {o.name: {"constraints": [constraint_config(c) for c in o.constraints],
        "drivers": drivers(o), "rotation_mode": o.rotation_mode,
        "data": o.data.name if o.data else None} for o in scene.objects}
    source["action"] = action_signature()
    source["timing"] = [scene.frame_start, scene.frame_end, scene.render.fps, scene.render.fps_base]
    source["linkage_constants"] = scene["stage06_linkage"]
    source["cylinder_constants"] = scene["stage06_cylinders"]
    source["samples"] = {}
    for frame in FRAMES:
        scene.frame_set(frame)
        source["samples"][frame] = {o.name: o.matrix_world.copy() for o in scene.objects}
    scene.frame_set(0)
    source["smooth"] = {o.name: [p.use_smooth for p in o.data.polygons] for o in scene.objects if o.type == "MESH"}
    return source


def expected_material(obj):
    # Independent specification of assignment; not imported from generator.
    name, component = obj.name, obj.get("edu_component")
    tracks = {f"{side}_{part}" for side in ("left", "right") for part in ("track_blockout", "track_treads")}
    windows = set("cab_left_main_window cab_right_main_window cab_left_rear_window cab_right_rear_window cab_front_windshield cab_front_upper_glazing".split())
    fittings = set("boom_root_pin_boss stick_root_pin_boss bucket_root_pin_boss tower_pin_support_left tower_pin_support_right".split())
    steel = set("bucket_cutting_edge bucket_left_wear_rib bucket_right_wear_rib bucket_tooth_01 bucket_tooth_02 bucket_tooth_03 bucket_tooth_04 bucket_tooth_05".split())
    if name in tracks:
        return "track_dark"
    if component == "undercarriage":
        return "dark_chassis"
    if name in windows:
        return "cab_glass_dark"
    if name in {f"{kind}_cylinder_rod" for kind in ("boom", "stick", "bucket")}:
        return "hydraulic_rod_metal"
    if component in ("boom-cylinder", "stick-cylinder", "bucket-cylinder") or name in fittings or obj.get("edu_subsystem") == "bucket-linkage":
        return "hydraulic_dark"
    return "cutting_edge_steel" if name in steel else "industrial_body_yellow"


def validate(source, write=False):
    scene, ob = bpy.context.scene, bpy.data.objects
    scene.frame_set(0)
    meshes = [o for o in scene.objects if o.type == "MESH"]
    checks = {}
    def check(name, value, **details):
        checks[name] = {"pass": bool(value), **details}
        assert value, name
    check("stages01_to06_immutable", hashes() == source["hashes"], source_file_count=len(source["hashes"]))
    check("101_meshes_exact_inventory", len(meshes) == 101 and {o.name for o in meshes} == {n for n, d in source["objects"].items() if d["type"] == "MESH"})
    triangles, zero_area, smooth_changes, geometry_signatures = 0, [], {}, {}
    for obj in meshes:
        data = source["objects"][obj.name]
        check("geometry_"+obj.name, [v.co for v in obj.data.vertices] == data["local"] and
            [tuple(p.vertices) for p in obj.data.polygons] == data["faces"] and [tuple(e.vertices) for e in obj.data.edges] == data["edges"])
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
        for tri in obj.data.loop_triangles:
            a, b, c = [obj.data.vertices[i].co for i in tri.vertices]
            if (b-a).cross(c-a).length*.5 <= 1e-12:
                zero_area.append({"object": obj.name, "triangle": tri.index})
        changes = sum(a != b for a, b in zip(source["smooth"][obj.name], [p.use_smooth for p in obj.data.polygons]))
        if changes:
            smooth_changes[obj.name] = changes
        signature = hashlib.sha256(json.dumps({"verts": [list(v.co) for v in obj.data.vertices],
            "faces": [list(p.vertices) for p in obj.data.polygons]}).encode()).hexdigest()
        geometry_signatures.setdefault(signature, []).append(obj.name)
    check("7004_triangles", triangles == 7004)
    check("finite_geometry", all(math.isfinite(c) for o in meshes for v in o.data.vertices for c in v.co))
    check("no_zero_area_triangles", not zero_area, count=len(zero_area))
    check("unchanged_parents_and_metadata", all((ob[n].parent.name if ob[n].parent else None) == d["parent"] and
        {k: ob[n][k] for k in ob[n].keys() if k.startswith("edu_")} == d["meta"] for n, d in source["objects"].items()))
    check("exact_nine_ids", {o.get("edu_component") for o in scene.objects if o.get("edu_component")} == kin.IDS)
    unclassified = [o.name for o in meshes if not(o.get("edu_component") in kin.IDS or
        (o.get("edu_role") == "auxiliary" and o.get("edu_subsystem") == "bucket-linkage"))]
    check("no_unclassified_major_meshes", not unclassified, count=len(unclassified))
    check("complete_rig_frozen", all({"constraints": [constraint_config(c) for c in ob[n].constraints],
        "drivers": drivers(ob[n]), "rotation_mode": ob[n].rotation_mode,
        "data": ob[n].data.name if ob[n].data else None} == data for n, data in source["rig"].items()))
    check("linkage_cylinder_constants_frozen", scene["stage06_linkage"] == source["linkage_constants"] and scene["stage06_cylinders"] == source["cylinder_constants"])
    check("authored_action_keys_handles_slots_frozen", action_signature() == source["action"])
    check("clip_1_281_24fps", [scene.frame_start, scene.frame_end, scene.render.fps, scene.render.fps_base] == source["timing"] == [1, 281, 24, 1.0])
    regression = {}
    error = 0
    for frame in FRAMES:
        scene.frame_set(frame)
        regression[str(frame)] = kin.pose_check(source, "stage07 frame "+str(frame))
        for n, expected in source["samples"][frame].items():
            obj = ob[n]
            if obj.type == "MESH":
                error = max(error, max((obj.matrix_world @ v.co-expected @ v.co).length for v in obj.data.vertices))
            else:
                assert max(abs(obj.matrix_world[i][j]-expected[i][j]) for i in range(4) for j in range(4)) < EPS
    check("sampled_motion_identical_to_stage06", error < EPS, max_world_vertex_error_m=error, frames=list(FRAMES))
    scene.frame_set(1)
    first = {o.name: o.matrix_world.copy() for o in meshes}
    scene.frame_set(281)
    check("first_last_transform_match", max(abs(o.matrix_world[i][j]-first[o.name][i][j]) for o in meshes for i in range(4) for j in range(4)) < EPS)
    scene.frame_set(0)
    check("rest_frame0_and_original_pivots_anchors", all(Vector(ob[n].rotation_euler).length < EPS for n in kin.NODES) and
        all((ob[n].matrix_world.translation-d["world"].translation).length < EPS for n, d in source["objects"].items() if n.startswith(("PIVOT_", "ANCHOR_"))))
    check("drivers_constraints_valid", all(c.driver.is_valid for o in scene.objects if o.animation_data for c in o.animation_data.drivers) and
        all(c.is_valid for o in scene.objects for c in o.constraints))
    check("identity_metric_no_armature_modifiers", scene.unit_settings.system == "METRIC" and scene.unit_settings.scale_length == 1 and
        all((o.scale-Vector((1, 1, 1))).length < EPS and o.type != "ARMATURE" for o in scene.objects) and all(not o.modifiers for o in meshes))
    new = [o for o in scene.objects if o.name not in source["objects"]]
    check("only_technical_preview_lights_added", len(new) == 3 and all(o.type == "LIGHT" and o.get("edu_role") == "technical" and
        o.get("edu_machine") == "excavator" and o.get("edu_selectable") is False and o.get("edu_renderable") is False for o in new))
    production = [m for m in bpy.data.materials if m.get("stage07_production")]
    check("seven_production_materials", {m.name for m in production} == MATERIALS)
    check("no_unused_production_materials", all(any(m in tuple(o.data.materials) for o in meshes) for m in production))
    check("one_expected_slot_per_mesh", all(len(o.data.materials) == 1 and o.data.materials[0].name == expected_material(o) and all(p.material_index == 0 for p in o.data.polygons) for o in meshes))
    summaries = []
    for mat in sorted(production, key=lambda m: m.name):
        nodes = mat.node_tree.nodes
        bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
        output = next(n for n in nodes if n.type == "OUTPUT_MATERIAL")
        check("simple_opaque_PBR_"+mat.name, len(nodes) == 2 and len(mat.node_tree.links) == 1 and
            output.inputs["Surface"].links[0].from_node == bsdf and
            not output.inputs["Displacement"].is_linked and not output.inputs["Volume"].is_linked and
            bsdf.inputs["Alpha"].default_value == 1 and bsdf.inputs["Transmission Weight"].default_value == 0)
        summaries.append({"name": mat.name, "base_color_linear_rgba": list(bsdf.inputs["Base Color"].default_value),
            "metallic": bsdf.inputs["Metallic"].default_value, "roughness": bsdf.inputs["Roughness"].default_value,
            "mesh_count": sum(o.data.materials[0] == mat for o in meshes), "opaque": True, "nodes": 2})
    files = [i for i in bpy.data.images if i.source == "FILE"]
    check("no_external_images_or_missing_paths", not files and not any(n.type == "TEX_IMAGE" for m in production for n in m.node_tree.nodes), external_image_count=len(files))
    controls = runpy.run_path(str(ROOT / "scripts/blender/stage_05_segmentation.py"))["exercise_controls"]()
    check("stage05_select_highlight_hide_isolate", set(controls) == kin.IDS and all(all(r.values()) for r in controls.values()))
    check("solid_object_highlight_and_palette", scene.display.shading.color_type == "OBJECT" and
        all(max(abs(o.color[i]-o.data.materials[0].diffuse_color[i]) for i in range(4)) < 1e-7 for o in meshes))
    check("eevee_preview_and_visible_rest", scene.render.engine == "BLENDER_EEVEE" and scene.frame_current == 0 and all(not o.hide_render and not o.hide_get() for o in meshes))
    report = {"stage": "07 compact PBR and real-time audit", "blender_version": bpy.app.version_string,
        "source_sha256": source["hashes"], "checks": checks, "mesh_count": len(meshes),
        "vertex_count": sum(len(o.data.vertices) for o in meshes), "triangle_count": triangles,
        "production_material_count": len(production), "materials": summaries,
        "external_image_textures": 0, "geometry_edits": [], "smooth_face_changes": smooth_changes,
        "unclassified_major_meshes": unclassified, "zero_area_triangles": zero_area,
        "duplicate_geometry_datablock_groups": [names for names in geometry_signatures.values() if len(names)>1],
        "unique_mesh_datablocks": len({o.data.name for o in meshes}), "geometry_material_slots": sum(len(o.data.materials) for o in meshes),
        "baseline_mesh_material_primitives": len(meshes), "runtime_note": "Structural audit only; actual browser draw calls/fps and exported size are not measured. No export or merging.",
        "stage06_regression": regression, "clip": {"name": "excavator_work_cycle_demo", "frames": [1, 281], "fps": 24, "rest_frame": 0}}
    if write:
        (OUT / "inspection.json").write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
    print(f"PASS: {len(checks)} checks; 101 meshes/7004 triangles; seven PBR materials; textures=0; motion error {error:.9f} m")
    return report


def main():
    artifact = Path(bpy.data.filepath)
    assert artifact.name == "xe215c_stage_07.blend"
    saved = json.loads((OUT / "inspection.json").read_text(encoding="utf-8"))
    assert hashes() == saved["source_sha256"]
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    source = capture_source()
    bpy.ops.wm.open_mainfile(filepath=str(artifact))
    validate(source)


if __name__ == "__main__":
    main()
