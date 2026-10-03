"""Production GLB from a temporary rigid-transform bake; never save stage 07."""

import importlib.util
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "models/xe215c/stage_08"
SOURCE = ROOT / "models/xe215c/stage_07/xe215c_stage_07.blend"
CLIP = "excavator_work_cycle_demo"
NODES = ("NODE_UNDERCARRIAGE", "NODE_UPPERSTRUCTURE", "NODE_BOOM", "NODE_STICK", "NODE_BUCKET")


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def bake_copy():
    source = bpy.context.scene
    source.frame_set(0)
    originals = {o.name: o for o in source.objects if o.type == "MESH" or o.name in NODES}
    scene = bpy.data.scenes.new("XE215C_EXPORT_COPY")
    scene.unit_settings.system, scene.unit_settings.scale_length = "METRIC", 1
    scene.frame_start, scene.frame_end, scene.render.fps = 4, 1124, 96
    scene["source_clip_frame_start"] = 1
    scene["source_clip_frame_end"] = 281
    scene["source_clip_fps"] = 24
    scene["source_rest_frame"] = 0
    scene["bake_sample_fps"] = 96
    copies, parents, rest, samples = {}, {}, {}, {}
    for name, obj in originals.items():
        copy = obj.copy()
        copy.animation_data_clear()
        copy.constraints.clear()
        copy.rotation_mode = "QUATERNION"
        # No procedural properties/technical driver outputs needed in exported geometry.
        for key in list(copy.keys()):
            if not key.startswith("edu_") and key != "rotation_axis_local":
                del copy[key]
        axis = copy.get("rotation_axis_local")
        if axis:
            del copy["rotation_axis_local"]
            copy["source_rotation_axis_local"] = axis
            if axis in ("X", "Y", "Z"):
                copy["gltf_rotation_axis_local"] = {"X": [1.0, 0.0, 0.0], "Y": [0.0, 0.0, -1.0], "Z": [0.0, 1.0, 0.0]}[axis]
        scene.collection.objects.link(copy)
        copies[name] = copy
        parent = obj.parent
        while parent and parent.name not in originals:
            parent = parent.parent
        parents[name] = parent.name if parent else None
    def basis(name):
        obj = originals[name]
        return originals[parents[name]].matrix_world.inverted() @ obj.matrix_world if parents[name] else obj.matrix_world.copy()
    for name, copy in copies.items():
        copy.parent = copies.get(parents[name])
        copy.matrix_parent_inverse = Matrix.Identity(4)
        rest[name] = basis(name)
    # Capture evaluated source motion before changing any names/actions.
    for frame in range(4, 1125):
        time = frame/4
        source.frame_set(math.floor(time), subframe=time-math.floor(time))
        samples[frame] = {name: basis(name) for name in originals}
    source.frame_set(0)
    dynamic = [name for name in originals if any(max(abs(samples[f][name][i][j]-rest[name][i][j])
        for i in range(4) for j in range(4)) > 1e-5 for f in samples)]
    action = bpy.data.actions.new(CLIP + "_EXPORT_BAKE")
    for name in dynamic:
        copy = copies[name]
        copy.animation_data_create()
        copy.animation_data.action = action
        copy.animation_data.action_slot = action.slots.new(id_type="OBJECT", name=name)
        previous = None
        for frame in (0, *samples):
            location, rotation, scale = (rest[name] if frame == 0 else samples[frame][name]).decompose()
            assert (scale-Vector((1, 1, 1))).length < 1e-5
            if previous and previous.dot(rotation) < 0:
                rotation.negate()
            previous = rotation.copy()
            copy.location, copy.rotation_quaternion, copy.scale = location, rotation, (1, 1, 1)
            for path in ("location", "rotation_quaternion"):
                copy.keyframe_insert(data_path=path, frame=frame)
    for layer in action.layers:
        for strip in layer.strips:
            for slot in action.slots:
                for curve in strip.channelbag(slot).fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = "LINEAR"
    action.use_frame_range = True
    action.frame_start, action.frame_end = 4, 1124
    for name, obj in originals.items():
        obj.name = name + "__SOURCE_ONLY"
    bpy.data.actions[CLIP].name = CLIP + "__SOURCE_ONLY"
    action.name = CLIP
    for name, copy in copies.items():
        copy.name = name
        copy.matrix_basis = rest[name]
    bpy.context.window.scene = scene
    scene.frame_set(0)
    assert len(scene.objects) == 106 and all(not o.constraints and not (o.animation_data and o.animation_data.drivers) for o in scene.objects)
    return {"object_count": len(copies), "animated_objects": dynamic,
        "samples": 1121, "sample_fps": 96, "source_clip_frames": [1, 281], "source_fps": 24, "rest_frame": 0,
        "secondary_reparenting": "Nearest retained canonical ancestor; rigid local transforms baked; no geometry edits"}


def main():
    checker = module("stage08_checker", "check_stage_08.py")
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    source = checker.capture_source()
    bake = bake_copy()
    OUT.mkdir(parents=True, exist_ok=True)
    settings = dict(filepath=str(OUT / "excavator.glb"), export_format="GLB",
        use_active_scene=True, export_extras=True, export_cameras=False, export_lights=False,
        export_materials="EXPORT", export_unused_images=False, export_unused_textures=False,
        export_animations=True, export_animation_mode="ACTIVE_ACTIONS",
        export_nla_strips_merged_animation_name=CLIP, export_frame_range=True,
        export_frame_step=1, export_force_sampling=True, export_anim_slide_to_zero=True,
        export_current_frame=True, export_optimize_animation_size=True,
        export_hierarchy_flatten_objs=False, export_yup=True)
    result = bpy.ops.export_scene.gltf(**settings)
    assert result == {"FINISHED"}
    checker.validate(source, bake=bake, write=True, render=True)


if __name__ == "__main__":
    main()
