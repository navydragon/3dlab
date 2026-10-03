"""Build stage 03 hierarchy from frozen stage 02. No mesh edits or animation."""

import importlib.util
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/"models/xe215c/stage_03"
SOURCE = ROOT/"models/xe215c/stage_02/xe215c_stage_02.blend"
spec = importlib.util.spec_from_file_location("stage03_checker",Path(__file__).with_name("check_stage_03.py"))
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)
OWNER = "xe215c_stage_03"


def parent_keep_world(obj,node):
    world = obj.matrix_world.copy()
    obj.parent = node
    obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.matrix_basis = node.matrix_world.inverted()@world
    bpy.context.view_layer.update()


def build():
    hashes = checker.source_hashes()
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    source = checker.capture()
    scene = bpy.context.scene
    scene.name = "XE215C_STAGE_03"
    scene["stage"] = "03 hierarchy and kinematic structure ONLY"
    scene["neutral_scheme"] = "Accepted stage 02 folded pose, node rotations zero, local axes aligned with world"
    for obj in scene.objects:
        if obj.get("stage_owner") == "xe215c_stage_02":
            obj["stage_owner"] = OWNER
    for col in bpy.data.collections:
        if col.get("stage_owner") == "xe215c_stage_02":
            col["stage_owner"] = OWNER
    col = bpy.data.collections.new("40_KINEMATICS")
    col["stage_owner"] = OWNER
    scene.collection.children.link(col)
    controls = [("NODE_UNDERCARRIAGE",None,None,"ROOT"),
                ("NODE_UPPERSTRUCTURE","NODE_UNDERCARRIAGE","PIVOT_SLEW","Z"),
                ("NODE_BOOM","NODE_UPPERSTRUCTURE","PIVOT_BOOM","Y"),
                ("NODE_STICK","NODE_BOOM","PIVOT_STICK","Y"),
                ("NODE_BUCKET","NODE_STICK","PIVOT_BUCKET","Y")]
    for name,parent,pivot,axis in controls:
        obj = bpy.data.objects.new(name,None)
        col.objects.link(obj)
        obj["stage_owner"] = OWNER
        obj["rotation_axis_local"] = axis
        obj["neutral_rotation_deg"] = 0
        obj.empty_display_type = "ARROWS"
        obj.empty_display_size = .35
        position = source["pivots"][pivot] if pivot else Vector((0,0,0))
        if parent:
            obj.parent = bpy.data.objects[parent]
            obj.location = position-obj.parent.matrix_world.translation
        else:
            obj.location = position
        obj.rotation_mode = "XYZ"
        bpy.context.view_layer.update()
    # Meshes retain names, local vertices and world transform. Only object-local
    # translations become offsets relative to the assigned articulation node.
    for obj in list(scene.objects):
        if obj.type != "MESH" or obj.get("stage_owner") != OWNER:
            continue
        collection = obj.users_collection[0].name
        if collection == "10_UNDERCARRIAGE":
            node = "NODE_UNDERCARRIAGE"
        elif collection == "20_UPPERSTRUCTURE":
            node = "NODE_UPPERSTRUCTURE"
        elif obj.name == "boom":
            node = "NODE_BOOM"
        elif obj.name == "stick":
            node = "NODE_STICK"
        elif obj.name.startswith("bucket"):
            node = "NODE_BUCKET"
        else:
            raise ValueError(f"Unassigned major mesh: {obj.name}")
        parent_keep_world(obj,bpy.data.objects[node])
    for name,parent,pivot,axis in controls:
        if pivot:
            parent_keep_world(bpy.data.objects[pivot],bpy.data.objects[name])
    for guide,node in (("GUIDE_boom_pin_centers","NODE_BOOM"),("GUIDE_stick_pin_centers","NODE_STICK")):
        parent_keep_world(bpy.data.objects[guide],bpy.data.objects[node])
    assert hashes == checker.source_hashes()
    return source,hashes


def render_tests():
    scene = bpy.context.scene
    folder = OUT/"checkpoints"
    folder.mkdir(parents=True,exist_ok=True)
    # Inherit all stage 02 Workbench/camera settings unchanged. Articulation may
    # exceed neutral pose height; the existing 3/4 camera is checked visually.
    for label,angles in checker.TEST_POSES.items():
        checker.pose(angles)
        scene.camera = bpy.data.objects["CAM_three_quarter_front"]
        scene.render.filepath = str(folder/(label+"_three_quarter.png"))
        bpy.ops.render.render(write_still=True)
    checker.reset()


def main():
    source,hashes = build()
    checker.validate(source,write=True)
    render_tests()
    checker.validate(source,write=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"xe215c_stage_03.blend"))
    assert hashes == checker.source_hashes(), "Immutable stage 02 changed"


if __name__ == "__main__":
    main()
