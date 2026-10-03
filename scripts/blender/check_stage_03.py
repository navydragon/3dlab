"""Independent stage 03 checker: compare source, hierarchy and matrix behavior.

CLI: blender --background stage_03.blend --python-exit-code 1 --python this_file.
No source or blend is saved. Generator can call validate(source_snapshot).
"""

import hashlib
import json
import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "models/xe215c/stage_03"
SOURCE = ROOT / "models/xe215c/stage_02"
NODES = ("NODE_UNDERCARRIAGE", "NODE_UPPERSTRUCTURE", "NODE_BOOM", "NODE_STICK", "NODE_BUCKET")
AXES = {NODES[0]: None, NODES[1]: "Z", NODES[2]: "Y", NODES[3]: "Y", NODES[4]: "Y"}
PIVOTS = {NODES[0]: None, NODES[1]: "PIVOT_SLEW", NODES[2]: "PIVOT_BOOM",
          NODES[3]: "PIVOT_STICK", NODES[4]: "PIVOT_BUCKET"}
GEOMETRY = {
    NODES[0]: ("left_track_blockout", "right_track_blockout", "left_crawler_frame",
               "right_crawler_frame", "central_x_frame", "slew_support"),
    NODES[1]: ("main_upper_platform", "cab", "engine_body", "counterweight", "boom_mounting_base"),
    NODES[2]: ("boom",), NODES[3]: ("stick",),
    NODES[4]: ("bucket", "bucket_left_cheek", "bucket_right_cheek", "bucket_cutting_edge"),
}
TEST_POSES = {
    "neutral": {},
    "slew_test": {"NODE_UPPERSTRUCTURE": 30},
    "articulated_workgroup": {"NODE_BOOM": -35, "NODE_STICK": -40, "NODE_BUCKET": 75},
}
EPS = 1e-5  # 0.01 mm tolerance for Blender float32 parenting/rotation arithmetic.


def source_hashes():
    files = list(SOURCE.rglob("*")) + [ROOT/"scripts/blender"/name for name in
        ("stage_02_proportions.py", "check_stage_02.py", "stage_02_contact_sheet.py")]
    return {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(files) if p.is_file()}


def capture():
    bpy.context.view_layer.update()
    meshes = {}
    pivots = {}
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj.get("stage_owner") in ("xe215c_stage_02", "xe215c_stage_03"):
            meshes[obj.name] = {
                "vertices": [obj.matrix_world@v.co for v in obj.data.vertices],
                "local_vertices": [v.co.copy() for v in obj.data.vertices],
                "faces": [tuple(p.vertices) for p in obj.data.polygons],
                "matrix": obj.matrix_world.copy(),
            }
        if obj.name.startswith("PIVOT_"):
            pivots[obj.name] = obj.matrix_world.translation.copy()
    return {"meshes": meshes, "pivots": pivots}


def reset():
    for name in NODES:
        bpy.data.objects[name].rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()


def pose(angles):
    reset()
    for name, degrees in angles.items():
        node = bpy.data.objects[name]
        node.rotation_euler[1 if AXES[name] == "Y" else 2] = math.radians(degrees)
    bpy.context.view_layer.update()


def bounds(points):
    return {"min": [min(p[i] for p in points) for i in range(3)],
            "max": [max(p[i] for p in points) for i in range(3)]}


def validate(source, write=False):
    ob = bpy.data.objects
    checks = {}

    def check(name, passed, **detail):
        checks[name] = {"pass": bool(passed), **detail}

    expected_meshes = {m for group in GEOMETRY.values() for m in group}
    current = capture()
    check("neutral_initial_rotations", all(ob.get(n) and Vector(ob[n].rotation_euler).length < EPS for n in NODES))
    check("same_major_mesh_names", set(current["meshes"]) == set(source["meshes"]) == expected_meshes)
    vertex_error = 0.0
    for name in expected_meshes:
        a, b = current["meshes"][name], source["meshes"][name]
        check("topology_"+name, a["faces"] == b["faces"] and len(a["vertices"]) == len(b["vertices"]))
        check("local_mesh_unchanged_"+name, a["local_vertices"] == b["local_vertices"])
        vertex_error = max(vertex_error, max((p-q).length for p,q in zip(a["vertices"],b["vertices"])))
    check("neutral_world_vertices", vertex_error < EPS, max_error_m=vertex_error)
    check("strict_node_chain", all(ob[n].type == "EMPTY" and
          (ob[n].parent.name if ob[n].parent else None) == (NODES[i-1] if i else None)
          for i,n in enumerate(NODES)))
    check("identity_node_scales", all((ob[n].scale-Vector((1,1,1))).length < EPS for n in NODES))
    check("identity_node_orientations", all(ob[n].matrix_world.to_quaternion().angle < EPS for n in NODES))
    check("geometry_ownership", all(ob[m].parent == ob[n] for n,meshes in GEOMETRY.items() for m in meshes))
    check("identity_parent_inverse", all(max(abs(ob[n].matrix_parent_inverse[r][c]-(1 if r == c else 0))
          for r in range(4) for c in range(4)) < EPS for n in expected_meshes | set(NODES)))
    check("accepted_node_pivots", all((ob[n].matrix_world.translation -
          (source["pivots"][PIVOTS[n]] if PIVOTS[n] else Vector((0,0,0)))).length < EPS for n in NODES))
    check("accepted_pivot_markers", all((ob[n].matrix_world.translation-p).length < EPS for n,p in source["pivots"].items()))
    check("slew_axis_Z_transverse_axes_Y", all(
        (ob[n].matrix_world.to_3x3() @ Vector((0,0,1) if AXES[n] == "Z" else (0,1,0)) -
         Vector((0,0,1) if AXES[n] == "Z" else (0,1,0))).length < EPS for n in NODES[1:]))
    owned = [o for o in bpy.context.scene.objects if o.get("stage_owner") == "xe215c_stage_03"]
    check("no_constraints_animation_materials_modifiers", all(not o.animation_data and not o.constraints and
          not o.modifiers and o.type != "ARMATURE" and (o.type != "MESH" or not o.data.materials) for o in owned))
    check("no_scene_animation_actions", not bpy.context.scene.animation_data and not bpy.data.actions)
    check("metric_identity_scale_all", bpy.context.scene.unit_settings.system == "METRIC" and
          bpy.context.scene.unit_settings.scale_length == 1 and all((o.scale-Vector((1,1,1))).length < EPS for o in owned))

    neutral_world = {n:ob[n].matrix_world.copy() for n in NODES}
    neutral_local = {n:ob[n].matrix_basis.copy() for n in NODES}
    matrices = {m:ob[m].matrix_world.copy() for m in expected_meshes}
    # Each joint individually must move exactly its subtree and leave others
    # unchanged. Expected motion is independent axis-angle about accepted pivot.
    joint_tests = {}
    for i,node_name in enumerate(NODES):
        degrees = 12
        pose({node_name:degrees})
        p = neutral_world[node_name].translation
        axis = AXES[node_name] or "Z"
        expected_delta = Matrix.Translation(p) @ Matrix.Rotation(math.radians(degrees),4,axis) @ Matrix.Translation(-p)
        branch = {m for n in NODES[i:] for m in GEOMETRY[n]}
        error = 0.0
        fixed_error = 0.0
        for m in expected_meshes:
            target = expected_delta@matrices[m] if m in branch else matrices[m]
            error = max(error,max(abs(ob[m].matrix_world[r][c]-target[r][c]) for r in range(4) for c in range(4)))
            if m not in branch:
                fixed_error = max(fixed_error,(ob[m].matrix_world.translation-matrices[m].translation).length)
        moved = max((ob[m].matrix_world@v - matrices[m]@v).length
                    for m in branch for v in [ob[m].data.vertices[0].co])
        check("branch_rotation_"+node_name, error < EPS and moved > .001 and fixed_error < EPS,
              max_matrix_error=error, outside_branch_error_m=fixed_error)
        joint_tests[node_name] = {"angle_deg":degrees,"axis":axis,"moving_meshes":sorted(branch)}
        reset()

    poses = {}
    for label,angles in TEST_POSES.items():
        pose(angles)
        expected_world = {}
        for i,n in enumerate(NODES):
            rotate = Matrix.Rotation(math.radians(angles.get(n,0)),4,AXES[n] or "Z")
            local = neutral_local[n]@rotate
            expected_world[n] = expected_world[NODES[i-1]]@local if i else local
        error = 0.0
        for n,meshes in GEOMETRY.items():
            delta = expected_world[n]@neutral_world[n].inverted()
            for m in meshes:
                error = max(error,max((ob[m].matrix_world@v.co - delta@source["meshes"][m]["vertices"][j]).length
                                      for j,v in enumerate(ob[m].data.vertices)))
        check("descendant_transforms_"+label,error<EPS,max_vertex_error_m=error)
        # Pin continuity: child joint origin follows the upstream member endpoint.
        seam_error = 0.0
        for i in range(2,len(NODES)):
            child,parent = NODES[i],NODES[i-1]
            expected_pin = ob[parent].matrix_world @ neutral_local[child].translation
            seam_error = max(seam_error,(ob[child].matrix_world.translation-expected_pin).length)
        check("joint_continuity_"+label,seam_error<EPS,max_pin_error_m=seam_error)
        for node,pivot in PIVOTS.items():
            if pivot:
                check("marker_follows_"+label+"_"+pivot,(ob[pivot].matrix_world.translation-ob[node].matrix_world.translation).length<EPS)
        poses[label] = {"angles_deg":angles,"node_world_pivots_m":{n:list(ob[n].matrix_world.translation) for n in NODES},
                        "workgroup_bbox_m":bounds([ob[m].matrix_world@v.co for n in NODES[2:] for m in GEOMETRY[n] for v in ob[m].data.vertices])}
        reset()
    reset_error = max((ob[m].matrix_world@v.co - p).length for m in expected_meshes
                      for v,p in zip(ob[m].data.vertices,source["meshes"][m]["vertices"]))
    check("reset_returns_neutral",reset_error<EPS,max_error_m=reset_error)
    points = [p for m in source["meshes"].values() for p in m["vertices"]]
    report = {"stage":"03 hierarchy and articulation ONLY","blender_version":bpy.app.version_string,
              "source_sha256":source_hashes(),"neutral_bbox_m":bounds(points),"checks":checks,
              "nodes":[{"name":n,"parent":ob[n].parent.name if ob[n].parent else None,
                        "local_location_m":list(ob[n].location),"neutral_rotation_rad":list(ob[n].rotation_euler),
                        "world_pivot_m":list(ob[n].matrix_world.translation),"rotation_axis_local":AXES[n],
                        "scale":list(ob[n].scale),"local_matrix":[list(r) for r in ob[n].matrix_basis],
                        "world_matrix":[list(r) for r in ob[n].matrix_world],"meshes":list(GEOMETRY[n])} for n in NODES],
              "individual_joint_tests":joint_tests,"test_poses":poses,
              "limits":"Illustrative test angles only, not factory operating limits. Visual collision review only."}
    failed = [n for n,result in checks.items() if not result["pass"]]
    if failed:
        raise AssertionError(f"Stage 03 failed: {failed}")
    if write:
        OUT.mkdir(parents=True,exist_ok=True)
        (OUT/"inspection.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(f"PASS: {len(checks)} stage 03 checks; neutral vertex error {vertex_error:.9f} m")
    return report


def main():
    artifact = Path(bpy.data.filepath)
    assert artifact.name == "xe215c_stage_03.blend", "Open the stage 03 checkpoint"
    expected_hashes = json.loads((OUT/"inspection.json").read_text(encoding="utf-8"))["source_sha256"]
    assert expected_hashes == source_hashes(), "Stage 02 source hashes changed"
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE/"xe215c_stage_02.blend"))
    source = capture()
    bpy.ops.wm.open_mainfile(filepath=str(artifact))
    validate(source)
    assert expected_hashes == source_hashes()
    print("PASS: reopened checkpoint and immutable source hashes")


if __name__ == "__main__":
    main()
