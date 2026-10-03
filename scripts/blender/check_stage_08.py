"""Inspect GLB bytes and independently import/compare against immutable stage 07."""

import hashlib
import json
import math
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector, Quaternion
from mathutils.kdtree import KDTree

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "models/xe215c/stage_08"
SOURCE = ROOT / "models/xe215c/stage_07/xe215c_stage_07.blend"
CLIP = "excavator_work_cycle_demo"
NODES = ("NODE_UNDERCARRIAGE", "NODE_UPPERSTRUCTURE", "NODE_BOOM", "NODE_STICK", "NODE_BUCKET")
IDS = {"undercarriage", "upperstructure", "power-unit", "boom", "stick", "bucket", "boom-cylinder", "stick-cylinder", "bucket-cylinder"}
FRAMES = (1, 13, 13.375, 27, 41, 59, 80.375, 81, 103, 131, 147.375, 148, 166, 191, 209, 235.375, 236, 253, 281)
EPS = 2e-5
INTERPOLATION_EPS = .0002


def set_frame(scene, frame):
    scene.frame_set(math.floor(frame), subframe=frame-math.floor(frame))


def hashes():
    files = [p for i in range(1, 8) for p in (ROOT / f"models/xe215c/stage_{i:02}").rglob("*") if p.is_file()]
    files += [p for p in (ROOT / "scripts/blender").glob("*.py") if any(p.name.startswith(prefix+f"{i:02}")
        for prefix in ("stage_", "check_stage_") for i in range(1, 8))]
    return {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}


def points(obj):
    return [obj.matrix_world @ v.co for v in obj.data.vertices]


def bounds(objects):
    ps = [p for o in objects for p in points(o)]
    return {"min": [min(p[i] for p in ps) for i in range(3)], "max": [max(p[i] for p in ps) for i in range(3)]}


def capture_source():
    scene = bpy.context.scene
    scene.frame_set(0)
    objects = {o.name: o for o in scene.objects if o.type == "MESH" or o.name in NODES}
    data = {"hashes": hashes(), "objects": {}, "samples": {}, "materials": {}}
    for name, obj in objects.items():
        parent = obj.parent
        while parent and parent.name not in objects:
            parent = parent.parent
        data["objects"][name] = {"type": obj.type, "parent": parent.name if parent else None,
            "world": obj.matrix_world.copy(), "meta": {k: obj[k] for k in obj.keys() if k.startswith("edu_")},
            "vertices": [v.co.copy() for v in obj.data.vertices] if obj.type == "MESH" else [],
            "corners": [(obj.data.vertices[loop.vertex_index].co.copy(), obj.data.corner_normals[loop.index].vector.copy())
                for loop in obj.data.loops] if obj.type == "MESH" else [],
            "material": obj.data.materials[0].name if obj.type == "MESH" else None}
        if obj.type == "MESH":
            mat = obj.data.materials[0]
            bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
            data["materials"][mat.name] = {"base": list(bsdf.inputs["Base Color"].default_value),
                "metallic": bsdf.inputs["Metallic"].default_value, "roughness": bsdf.inputs["Roughness"].default_value}
    data["rest_bbox"] = bounds([o for o in objects.values() if o.type == "MESH"])
    for frame in FRAMES:
        set_frame(scene, frame)
        data["samples"][frame] = {name: obj.matrix_world.copy() for name, obj in objects.items()}
    scene.frame_set(0)
    data["preview"] = {"camera": {"matrix": [list(r) for r in scene.camera.matrix_world], "ortho": scene.camera.data.ortho_scale},
        "lights": [{"name": o.name, "matrix": [list(r) for r in o.matrix_world], "energy": o.data.energy, "size": o.data.size} for o in scene.objects if o.type == "LIGHT"],
        "world": list(scene.world.node_tree.nodes["Background"].inputs["Color"].default_value),
        "world_strength": scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value,
        "look": scene.view_settings.look}
    return data


def read_glb():
    raw = (OUT / "excavator.glb").read_bytes()
    magic, version, size = struct.unpack_from("<4sII", raw)
    assert magic == b"glTF" and version == 2 and size == len(raw)
    length, kind = struct.unpack_from("<II", raw, 12)
    assert kind == 0x4E4F534A
    gltf = json.loads(raw[20:20+length])
    offset = 20+length
    binary_length, kind = struct.unpack_from("<II", raw, offset)
    assert kind == 0x004E4942 and offset+8+binary_length == len(raw)
    return gltf, raw[offset+8:], len(raw)


def accessor(gltf, binary, index):
    a = gltf["accessors"][index]
    view = gltf["bufferViews"][a["bufferView"]]
    types = {5126: ("f", 4), 5125: ("I", 4), 5123: ("H", 2), 5121: ("B", 1)}
    sizes = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}
    fmt, width = types[a["componentType"]]
    n = sizes[a["type"]]
    step = view.get("byteStride", n*width)
    start = view.get("byteOffset", 0)+a.get("byteOffset", 0)
    return [struct.unpack_from("<"+fmt*n, binary, start+i*step) for i in range(a["count"])]


def nearest_error(a, b):
    tree = KDTree(len(b))
    for i, p in enumerate(b):
        tree.insert(p, i)
    tree.balance()
    return max(tree.find(p)[2] for p in a)


def preview(source, static_basis):
    scene = bpy.context.scene
    setup = source["preview"]
    camera_data = bpy.data.cameras.new("ROUNDTRIP_REVIEW_CAMERA")
    camera_data.type, camera_data.ortho_scale = "ORTHO", setup["camera"]["ortho"]
    camera = bpy.data.objects.new(camera_data.name, camera_data)
    scene.collection.objects.link(camera)
    camera.matrix_world = Matrix(setup["camera"]["matrix"])
    scene.camera = camera
    for spec in setup["lights"]:
        data = bpy.data.lights.new(spec["name"], "AREA")
        data.energy, data.size, data.shape = spec["energy"], spec["size"], "DISK"
        obj = bpy.data.objects.new(data.name, data)
        scene.collection.objects.link(obj)
        obj.matrix_world = Matrix(spec["matrix"])
    world = bpy.data.worlds.new("ROUNDTRIP_REVIEW_WORLD")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = setup["world"]
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = setup["world_strength"]
    scene.world = world
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 64
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 1400, 900, 100
    scene.view_settings.view_transform, scene.view_settings.look = "AgX", setup["look"]
    folder = OUT / "checkpoints"
    folder.mkdir(exist_ok=True)
    # Rest is tested with imported animation detached, not the t=0 digging pose.
    state = [(o, o.animation_data.action, o.animation_data.action_slot,
        [(t, t.mute) for t in o.animation_data.nla_tracks]) for o in scene.objects if o.animation_data]
    try:
        for obj, action, slot, tracks in state:
            obj.animation_data.action = None
            for track, mute in tracks:
                track.mute = True
        for obj in scene.objects:
            if obj.name in source["objects"]:
                obj.matrix_basis = static_basis[obj.name]
        bpy.context.view_layer.update()
        scene.render.filepath = str(folder / "roundtrip_neutral.png")
        bpy.ops.render.render(write_still=True)
    finally:
        for obj, action, slot, tracks in state:
            if action:
                obj.animation_data.action, obj.animation_data.action_slot = action, slot
            for track, mute in tracks:
                track.mute = mute
    scene.frame_set(80)
    scene.render.filepath = str(folder / "roundtrip_lifted.png")
    bpy.ops.render.render(write_still=True)


def validate(source, bake=None, write=False, render=False):
    gltf, binary, size = read_glb()
    checks = {}
    def check(name, passed, **detail):
        checks[name] = {"pass": bool(passed), **detail}
        assert passed, (name, detail)
    nodes = gltf["nodes"]
    named = {n["name"]: i for i, n in enumerate(nodes)}
    check("exact_106_names_no_helpers", len(nodes) == len(named) == 106 and set(named) == set(source["objects"]))
    parents = {child: i for i, n in enumerate(nodes) for child in n.get("children", [])}
    check("canonical_hierarchy_and_mesh_ownership", all((nodes[parents[i]]["name"] if i in parents else None) == source["objects"][n]["parent"] for n, i in named.items()))
    check("metadata_extras_preserved", all(all(nodes[named[n]].get("extras", {}).get(k) == v for k, v in data["meta"].items()) for n, data in source["objects"].items()))
    check("nine_ids", {n.get("extras", {}).get("edu_component") for n in nodes if n.get("extras", {}).get("edu_component")} == IDS)
    check("no_cameras_lights_skins_images_textures", not any(gltf.get(k) for k in ("cameras", "skins", "images", "textures")) and not any("KHR_lights_punctual" in n.get("extensions", {}) for n in nodes))
    check("self_contained_binary_buffer", len(gltf["buffers"]) == 1 and "uri" not in gltf["buffers"][0])
    primitives = [p for m in gltf["meshes"] for p in m["primitives"]]
    triangles = sum(gltf["accessors"][p["indices"]]["count"]//3 for p in primitives)
    vertex_count = sum(gltf["accessors"][p["attributes"]["POSITION"]]["count"] for p in primitives)
    check("101_meshes_7004_triangles", len(gltf["meshes"]) == 101 and triangles == 7004 and all(p.get("mode", 4) == 4 for p in primitives))
    mats = {m["name"]: m for m in gltf["materials"]}
    check("seven_expected_materials", set(mats) == set(source["materials"]) and len(mats) == 7)
    for name, data in source["materials"].items():
        pbr = mats[name]["pbrMetallicRoughness"]
        check("PBR_"+name, max(abs(a-b) for a, b in zip(pbr.get("baseColorFactor", [1]*4), data["base"])) < 1e-6 and
            abs(pbr.get("metallicFactor", 1)-data["metallic"]) < 1e-6 and abs(pbr.get("roughnessFactor", 1)-data["roughness"]) < 1e-6 and mats[name].get("alphaMode", "OPAQUE") == "OPAQUE")
    animations = gltf.get("animations", [])
    check("one_named_clip", len(animations) == 1 and animations[0]["name"] == CLIP)
    times = [t[0] for sampler in animations[0]["samplers"] for t in accessor(gltf, binary, sampler["input"])]
    check("time_range_280_over_24_seconds", abs(min(times)) < 1e-7 and abs(max(times)-280/24) < 1e-6,
          seconds=[min(times), max(times)], source_frames=[1, 281], fps=24)
    check("four_primary_nodes_animated", set(NODES[1:]) <= {nodes[c["target"]["node"]]["name"] for c in animations[0]["channels"]})
    check("finite_accessors", all(math.isfinite(x) for i, a in enumerate(gltf["accessors"]) if a["componentType"] == 5126 for row in accessor(gltf, binary, i) for x in row))
    conversion = Matrix.Rotation(math.pi/2, 4, "X")
    static_basis = {}
    for name, index in named.items():
        node = nodes[index]
        if "matrix" in node:
            local = Matrix([node["matrix"][i:i+4] for i in range(0, 16, 4)]).transposed()
        else:
            q = node.get("rotation", [0, 0, 0, 1])
            local = Matrix.LocRotScale(Vector(node.get("translation", [0, 0, 0])),
                Quaternion((q[3], q[0], q[1], q[2])), Vector(node.get("scale", [1, 1, 1])))
        static_basis[name] = conversion @ local @ conversion.inverted()
        if "mesh" in node:
            primitive = gltf["meshes"][node["mesh"]]["primitives"][0]
            positions = [conversion.to_3x3() @ Vector(v) for v in accessor(gltf, binary, primitive["attributes"]["POSITION"])]
            normals = [conversion.to_3x3() @ Vector(v) for v in accessor(gltf, binary, primitive["attributes"]["NORMAL"])]
            tree = KDTree(len(source["objects"][name]["corners"]))
            for i, (p, normal) in enumerate(source["objects"][name]["corners"]):
                tree.insert(p, i)
            tree.balance()
            check("normal_preservation_"+name, all(any(normal.dot(source["objects"][name]["corners"][i][1]) > .99999
                for co, i, dist in tree.find_range(p, EPS)) for p, normal in zip(positions, normals)))
    # Clear all source/export copies before a real, name-clean import.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = 24
    bpy.ops.import_scene.gltf(filepath=str(OUT / "excavator.glb"), import_shading="NORMALS")
    imported = {o.name: o for o in scene.objects}
    meshes = [o for o in imported.values() if o.type == "MESH"]
    check("reimport_exact_names_hierarchy", set(imported) == set(source["objects"]) and all((o.parent.name if o.parent else None) == source["objects"][n]["parent"] for n, o in imported.items()))
    check("reimport_metadata", all(all(o.get(k) == v for k, v in source["objects"][n]["meta"].items()) for n, o in imported.items()))
    imported_action = bpy.data.actions.get(CLIP)
    check("reimport_clip", imported_action is not None and abs(imported_action.frame_range[0]) < 1e-4 and
        abs(imported_action.frame_range[1]-280) < 1e-4)
    imported_action_range = list(imported_action.frame_range)
    scene.frame_start, scene.frame_end = 0, 280
    bindings = [(o, o.animation_data.action, o.animation_data.action_slot,
        [(t, t.mute) for t in o.animation_data.nla_tracks]) for o in imported.values() if o.animation_data]
    # Import immediately evaluates animation in Blender. Detach it and reconstruct
    # static TRS from actual GLB bytes, never from the expected source transforms.
    for obj, action, slot, tracks in bindings:
        obj.animation_data.action = None
        for track, mute in tracks:
            track.mute = True
    for name, obj in imported.items():
        obj.matrix_basis = static_basis[name]
    bpy.context.view_layer.update()
    rest_error, bbox = 0, bounds(meshes)
    for name, obj in imported.items():
        expected_matrix = source["objects"][name]["world"]
        check("rest_transform_"+name, (obj.matrix_world.translation-expected_matrix.translation).length < EPS and
            max(abs(obj.matrix_world[i][j]-expected_matrix[i][j]) for i in range(4) for j in range(4)) < EPS)
        if obj.type == "MESH":
            expected = [source["objects"][name]["world"] @ v for v in source["objects"][name]["vertices"]]
            rest_error = max(rest_error, nearest_error(points(obj), expected), nearest_error(expected, points(obj)))
    check("rest_surface_geometry", rest_error < EPS, max_error_m=rest_error)
    check("rest_bounding_box", max(abs(bbox[k][i]-source["rest_bbox"][k][i]) for k in bbox for i in range(3)) < EPS)
    imported_triangles = sum(len(o.data.polygons) for o in meshes)
    check("import_geometry_counts", len(meshes) == 101 and imported_triangles == 7004 and all(len(p.vertices) == 3 for o in meshes for p in o.data.polygons))
    check("import_material_assignments", all(len(o.data.materials) == 1 and o.data.materials[0].name == source["objects"][o.name]["material"] for o in meshes))
    check("import_PBR_values", all(max(abs(a-b) for a, b in zip(
        next(n for n in bpy.data.materials[name].node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value, data["base"])) < 1e-6 and
        abs(next(n for n in bpy.data.materials[name].node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Metallic"].default_value-data["metallic"]) < 1e-6 and
        abs(next(n for n in bpy.data.materials[name].node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Roughness"].default_value-data["roughness"]) < 1e-6 for name, data in source["materials"].items()))
    for obj, action, slot, tracks in bindings:
        if action:
            obj.animation_data.action, obj.animation_data.action_slot = action, slot
        for track, mute in tracks:
            track.mute = mute
    motion = {}
    for frame in FRAMES:
        set_frame(scene, frame-1)
        max_error, origin_error, orientation_error = 0, 0, 0
        for name, obj in imported.items():
            expected = source["samples"][frame][name]
            origin_error = max(origin_error, (obj.matrix_world.translation-expected.translation).length)
            orientation_error = max(orientation_error, max(abs(obj.matrix_world[i][j]-expected[i][j]) for i in range(3) for j in range(3)))
            if obj.type == "MESH":
                # Coordinate conversion is performed by Blender glTF importer on data.
                for v in obj.data.vertices:
                    local = v.co
                    max_error = max(max_error, (obj.matrix_world @ local-expected @ local).length)
        tolerance = EPS if frame == int(frame) else INTERPOLATION_EPS
        check("motion_frame_"+str(frame), max_error < tolerance and origin_error < tolerance and orientation_error < tolerance,
            world_vertex_error_m=max_error, origin_error_m=origin_error, rotation_scale_matrix_error=orientation_error, tolerance_m=tolerance)
        current_bbox = bounds(meshes)
        original_points = [source["samples"][frame][o.name] @ v for o in meshes for v in source["objects"][o.name]["vertices"]]
        expected_bbox = {"min": [min(p[i] for p in original_points) for i in range(3)], "max": [max(p[i] for p in original_points) for i in range(3)]}
        check("animated_bbox_"+str(frame), max(abs(current_bbox[k][i]-expected_bbox[k][i]) for k in current_bbox for i in range(3)) < tolerance)
        motion[str(frame)] = {"import_frame": frame-1, "max_world_vertex_error_m": max_error, "bbox_m": current_bbox}
    scene.frame_set(0)
    first = {n: o.matrix_world.copy() for n, o in imported.items()}
    scene.frame_set(280)
    check("loop_transform_match", max(abs(o.matrix_world[i][j]-first[n][i][j]) for n, o in imported.items() for i in range(4) for j in range(4)) < EPS)
    check("no_imported_constraints_drivers_armatures", all(not o.constraints and not(o.animation_data and o.animation_data.drivers) and o.type != "ARMATURE" for o in imported.values()))
    check("source_hashes_unchanged", hashes() == source["hashes"])
    report = {"stage": "08 production GLB", "source_sha256": source["hashes"], "checks": checks,
        "glb_sha256": hashlib.sha256((OUT / "excavator.glb").read_bytes()).hexdigest(),
        "glb_size_bytes": size, "node_count": len(nodes), "mesh_count": 101,
        "primitive_count": len(primitives), "triangle_count": triangles, "exported_vertex_count": vertex_count,
        "source_vertex_count": 3818, "vertex_count_note": "glTF vertex splits preserve flat/smooth normals; no triangle growth",
        "material_count": len(mats), "external_textures": 0, "rest_bbox_m": bbox,
        "clip": {"name": CLIP, "seconds": [min(times), max(times)], "source_frames": [1, 281], "import_frames_at_24fps": [0, 280],
            "imported_action_frame_range": imported_action_range, "channels": len(animations[0]["channels"])},
        "motion_regression": motion, "bake": bake, "tolerance_m": EPS, "subframe_interpolation_tolerance_m": INTERPOLATION_EPS,
        "limitations": "Fixed sampled demo clip, not interactive procedural kinematics; browser fps and application mapping not tested."}
    if render:
        preview(source, static_basis)
    if write:
        (OUT / "inspection.json").write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
    print(f"PASS: {len(checks)} checks; GLB {size} bytes; 101 meshes/7004 triangles; seven materials; round-trip verified")
    return report


def main():
    saved = json.loads((OUT / "inspection.json").read_text(encoding="utf-8"))
    assert saved["source_sha256"] == hashes()
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    source = capture_source()
    report = validate(source)
    assert report["glb_sha256"] == saved["glb_sha256"]


if __name__ == "__main__":
    main()
