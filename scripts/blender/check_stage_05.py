"""Independent immutable-geometry and educational segmentation checker."""

import hashlib
import json
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "models/xe215c/stage_05"
SOURCE = ROOT / "models/xe215c/stage_04/xe215c_stage_04.blend"
IDS = ("undercarriage", "upperstructure", "power-unit", "boom", "stick", "bucket",
       "boom-cylinder", "stick-cylinder", "bucket-cylinder")
NODES = ("NODE_UNDERCARRIAGE", "NODE_UPPERSTRUCTURE", "NODE_BOOM", "NODE_STICK", "NODE_BUCKET")
# Independently reviewed exact membership, not imported from the builder.
EXPECTED = {
    "undercarriage": set("left_track_blockout right_track_blockout left_crawler_frame right_crawler_frame central_x_frame slew_support slew_bearing_ring x_frame_left_gusset x_frame_right_gusset".split()) |
        {f"{side}_{part}" for side in ("left", "right") for part in
         "idler_wheel sprocket_wheel idler_hub sprocket_hub track_treads crawler_beam_cap road_roller_01 road_roller_02 road_roller_03 road_roller_04 road_roller_05 road_roller_06 road_roller_07 carrier_roller_01 carrier_roller_02".split()},
    "upperstructure": set("main_upper_platform cab counterweight boom_mounting_base cab_left_main_window cab_right_main_window cab_left_rear_window cab_right_rear_window cab_front_windshield cab_front_upper_glazing cab_roof_cap cab_lower_sill tower_pin_support_left tower_pin_support_right".split()),
    "power-unit": set("engine_body engine_right_service_panel engine_left_service_panel service_front_right_panel engine_top_access_panel".split()),
    "boom": set("boom boom_left_side_plate boom_right_side_plate boom_root_pin_boss".split()),
    "stick": set("stick stick_left_side_plate stick_right_side_plate stick_root_pin_boss".split()),
    "bucket": set("bucket bucket_left_cheek bucket_right_cheek bucket_cutting_edge bucket_root_pin_boss bucket_left_wear_rib bucket_right_wear_rib bucket_left_mount_ear bucket_right_mount_ear bucket_tooth_01 bucket_tooth_02 bucket_tooth_03 bucket_tooth_04 bucket_tooth_05".split()),
    **{kind + "-cylinder": {kind + "_cylinder_" + part for part in
        ("barrel", "rod", "gland", "end_base", "end_rod")} for kind in ("boom", "stick", "bucket")},
}
AUXILIARY = set("bucket_linkage_rocker bucket_linkage_connecting_link linkage_rocker_pin_boss linkage_input_pin_boss linkage_link_pin_boss linkage_bucket_pin_boss".split())


def source_hashes():
    files = [p for stage in range(1, 5) for p in (ROOT / f"models/xe215c/stage_{stage:02}").rglob("*") if p.is_file()]
    files += [p for p in (ROOT / "scripts/blender").glob("*.py") if p.name.startswith(("stage_01_", "stage_02_", "stage_03_", "stage_04_", "check_stage_01", "check_stage_02", "check_stage_03", "check_stage_04"))]
    return {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}


def matrix(m):
    return [list(row) for row in m]


def object_state(o):
    state = {"type": o.type, "data": o.data.name if o.data else None,
        "parent": o.parent.name if o.parent else None, "collections": sorted(c.name for c in o.users_collection),
        "world": matrix(o.matrix_world), "basis": matrix(o.matrix_basis), "parent_inverse": matrix(o.matrix_parent_inverse),
        "location": list(o.location), "rotation_mode": o.rotation_mode, "rotation_euler": list(o.rotation_euler),
        "scale": list(o.scale), "dimensions": list(o.dimensions), "color": list(o.color),
        "hide_render": o.hide_render, "hide_viewport": o.hide_viewport, "hide_select": o.hide_select,
        "hidden": o.hide_get(), "selected": o.select_get(), "display_type": o.display_type,
        "properties": {k: o[k] for k in o.keys() if not k.startswith("edu_")},
        "modifiers": [m.name for m in o.modifiers], "constraints": [c.name for c in o.constraints]}
    if o.type == "MESH":
        state["vertices"] = [list(v.co) for v in o.data.vertices]
        state["world_vertices"] = [list(o.matrix_world @ v.co) for v in o.data.vertices]
        state["edges"] = [list(e.vertices) for e in o.data.edges]
        state["polygons"] = [list(p.vertices) for p in o.data.polygons]
        state["smooth"] = [p.use_smooth for p in o.data.polygons]
        state["materials"] = [m.name if m else None for m in o.data.materials]
    return state


def counts(objects):
    meshes = [o for o in objects if o.type == "MESH"]
    for obj in meshes:
        obj.data.calc_loop_triangles()
    return {"object_count": len(objects), "mesh_count": len(meshes),
        "vertex_count": sum(len(o.data.vertices) for o in meshes),
        "triangle_count": sum(len(o.data.loop_triangles) for o in meshes)}


def capture_source():
    bpy.context.view_layer.update()
    scene = bpy.context.scene
    return {"objects": {o.name: object_state(o) for o in scene.objects},
        "counts": counts(list(scene.objects)), "hashes": source_hashes(),
        "all_objects": sorted(o.name for o in bpy.data.objects),
        "all_meshes": sorted(m.name for m in bpy.data.meshes),
        "collection_state": {c.name: {"objects": sorted(o.name for o in c.objects),
            "hide_render": c.hide_render, "hide_viewport": c.hide_viewport} for c in bpy.data.collections},
        "active_object": bpy.context.view_layer.objects.active.name if bpy.context.view_layer.objects.active else None,
        "render": {"engine": scene.render.engine, "camera": scene.camera.name,
            "resolution": [scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage],
            "filepath": scene.render.filepath, "color_type": scene.display.shading.color_type},
        "units": [scene.unit_settings.system, scene.unit_settings.scale_length]}


def extract_manifest():
    objects = list(bpy.context.scene.objects)
    components = []
    for component in IDS:
        members = sorted([o for o in objects if o.get("edu_component") == component], key=lambda o: o.name)
        meshes = [o for o in members if o.type == "MESH"]
        components.append({"id": component, "blender_objects": [o.name for o in members],
            "geometry_objects": [o.name for o in meshes],
            "technical_anchors": [o.name for o in members if o.type != "MESH"], **counts(members),
            "controlling_nodes": sorted({o.parent.name for o in members}),
            "object_control": {o.name: o.parent.name for o in members},
            "selectable": bool(meshes) and all(o.get("edu_selectable") for o in meshes),
            "renderable": bool(meshes) and all(o.get("edu_renderable") for o in meshes),
            "technical_anchors_selectable": False})
    auxiliaries = sorted([o for o in objects if o.get("edu_subsystem") == "bucket-linkage"], key=lambda o: o.name)
    technical = sorted([o.name for o in objects if o.get("edu_role") == "technical"])
    return {"schema_version": 1, "stage": "05", "machine_id": "excavator",
        "membership_authority": "Blender object custom properties; no export or application mapping",
        "components": components, "auxiliary_subsystems": [{"id": "bucket-linkage",
            "blender_objects": [o.name for o in auxiliaries], **counts(auxiliaries),
            "geometry_objects": [o.name for o in auxiliaries if o.type == "MESH"],
            "technical_anchors": [o.name for o in auxiliaries if o.type != "MESH"],
            "controlling_nodes": sorted({o.parent.name for o in auxiliaries}),
            "canonical_component": False, "selectable_educational_geometry": False}],
        "technical_objects": technical, "scene_geometry_counts": counts([o for o in objects if o.type == "MESH"]),
        "limitations": "Static uncoupled cylinders/linkage inherited; power-unit is an external service compartment, not engine internals."}


def validate(source, controls=None, write=False):
    bpy.context.view_layer.update()
    objects = list(bpy.context.scene.objects)
    ob = bpy.data.objects
    meshes = [o for o in objects if o.type == "MESH"]
    checks = {}

    def check(name, passed, **detail):
        checks[name] = {"pass": bool(passed), **detail}

    check("immutable_stages01_to04", source_hashes() == source["hashes"], file_count=len(source["hashes"]))
    check("unchanged_object_inventory", set(source["objects"]) == {o.name for o in objects} and
        source["all_objects"] == sorted(o.name for o in ob))
    check("unchanged_mesh_datablocks", source["all_meshes"] == sorted(m.name for m in bpy.data.meshes))
    errors = []
    for obj in objects:
        if object_state(obj) != source["objects"][obj.name]:
            errors.append(obj.name)
    check("all_geometry_topology_transforms_origins_parents_display_unchanged", not errors, changed_objects=errors)
    check("unchanged_collection_membership_visibility", source["collection_state"] ==
        {c.name: {"objects": sorted(o.name for o in c.objects), "hide_render": c.hide_render,
         "hide_viewport": c.hide_viewport} for c in bpy.data.collections})
    check("five_node_hierarchy", all(ob[n].type == "EMPTY" and
        (ob[n].parent.name if ob[n].parent else None) == (NODES[i-1] if i else None) for i, n in enumerate(NODES)))
    check("accepted_pivots", all(object_state(ob[n]) == source["objects"][n] for n in
        ("PIVOT_SLEW", "PIVOT_BOOM", "PIVOT_STICK", "PIVOT_BUCKET")))
    check("zero_neutral_rotations", all(Vector(ob[n].rotation_euler).length < 1e-7 for n in NODES))
    check("identity_scales_metric", source["units"] == ["METRIC", 1.0] and
        [bpy.context.scene.unit_settings.system, bpy.context.scene.unit_settings.scale_length] == source["units"] and
        all((o.scale - Vector((1, 1, 1))).length < 1e-7 for o in objects))
    actual_ids = {o.get("edu_component") for o in objects if o.get("edu_component")}
    check("exact_nine_ids", actual_ids == set(IDS))
    for component in IDS:
        members = {o.name for o in meshes if o.get("edu_component") == component}
        check("membership_" + component, members == EXPECTED[component], mesh_count=len(members))
        check("selectable_renderable_" + component, bool(members) and all(ob[n].get("edu_machine") == "excavator" and
            ob[n].get("edu_role") == "geometry" and ob[n].get("edu_selectable") is True and
            ob[n].get("edu_renderable") is True and not ob[n].hide_render and not ob[n].hide_select for n in members))
    check("auxiliary_linkage_exact", {o.name for o in meshes if o.get("edu_role") == "auxiliary"} == AUXILIARY and
        all(ob[n].get("edu_subsystem") == "bucket-linkage" and not ob[n].get("edu_component") and
            not ob[n].get("edu_selectable") and ob[n].get("edu_renderable") for n in AUXILIARY))
    unclassified = [o.name for o in meshes if not (o.get("edu_component") in IDS or
        (o.get("edu_role") == "auxiliary" and o.get("edu_subsystem") == "bucket-linkage"))]
    check("no_unclassified_major_meshes", not unclassified, count=len(unclassified))
    check("disjoint_canonical_membership", sum(len(v) for v in EXPECTED.values()) == len(set.union(*EXPECTED.values())) and
        not set.union(*EXPECTED.values()) & AUXILIARY and all(isinstance(o.get("edu_component"), str) for o in meshes if o.get("edu_component")))
    check("helpers_not_selectable_geometry", all(o.get("edu_role") == "technical" and
        o.get("edu_selectable") is False and o.get("edu_renderable") is False for o in objects if o.type != "MESH"))
    for kind in ("boom", "stick", "bucket"):
        check(kind + "_cylinder_anchors", all(ob[f"ANCHOR_{kind.upper()}_CYL_{end}"].get("edu_component") == kind + "-cylinder" for end in ("BASE", "ROD")))
    check("all_meshes_preserved_full_visible", set(source["objects"][n]["data"] for n in source["objects"] if source["objects"][n]["type"] == "MESH") ==
        {o.data.name for o in meshes} and all(not o.hide_render and not o.hide_get() for o in meshes))
    check("unchanged_counts", counts(objects) == source["counts"], **counts([o for o in objects if o.type == "MESH"]))
    check("no_actions_animation_armature_constraints_drivers", not bpy.data.actions and not bpy.context.scene.animation_data and
        all(not o.animation_data and not o.constraints and o.type != "ARMATURE" and
            not (o.data and o.data.animation_data) for o in objects))
    check("no_materials_textures_modifiers", all(not o.data.materials and not o.modifiers for o in meshes) and
        not any(i.source == "FILE" and i.filepath for i in bpy.data.images))
    manifest = extract_manifest()
    check("manifest_matches_scene", manifest == json.loads((OUT / "component_manifest.json").read_text(encoding="utf-8")))
    check("render_settings_restored", source["render"] == {"engine": bpy.context.scene.render.engine,
        "camera": bpy.context.scene.camera.name, "resolution": [bpy.context.scene.render.resolution_x,
            bpy.context.scene.render.resolution_y, bpy.context.scene.render.resolution_percentage],
        "filepath": bpy.context.scene.render.filepath, "color_type": bpy.context.scene.display.shading.color_type})
    check("active_selection_restored", source["active_object"] == (bpy.context.view_layer.objects.active.name if bpy.context.view_layer.objects.active else None))
    # Independently exercise metadata-only selection/visibility. No generator imports.
    state = {o.name: (o.hide_render, o.hide_get(), o.select_get()) for o in objects}
    active = bpy.context.view_layer.objects.active
    try:
        for component in IDS:
            members = {o for o in meshes if o.get("edu_component") == component}
            for obj in objects:
                obj.hide_set(False)
                obj.select_set(False)
            for obj in members:
                obj.select_set(True)
            check("independent_select_" + component, {o for o in objects if o.select_get()} == members)
            for obj in meshes:
                obj.hide_render = obj not in members
                obj.hide_set(obj not in members)
            check("independent_isolate_" + component, {o for o in meshes if not o.hide_render} == members and
                  {o for o in meshes if not o.hide_get()} == members)
    finally:
        for obj in objects:
            obj.hide_render, hidden, selected = state[obj.name]
            obj.hide_set(hidden)
            obj.select_set(selected)
        bpy.context.view_layer.objects.active = active
    if controls is not None:
        check("builder_select_highlight_hide_isolate", set(controls) == set(IDS) and
            all(all(record.values()) for record in controls.values()))
    failed = [n for n, v in checks.items() if not v["pass"]]
    if failed:
        raise AssertionError("Stage 05 failed: " + str(failed))
    report = {"stage": "05 educational segmentation", "blender_version": bpy.app.version_string,
        "source_sha256": source["hashes"], "checks": checks, "unclassified_major_mesh_count": len(unclassified),
        "scene_counts": counts(meshes), "component_counts": {c["id"]: {key: c[key] for key in
            ("object_count", "mesh_count", "vertex_count", "triangle_count")} for c in manifest["components"]},
        "geometry_world_error_m": 0, "control_exercises": controls,
        "objects": [{"name": o.name, "type": o.type, "collections": sorted(c.name for c in o.users_collection),
            "dimensions_m": list(o.dimensions), "world_origin_m": list(o.matrix_world.translation),
            "parent": o.parent.name if o.parent else None, "component": o.get("edu_component"),
            "role": o.get("edu_role"), "subsystem": o.get("edu_subsystem")} for o in sorted(objects, key=lambda o: o.name)]}
    if write:
        (OUT / "inspection.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: {len(checks)} checks; {len(meshes)} meshes; {counts(meshes)['triangle_count']} triangles; unclassified=0; geometry error=0 m")
    return report


def main():
    artifact = Path(bpy.data.filepath)
    assert artifact.name == "xe215c_stage_05.blend"
    saved = json.loads((OUT / "inspection.json").read_text(encoding="utf-8"))
    assert saved["source_sha256"] == source_hashes(), "Stages 01–04 input changed"
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    source = capture_source()
    bpy.ops.wm.open_mainfile(filepath=str(artifact))
    validate(source, saved["control_exercises"])
    print("PASS: reopened stage 05, source hashes and neutral/full-visible state")


if __name__ == "__main__":
    main()
