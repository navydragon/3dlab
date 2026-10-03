"""Rigid visual hydraulic/linkage coupling and one illustrative work-cycle clip."""

import importlib.util
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "models/xe215c/stage_06"
SOURCE = ROOT / "models/xe215c/stage_05/xe215c_stage_05.blend"
CLIP = "excavator_work_cycle_demo"
# (slew Z, boom Y, stick Y, bucket Y), degrees; illustrative, not machine limits.
POSES = {"neutral": (0, 0, 0, 0), "digging": (0, -10, -20, 5),
    "filled": (0, -15, -25, 65), "lifted": (0, -30, -20, 75),
    "slewed": (60, -30, -20, 75), "dump": (60, -25, -10, 5),
    "returned": (0, -10, -20, 5)}
KEYS = [(1, "digging"), (41, "filled"), (81, "lifted"), (131, "slewed"),
        (166, "dump"), (191, "dump"), (236, "lifted"), (281, "returned")]
NODES = ("NODE_UPPERSTRUCTURE", "NODE_BOOM", "NODE_STICK", "NODE_BUCKET")
SAFE_RANGES = ((-180, 180), (-30, 0), (-25, 0), (0, 75))


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def technical(name, parent=None, world=None):
    obj = bpy.data.objects.new(name, None)
    bpy.data.collections["50_KINEMATIC_RIG"].objects.link(obj)
    obj["edu_machine"] = "excavator"
    obj["edu_role"] = "technical"
    obj["edu_selectable"] = False
    obj["edu_renderable"] = False
    obj.hide_render = True
    obj.empty_display_size = .1
    obj.empty_display_type = "PLAIN_AXES"
    if parent:
        obj.parent = parent
    if world is not None:
        obj.matrix_world = world
    bpy.context.view_layer.update()
    return obj


def keep_world(obj, parent):
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.matrix_basis = parent.matrix_world.inverted() @ world
    bpy.context.view_layer.update()


def driver(obj, path, expression, variables, index=None):
    curve = obj.driver_add(path) if index is None else obj.driver_add(path, index)
    drv = curve.driver
    drv.type = "SCRIPTED"
    drv.expression = expression
    for name, (target, data_path) in variables.items():
        var = drv.variables.new()
        var.name = name
        var.type = "SINGLE_PROP"
        var.targets[0].id = target
        var.targets[0].data_path = data_path
    return curve


def linkage():
    ob = bpy.data.objects
    stick = ob["NODE_STICK"]
    inverse = stick.matrix_world.inverted()
    def point(name):
        return inverse @ ob[name].matrix_world.translation
    o, l, b, i = [point("ANCHOR_LINKAGE_" + name) for name in
                  ("ROCKER_PIVOT", "LINK_PIN", "BUCKET_PIN", "CYL_PIN")]
    p = inverse @ ob["PIVOT_BUCKET"].matrix_world.translation
    d = b - o
    radius, length = (l-o).length, (b-l).length
    branch = 1 if d.x*(l-o).z - d.z*(l-o).x > 0 else -1
    solver = technical("RIG_LINK_SOLVER", stick)
    constants = {"ox": o.x, "oz": o.z, "px": p.x, "pz": p.z,
                 "bx": b.x-p.x, "bz": b.z-p.z, "r": radius, "length": length,
                 "branch": branch, "rocker_angle0": math.atan2((l-o).z, (l-o).x),
                 "link_angle0": math.atan2((b-l).z, (b-l).x)}
    for key, value in constants.items():
        solver[key] = value
    for key in ("dx", "dz", "distance", "a", "h", "lx", "lz", "rocker_angle", "link_angle"):
        solver[key] = 0.0
    def vars(*names):
        return {name: (solver, f'["{name}"]') for name in names}
    q = {"q": (ob["NODE_BUCKET"], "rotation_euler[1]")}
    driver(solver, '["dx"]', "px+cos(q)*bx+sin(q)*bz-ox", {**vars("px", "bx", "bz", "ox"), **q})
    driver(solver, '["dz"]', "pz-sin(q)*bx+cos(q)*bz-oz", {**vars("pz", "bx", "bz", "oz"), **q})
    driver(solver, '["distance"]', "sqrt(dx*dx+dz*dz)", vars("dx", "dz"))
    driver(solver, '["a"]', "(r*r-length*length+distance*distance)/(2*distance)", vars("r", "length", "distance"))
    # Clamp only protects float roundoff; checker explicitly rejects unreachable h².
    driver(solver, '["h"]', "sqrt(max(r*r-a*a,0))", vars("r", "a"))
    driver(solver, '["lx"]', "ox+(a*dx-branch*h*dz)/distance", vars("ox", "a", "dx", "branch", "h", "dz", "distance"))
    driver(solver, '["lz"]', "oz+(a*dz+branch*h*dx)/distance", vars("oz", "a", "dx", "branch", "h", "dz", "distance"))
    driver(solver, '["rocker_angle"]', "rocker_angle0-atan2(lz-oz,lx-ox)", vars("rocker_angle0", "lz", "oz", "lx", "ox"))
    driver(solver, '["link_angle"]', "link_angle0-atan2(oz+dz-lz,ox+dx-lx)", vars("link_angle0", "oz", "dz", "lz", "ox", "dx", "lx"))
    rocker = technical("RIG_LINKAGE_ROCKER", stick, Matrix.Translation(stick.matrix_world @ o))
    link = technical("RIG_LINKAGE_CONNECTING_LINK", stick, Matrix.Translation(stick.matrix_world @ l))
    # At neutral all parent axes are aligned; helpers' local Y is transverse.
    driver(rocker, "rotation_euler", "angle", {"angle": (solver, '["rocker_angle"]')}, 1)
    driver(link, "location", "lx", vars("lx"), 0)
    driver(link, "location", "lz", vars("lz"), 2)
    driver(link, "rotation_euler", "angle", {"angle": (solver, '["link_angle"]')}, 1)
    bpy.context.view_layer.update()
    for name in ("bucket_linkage_rocker", "linkage_rocker_pin_boss", "linkage_input_pin_boss",
                 "linkage_link_pin_boss", "ANCHOR_LINKAGE_CYL_PIN", "ANCHOR_LINKAGE_LINK_PIN", "ANCHOR_BUCKET_CYL_ROD"):
        keep_world(ob[name], rocker)
    keep_world(ob["bucket_linkage_connecting_link"], link)
    return constants


def hydraulics():
    ob = bpy.data.objects
    records = {}
    for kind in ("boom", "stick", "bucket"):
        base, end = [ob[f"ANCHOR_{kind.upper()}_CYL_{part}"] for part in ("BASE", "ROD")]
        a, b = base.matrix_world.translation.copy(), end.matrix_world.translation.copy()
        direction = (b-a).normalized()
        # Rigid orientation in the local XZ plane, with Y retained as pin axis.
        basis = Matrix.Rotation(math.atan2(direction.x, direction.z), 4, "Y")
        for part, anchor in (("BARREL", base), ("ROD", end)):
            world = basis.copy()
            world.translation = anchor.matrix_world.translation
            helper = technical(f"RIG_{kind.upper()}_{part}", base.parent, world)
            loc = helper.constraints.new("COPY_LOCATION")
            loc.target = anchor
            aim = helper.constraints.new("LOCKED_TRACK")
            aim.target = end if part == "BARREL" else base
            aim.track_axis = "TRACK_Z" if part == "BARREL" else "TRACK_NEGATIVE_Z"
            aim.lock_axis = "LOCK_Y"
            bpy.context.view_layer.update()
            names = ("barrel", "gland", "end_base") if part == "BARREL" else ("rod", "end_rod")
            for suffix in names:
                keep_world(ob[f"{kind}_cylinder_{suffix}"], helper)
        records[kind] = {"neutral_length_m": (b-a).length,
            "barrel_length_m": (b-a).length*.66, "rod_length_m": (b-a).length*.54,
            "gland_outer_end_m": (b-a).length*.69}
    return records


def set_pose(angles):
    if len(angles) != 4 or any(not math.isfinite(value) or not low <= value <= high
                              for value, (low, high) in zip(angles, SAFE_RANGES)):
        raise ValueError("Outside illustrative tested visual envelope: " + str(SAFE_RANGES))
    for name, degrees in zip(NODES, angles):
        obj = bpy.data.objects[name]
        obj.rotation_euler = (0, 0, 0)
        obj.rotation_euler[2 if name == NODES[0] else 1] = math.radians(degrees)
    bpy.context.view_layer.update()


def create_clip():
    scene = bpy.context.scene
    scene.frame_start, scene.frame_end = 1, 281
    scene.render.fps = 24
    action = bpy.data.actions.new(CLIP)
    for name in NODES:
        obj = bpy.data.objects[name]
        obj.animation_data_create()
        obj.animation_data.action = action
        slot = action.slots.new(id_type="OBJECT", name=name)
        obj.animation_data.action_slot = slot
        axis = 2 if name == NODES[0] else 1
        for frame, pose in KEYS:
            obj.rotation_euler[axis] = math.radians(POSES[pose][NODES.index(name)])
            obj.keyframe_insert(data_path="rotation_euler", index=axis, frame=frame, group=name)
    for layer in action.layers:
        for strip in layer.strips:
            for slot in action.slots:
                bag = strip.channelbag(slot)
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = "BEZIER"
                        key.handle_left_type = key.handle_right_type = "AUTO_CLAMPED"
    # Frame zero is an explicit rest outside the looping clip.
    for name in NODES:
        obj = bpy.data.objects[name]
        axis = 2 if name == NODES[0] else 1
        obj.rotation_euler[axis] = 0
        obj.keyframe_insert(data_path="rotation_euler", index=axis, frame=0, group=name)
    action.use_frame_range = True
    action.frame_start, action.frame_end = 1, 281
    for layer in action.layers:
        for strip in layer.strips:
            for slot in action.slots:
                for curve in strip.channelbag(slot).fcurves:
                    for key in curve.keyframe_points:
                        if key.co.x in (1, 281):
                            key.handle_left_type = key.handle_right_type = "FREE"
                            key.handle_left.y = key.handle_right.y = key.co.y
    scene.frame_set(0)


def render():
    scene = bpy.context.scene
    folder = OUT / "checkpoints"
    folder.mkdir(parents=True, exist_ok=True)
    camera = bpy.data.objects["CAM_three_quarter_front"]
    scene.camera = camera
    # One stable setup containing neutral and every raised/slewed phase.
    target = Vector((1.3, 0, 2.4))
    camera.location = target + Vector((10, 11, 7))
    camera.rotation_euler = (target-camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.ortho_scale = 12.7
    phases = {"neutral": 0, "digging": 1, "filled": 41, "lifted": 81,
              "slewed": 131, "dump": 166, "returned": 281}
    for phase, frame in phases.items():
        scene.frame_set(frame)
        scene.render.filepath = str(folder / (phase + ".png"))
        bpy.ops.render.render(write_still=True)
    # Assemble the actual phase PNGs using Blender's image buffers; no PIL dependency.
    tile_w, image_h, tile_h = 560, 360, 400
    sheet = bpy.data.images.new("stage06_contact_sheet", width=tile_w*4, height=tile_h*2)
    pixels = [0.6, 0.6, 0.6, 1.0] * (tile_w*4*tile_h*2)
    # Small bitmap labels only on the contact sheet, not model/text geometry.
    font = {"a": "01110/10001/10001/11111/10001/10001/10001", "d": "11110/10001/10001/10001/10001/10001/11110",
        "e": "11111/10000/10000/11110/10000/10000/11111", "f": "11111/10000/10000/11110/10000/10000/10000",
        "g": "01110/10001/10000/10111/10001/10001/01110", "i": "11111/00100/00100/00100/00100/00100/11111",
        "l": "10000/10000/10000/10000/10000/10000/11111", "m": "10001/11011/10101/10101/10001/10001/10001",
        "n": "10001/11001/10101/10011/10001/10001/10001", "p": "11110/10001/10001/11110/10000/10000/10000",
        "r": "11110/10001/10001/11110/10100/10010/10001", "s": "01111/10000/10000/01110/00001/00001/11110",
        "t": "11111/00100/00100/00100/00100/00100/00100", "u": "10001/10001/10001/10001/10001/10001/01110",
        "w": "10001/10001/10001/10101/10101/10101/01010"}
    for number, phase in enumerate(phases):
        img = bpy.data.images.load(str(folder / (phase + ".png")), check_existing=False)
        img.scale(tile_w, image_h)
        source = list(img.pixels)
        col, row = number % 4, 1-number//4
        for y in range(image_h):
            start = ((row*tile_h+y)*tile_w*4 + col*tile_w)*4
            pixels[start:start+tile_w*4] = source[y*tile_w*4:(y+1)*tile_w*4]
        for char_index, char in enumerate(phase):
            for gy, bits in enumerate(font[char].split("/")):
                for gx, bit in enumerate(bits):
                    if bit == "1":
                        for yy in range(3):
                            for xx in range(3):
                                x = col*tile_w+16+char_index*18+gx*3+xx
                                y = row*tile_h+image_h+8+(6-gy)*3+yy
                                k = (y*tile_w*4+x)*4
                                pixels[k:k+4] = [.03, .03, .03, 1]
        bpy.data.images.remove(img)
    sheet.pixels = pixels
    sheet.filepath_raw = str(OUT / "work_cycle_contact_sheet.png")
    sheet.file_format = "PNG"
    sheet.save()
    bpy.data.images.remove(sheet)
    scene.frame_set(0)


def main():
    checker = module("stage06_checker", "check_stage_06.py")
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    source = checker.capture_source()
    scene = bpy.context.scene
    scene.name = "XE215C_STAGE_06"
    collection = bpy.data.collections.new("50_KINEMATIC_RIG")
    scene.collection.children.link(collection)
    constants = linkage()
    cylinders = hydraulics()
    for obj in scene.objects:
        if obj.get("uncoupled_auxiliary"):
            obj["uncoupled_auxiliary"] = False
            obj["stage06_coupled"] = True
    scene["stage06_linkage"] = json.dumps(constants)
    scene["stage06_cylinders"] = json.dumps(cylinders)
    OUT.mkdir(parents=True, exist_ok=True)
    checker.gate_a(source, POSES)
    create_clip()
    render()
    checker.validate(source, POSES, write=True)
    scene.frame_set(0)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "xe215c_stage_06.blend"))


if __name__ == "__main__":
    main()
