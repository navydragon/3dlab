"""Explicit educational metadata over immutable stage 04 geometry."""

import importlib.util
import json
import sys
from pathlib import Path

import bpy

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "models/xe215c/stage_05"
SOURCE = ROOT / "models/xe215c/stage_04/xe215c_stage_04.blend"

# Authored membership, not a runtime name heuristic or export/application mapping.
COMPONENTS = {
    "undercarriage": ["left_track_blockout", "right_track_blockout",
        "left_crawler_frame", "right_crawler_frame", "central_x_frame", "slew_support",
        "slew_bearing_ring", "x_frame_left_gusset", "x_frame_right_gusset"] +
        [f"{side}_{part}" for side in ("left", "right") for part in
         ["idler_wheel", "sprocket_wheel", "idler_hub", "sprocket_hub",
          "track_treads", "crawler_beam_cap"] +
         [f"road_roller_{i:02}" for i in range(1, 8)] +
         [f"carrier_roller_{i:02}" for i in (1, 2)]],
    "upperstructure": ["main_upper_platform", "cab", "counterweight", "boom_mounting_base",
        "cab_left_main_window", "cab_right_main_window", "cab_left_rear_window",
        "cab_right_rear_window", "cab_front_windshield", "cab_front_upper_glazing",
        "cab_roof_cap", "cab_lower_sill", "tower_pin_support_left", "tower_pin_support_right"],
    "power-unit": ["engine_body", "engine_right_service_panel", "engine_left_service_panel",
        "service_front_right_panel", "engine_top_access_panel"],
    "boom": ["boom", "boom_left_side_plate", "boom_right_side_plate", "boom_root_pin_boss"],
    "stick": ["stick", "stick_left_side_plate", "stick_right_side_plate", "stick_root_pin_boss"],
    "bucket": ["bucket", "bucket_left_cheek", "bucket_right_cheek", "bucket_cutting_edge",
        "bucket_root_pin_boss", "bucket_left_wear_rib", "bucket_right_wear_rib",
        "bucket_left_mount_ear", "bucket_right_mount_ear"] + [f"bucket_tooth_{i:02}" for i in range(1, 6)],
    **{f"{kind}-cylinder": [f"{kind}_cylinder_{part}" for part in
        ("barrel", "rod", "gland", "end_base", "end_rod")] for kind in ("boom", "stick", "bucket")},
}
LINKAGE = ["bucket_linkage_rocker", "bucket_linkage_connecting_link",
    "linkage_rocker_pin_boss", "linkage_input_pin_boss", "linkage_link_pin_boss", "linkage_bucket_pin_boss"]


def component_geometry(component):
    """Query stable metadata, never object-name prefixes; excludes technical anchors."""
    return sorted([o for o in bpy.context.scene.objects if o.type == "MESH" and
        o.get("edu_machine") == "excavator" and o.get("edu_component") == component and
        o.get("edu_selectable")], key=lambda o: o.name)


def select_component(component):
    bpy.ops.object.select_all(action="DESELECT")
    members = component_geometry(component)
    if not members:
        raise ValueError(component)
    for obj in members:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = members[0]
    return members


def highlight_component(component, color=(0.85, 0.52, 0.16, 1)):
    """Transient Workbench OBJECT color; caller restores returned colors."""
    members = component_geometry(component)
    previous = {o.name: tuple(o.color) for o in members}
    for obj in members:
        obj.color = color
    return previous


def hide_component(component, hidden=True):
    members = component_geometry(component)
    for obj in members:
        obj.hide_render = hidden
        obj.hide_set(hidden)


def isolate_component(component):
    members = set(component_geometry(component))
    if not members:
        raise ValueError(component)
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.hide_render = obj not in members
            obj.hide_set(obj not in members)


def module(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(file))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def annotate():
    assigned = set()
    for component, names in COMPONENTS.items():
        for name in names:
            assert name not in assigned, name
            assigned.add(name)
            obj = bpy.context.scene.objects[name]
            assert obj.type == "MESH"
            obj["edu_machine"] = "excavator"
            obj["edu_component"] = component
            obj["edu_role"] = "geometry"
            obj["edu_selectable"] = True
            obj["edu_renderable"] = True
    for obj in bpy.context.scene.objects:
        if obj.name in assigned:
            continue
        if obj.name in LINKAGE:
            obj["edu_machine"] = "excavator"
            obj["edu_role"] = "auxiliary"
            obj["edu_subsystem"] = "bucket-linkage"
            obj["edu_selectable"] = False
            obj["edu_renderable"] = True
        elif obj.type == "MESH":
            raise AssertionError("Unclassified geometry: " + obj.name)
        else:
            obj["edu_machine"] = "excavator"
            obj["edu_role"] = "technical"
            obj["edu_selectable"] = False
            obj["edu_renderable"] = False
    for kind in ("boom", "stick", "bucket"):
        for end in ("BASE", "ROD"):
            obj = bpy.data.objects[f"ANCHOR_{kind.upper()}_CYL_{end}"]
            obj["edu_component"] = kind + "-cylinder"
    for end in ("ROCKER_PIVOT", "CYL_PIN", "LINK_PIN", "BUCKET_PIN"):
        bpy.data.objects["ANCHOR_LINKAGE_" + end]["edu_subsystem"] = "bucket-linkage"
    bpy.context.scene["edu_schema_version"] = 1
    bpy.context.scene["edu_machine"] = "excavator"
    bpy.context.scene.name = "XE215C_STAGE_05"


def exercise_controls():
    objects = list(bpy.context.scene.objects)
    state = {o.name: (o.hide_render, o.hide_get(), tuple(o.color), o.select_get()) for o in objects}
    active = bpy.context.view_layer.objects.active
    evidence = {}
    try:
        for component in COMPONENTS:
            for obj in objects:
                obj.hide_render = state[obj.name][0]
                obj.hide_set(state[obj.name][1])
            members = set(select_component(component))
            assert {o for o in objects if o.select_get()} == members
            previous = highlight_component(component)
            assert all(max(abs(o.color[i] - value) for i, value in enumerate((.85, .52, .16, 1))) < 1e-6 for o in members)
            assert all(tuple(o.color) == state[o.name][2] for o in objects if o not in members)
            for name, color in previous.items():
                bpy.data.objects[name].color = color
            hide_component(component)
            assert all(o.hide_render and o.hide_get() for o in members)
            hide_component(component, False)
            isolate_component(component)
            assert {o for o in objects if o.type == "MESH" and not o.hide_render} == members
            assert {o for o in objects if o.type == "MESH" and not o.hide_get()} == members
            evidence[component] = {"selection": True, "highlight": True, "hide": True, "isolation": True}
    finally:
        for obj in objects:
            obj.hide_render, hidden, obj.color, selected = state[obj.name]
            obj.hide_set(hidden)
            obj.select_set(selected)
        bpy.context.view_layer.objects.active = active
    return evidence


def render():
    scene = bpy.context.scene
    folder = OUT / "checkpoints"
    folder.mkdir(parents=True, exist_ok=True)
    objects = list(scene.objects)
    state = {o.name: (o.hide_render, o.hide_get()) for o in objects}
    old_camera, old_path = scene.camera, scene.render.filepath
    try:
        scene.camera = bpy.data.objects["CAM_three_quarter_front"]
        scene.render.filepath = str(folder / "neutral_overview.png")
        bpy.ops.render.render(write_still=True)
        for component in COMPONENTS:
            isolate_component(component)
            scene.render.filepath = str(folder / (component + ".png"))
            bpy.ops.render.render(write_still=True)
    finally:
        for obj in objects:
            obj.hide_render, hidden = state[obj.name]
            obj.hide_set(hidden)
        scene.camera, scene.render.filepath = old_camera, old_path


def main():
    checker = module("stage05_checker", "check_stage_05.py")
    hashes = checker.source_hashes()
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    source = checker.capture_source()
    annotate()
    controls = exercise_controls()
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = checker.extract_manifest()
    (OUT / "component_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    checker.validate(source, controls, write=True)
    render()
    checker.validate(source, controls, write=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "xe215c_stage_05.blend"))
    assert hashes == checker.source_hashes()


if __name__ == "__main__":
    main()
