"""Compact opaque PBR assignment and Eevee preview over frozen stage 06."""

import importlib.util
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "models/xe215c/stage_07"
SOURCE = ROOT / "models/xe215c/stage_06/xe215c_stage_06.blend"
# Authored sRGB palette, generic industrial appearance, not manufacturer colors.
PALETTE = {
    "industrial_body_yellow": ((.94, .67, .08), .10, .43),
    "dark_chassis": ((.16, .18, .19), .35, .62),
    "track_dark": ((.105, .12, .13), .40, .78),
    "cab_glass_dark": ((.065, .105, .13), .05, .22),
    "hydraulic_dark": ((.22, .24, .25), .55, .42),
    "hydraulic_rod_metal": ((.72, .75, .78), 1.0, .23),
    "cutting_edge_steel": ((.32, .35, .37), .75, .55),
}


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def linear(value):
    return value/12.92 if value <= .04045 else ((value+.055)/1.055)**2.4


def material(name, color, metallic, roughness):
    mat = bpy.data.materials.new(name)
    mat["stage07_production"] = True
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    bsdf = mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    output = mat.node_tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf.location = (-220, 0)
    output.location = (100, 0)
    rgba = tuple(linear(c) for c in color)+(1,)
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Alpha"].default_value = 1
    bsdf.inputs["Transmission Weight"].default_value = 0
    mat.node_tree.links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    mat.diffuse_color = rgba
    mat.metallic, mat.roughness = metallic, roughness
    return mat


def assignment(obj):
    name, component = obj.name, obj.get("edu_component")
    if component == "undercarriage":
        return "track_dark" if name in ("left_track_blockout", "right_track_blockout", "left_track_treads", "right_track_treads") else "dark_chassis"
    if name in ("cab_left_main_window", "cab_right_main_window", "cab_left_rear_window",
                "cab_right_rear_window", "cab_front_windshield", "cab_front_upper_glazing"):
        return "cab_glass_dark"
    if component in ("boom-cylinder", "stick-cylinder", "bucket-cylinder"):
        return "hydraulic_rod_metal" if name.endswith("_cylinder_rod") else "hydraulic_dark"
    if obj.get("edu_subsystem") == "bucket-linkage":
        return "hydraulic_dark"
    if name in ("boom_root_pin_boss", "stick_root_pin_boss", "bucket_root_pin_boss",
                "tower_pin_support_left", "tower_pin_support_right"):
        return "hydraulic_dark"
    if name in ("bucket_cutting_edge", "bucket_left_wear_rib", "bucket_right_wear_rib") or name in {f"bucket_tooth_{i:02}" for i in range(1, 6)}:
        return "cutting_edge_steel"
    return "industrial_body_yellow"


def shade(obj):
    name = obj.name
    round_y = any(s in name for s in ("_roller_", "_idler_wheel", "_sprocket_wheel", "_idler_hub", "_sprocket_hub", "_pin_boss", "_pin_support_", "_cylinder_end_"))
    cylinder = any(name.endswith("_cylinder_"+s) for s in ("barrel", "rod", "gland"))
    for face in obj.data.polygons:
        if round_y:
            face.use_smooth = len(face.vertices) == 4 and abs(face.normal.y) < .5
        elif name == "slew_bearing_ring":
            face.use_smooth = len(face.vertices) == 4 and abs(face.normal.z) < .5
        elif cylinder:
            face.use_smooth = len(face.vertices) == 4
        # Accepted flat structural shells, glass panels and teeth stay flat.


def preview_setup():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 64
    scene.render.resolution_x, scene.render.resolution_y = 1400, 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure, scene.view_settings.gamma = 0, 1
    world = bpy.data.worlds.new("STAGE07_NEUTRAL_STUDIO")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (.12, .12, .12, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = .65
    scene.world = world
    collection = bpy.data.collections.new("60_MATERIAL_PREVIEW")
    scene.collection.children.link(collection)
    for label, location, energy, size in (("KEY", (4, 7, 9), 1700, 7),
            ("FILL", (0, -6, 5), 1300, 8), ("RIM", (-5, 1, 7), 1700, 6)):
        data = bpy.data.lights.new("STAGE07_LIGHT_"+label, "AREA")
        data.energy, data.shape, data.size = energy, "DISK", size
        obj = bpy.data.objects.new(data.name, data)
        collection.objects.link(obj)
        obj.location = location
        obj.rotation_euler = (Vector((.8, 0, 1.5))-obj.location).to_track_quat("-Z", "Y").to_euler()
        obj["edu_machine"] = "excavator"
        obj["edu_role"] = "technical"
        obj["edu_selectable"] = False
        obj["edu_renderable"] = False
    # Eevee reads PBR nodes; solid OBJECT colors preserve the stage 05 highlighter.
    scene.display.shading.color_type = "OBJECT"


def contact_sheet(phases):
    width, tile_w, image_h, tile_h = 1680, 560, 360, 400
    image = bpy.data.images.new("stage07_review_sheet", width=width, height=1200)
    pixels = [.6, .6, .6, 1] * (width*1200)
    glyphs = {
        "a":"01110/10001/10001/11111/10001/10001/10001", "d":"11110/10001/10001/10001/10001/10001/11110",
        "e":"11111/10000/10000/11110/10000/10000/11111", "f":"11111/10000/10000/11110/10000/10000/10000",
        "g":"01110/10001/10000/10111/10001/10001/01110", "h":"10001/10001/10001/11111/10001/10001/10001",
        "i":"11111/00100/00100/00100/00100/00100/11111", "l":"10000/10000/10000/10000/10000/10000/11111",
        "m":"10001/11011/10101/10101/10001/10001/10001", "n":"10001/11001/10101/10011/10001/10001/10001",
        "o":"01110/10001/10001/10001/10001/10001/01110", "p":"11110/10001/10001/11110/10000/10000/10000",
        "q":"01110/10001/10001/10001/10101/10010/01101", "r":"11110/10001/10001/11110/10100/10010/10001",
        "s":"01111/10000/10000/01110/00001/00001/11110", "t":"11111/00100/00100/00100/00100/00100/00100",
        "u":"10001/10001/10001/10001/10001/10001/01110", "3":"11110/00001/00001/01110/00001/00001/11110",
        "w":"10001/10001/10001/10101/10101/10101/01010",
        " ":"00000/00000/00000/00000/00000/00000/00000"}
    labels = ["left", "right", "front", "rear", "top", "3q front", "3q rear", "lifted", "slewed dump"]
    for number, (phase, label) in enumerate(zip(phases, labels)):
        source = bpy.data.images.load(str(OUT / "checkpoints" / (phase+".png")), check_existing=False)
        source.scale(tile_w, image_h)
        rgba = list(source.pixels)
        col, row = number%3, 2-number//3
        for y in range(image_h):
            begin = ((row*tile_h+y)*width+col*tile_w)*4
            pixels[begin:begin+tile_w*4] = rgba[y*tile_w*4:(y+1)*tile_w*4]
        for ci, character in enumerate(label):
            for gy, bits in enumerate(glyphs[character].split("/")):
                for gx, bit in enumerate(bits):
                    if bit == "1":
                        for yy in range(3):
                            for xx in range(3):
                                x, y = col*tile_w+16+ci*18+gx*3+xx, row*tile_h+image_h+8+(6-gy)*3+yy
                                k = (y*width+x)*4
                                pixels[k:k+4] = [.03, .03, .03, 1]
        bpy.data.images.remove(source)
    image.pixels = pixels
    image.filepath_raw = str(OUT / "material_contact_sheet.png")
    image.file_format = "PNG"
    image.save()
    bpy.data.images.remove(image)


def render():
    scene = bpy.context.scene
    folder = OUT / "checkpoints"
    folder.mkdir(parents=True, exist_ok=True)
    phases = ["left", "right", "front", "rear", "top", "three_quarter_front", "three_quarter_rear", "lifted", "slewed_dump"]
    for phase in phases:
        scene.frame_set(81 if phase == "lifted" else 166 if phase == "slewed_dump" else 0)
        scene.camera = bpy.data.objects["CAM_"+("three_quarter_front" if phase in ("lifted", "slewed_dump") else phase)]
        scene.render.filepath = str(folder / (phase+".png"))
        bpy.ops.render.render(write_still=True)
        print("STAGE07 checkpoint:", phase, flush=True)
    contact_sheet(phases)
    scene.frame_set(0)
    scene.camera = bpy.data.objects["CAM_three_quarter_front"]
    scene.render.filepath = str(folder / "three_quarter_front.png")


def main():
    checker = module("stage07_checker", "check_stage_07.py")
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    source = checker.capture_source()
    scene = bpy.context.scene
    scene.name = "XE215C_STAGE_07"
    materials = {name: material(name, *spec) for name, spec in PALETTE.items()}
    for obj in scene.objects:
        if obj.type == "MESH":
            obj.data.materials.clear()
            obj.data.materials.append(materials[assignment(obj)])
            obj.color = obj.data.materials[0].diffuse_color
            for polygon in obj.data.polygons:
                polygon.material_index = 0
            shade(obj)
    preview_setup()
    OUT.mkdir(parents=True, exist_ok=True)
    checker.validate(source, write=True)
    render()
    checker.validate(source, write=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "xe215c_stage_07.blend"))


if __name__ == "__main__":
    main()
