"""Independent checker for stage 04 base invariants and educational detail."""

import hashlib
import json
import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/"models/xe215c/stage_04"
SOURCE = ROOT/"models/xe215c/stage_03"
NODES = ("NODE_UNDERCARRIAGE","NODE_UPPERSTRUCTURE","NODE_BOOM","NODE_STICK","NODE_BUCKET")
ANGLES = {"NODE_BOOM":-35,"NODE_STICK":-40,"NODE_BUCKET":75}
EPS = 1e-5


def source_hashes():
    files = list(SOURCE.rglob("*"))+[ROOT/"scripts/blender"/n for n in
        ("stage_03_hierarchy_kinematics.py","check_stage_03.py")]
    return {p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(files) if p.is_file()}


def capture_source():
    bpy.context.view_layer.update()
    return {"meshes":{o.name:{"world":[o.matrix_world@v.co for v in o.data.vertices],
        "local":[v.co.copy() for v in o.data.vertices],"faces":[tuple(p.vertices) for p in o.data.polygons],
        "parent":o.parent.name} for o in bpy.context.scene.objects if o.type == "MESH" and o.get("stage_owner") == "xe215c_stage_03"},
        "pivots":{n:bpy.data.objects[n].matrix_world.translation.copy() for n in
                   ("PIVOT_SLEW","PIVOT_BOOM","PIVOT_STICK","PIVOT_BUCKET")},
        "nodes":{n:bpy.data.objects[n].matrix_world.copy() for n in NODES},"sha256":source_hashes()}


def reset():
    for n in NODES:
        bpy.data.objects[n].rotation_euler = (0,0,0)
    bpy.context.view_layer.update()


def articulate():
    reset()
    for n,angle in ANGLES.items():
        bpy.data.objects[n].rotation_euler.y = math.radians(angle)
    bpy.context.view_layer.update()


def points(obj):
    return [obj.matrix_world@v.co for v in obj.data.vertices]


def bbox(objects):
    ps = [p for o in objects for p in points(o)]
    return {"min":[min(p[i] for p in ps) for i in range(3)],
            "max":[max(p[i] for p in ps) for i in range(3)]}


def validate(source,write=False):
    ob = bpy.data.objects
    owned = [o for o in bpy.context.scene.objects if o.get("stage_owner") == "xe215c_stage_04"]
    meshes = [o for o in owned if o.type == "MESH"]
    new = [o for o in meshes if o.get("detail_stage") == 4]
    checks = {}

    def check(n,passed,**detail):
        checks[n] = {"pass":bool(passed),**detail}

    def near(n,value,target):
        check(n,abs(value-target)<=.005,actual_m=value,target_m=target)

    check("five_node_chain",all(ob[n].type == "EMPTY" and (ob[n].parent.name if ob[n].parent else None) ==
          (NODES[i-1] if i else None) for i,n in enumerate(NODES)))
    check("immutable_stage03_source",source_hashes() == source["sha256"])
    check("canonical_rotation_axes",ob["NODE_UPPERSTRUCTURE"].get("rotation_axis_local") == "Z" and
          all(ob[n].get("rotation_axis_local") == "Y" for n in NODES[2:]))
    check("neutral_node_rotations",all(Vector(ob[n].rotation_euler).length < EPS for n in NODES))
    check("accepted_node_transforms",all(max(abs(ob[n].matrix_world[i][j]-source["nodes"][n][i][j]) for i in range(4) for j in range(4))<EPS for n in NODES))
    check("accepted_pivots",all((ob[n].matrix_world.translation-p).length<EPS for n,p in source["pivots"].items()))
    error = 0
    for n,data in source["meshes"].items():
        obj = ob[n]
        check("base_mesh_unchanged_"+n,[v.co for v in obj.data.vertices] == data["local"] and
              [tuple(p.vertices) for p in obj.data.polygons] == data["faces"] and obj.parent.name == data["parent"])
        error = max(error,max((p-q).length for p,q in zip(points(obj),data["world"])))
    check("accepted_world_geometry",error<EPS,max_error_m=error)
    check("metric_identity_scales",bpy.context.scene.unit_settings.system == "METRIC" and bpy.context.scene.unit_settings.scale_length == 1 and
          all((o.scale-Vector((1,1,1))).length<EPS for o in owned))
    check("no_actions_armature_constraints_drivers",not bpy.data.actions and not bpy.context.scene.animation_data and
          all(not o.animation_data and not o.constraints and o.type != "ARMATURE" for o in owned))
    check("no_materials_textures_logos",all(not o.data.materials and not any(s in o.name.lower() for s in ("logo","decal")) for o in meshes) and
          not any(i.source == "FILE" and i.filepath for i in bpy.data.images))
    check("no_subdivision_modifiers",all(not o.modifiers for o in meshes))
    bounds = bbox(meshes)
    for axis,target,label in ((0,9.625,"overall_length"),(1,2.990,"overall_width"),(2,3.100,"overall_height")):
        near(label,bounds["max"][axis]-bounds["min"][axis],target)
    near("ground_plane",bounds["min"][2],0)
    near("track_gauge",ob["left_track_blockout"].matrix_world.translation.y-ob["right_track_blockout"].matrix_world.translation.y,2.390)
    for side in ("left","right"):
        track = ob[f"{side}_track_blockout"]
        b = bbox([track])
        near(side+"_shoe_width",b["max"][1]-b["min"][1],.600)
        detail = [o for o in meshes if o.name.startswith(side+"_") and o.parent.name == "NODE_UNDERCARRIAGE"]
        d = bbox(detail)
        near(side+"_detailed_crawler_length",d["max"][0]-d["min"][0],4.255)
        contact = [p.x for p in points(track) if abs(p.z)<1e-6]
        near(side+"_ground_contact",max(contact)-min(contact),3.462)
    platform = bbox([ob["main_upper_platform"]])
    near("platform_width",platform["max"][1]-platform["min"][1],2.830)
    near("counterweight_clearance",bbox([ob["counterweight"]])["min"][2],1.050)
    near("x_frame_ground_clearance",bbox([ob["central_x_frame"]])["min"][2],.485)
    near("tail_radius",max(math.hypot(p.x,p.y) for p in points(ob["counterweight"])),2.890)
    near("boom_pin_distance",(ob["PIVOT_BOOM"].matrix_world.translation-ob["PIVOT_STICK"].matrix_world.translation).length,5.680)
    near("stick_pin_distance",(ob["PIVOT_STICK"].matrix_world.translation-ob["PIVOT_BUCKET"].matrix_world.translation).length,2.910)
    required = ("left_idler_wheel","right_sprocket_wheel","left_track_treads","right_track_treads","slew_bearing_ring",
                "cab_left_main_window","cab_front_windshield","cab_roof_cap","engine_right_service_panel",
                "boom_left_side_plate","stick_left_side_plate","bucket_tooth_01","bucket_tooth_05","bucket_left_mount_ear")
    check("major_detail_meshes_exist",all(ob.get(n) and ob[n].type == "MESH" for n in required))
    check("simplified_rollers_exist",all(ob.get(f"{side}_road_roller_{i:02}") for side in ("left","right") for i in range(1,8)) and
          all(ob.get(f"{side}_carrier_roller_{i:02}") for side in ("left","right") for i in (1,2)))
    def expected_node(name):
        if "_cylinder_" in name:
            kind,part = name.split("_cylinder_",1)
            parents = {"boom":("NODE_UPPERSTRUCTURE","NODE_BOOM"),"stick":("NODE_BOOM","NODE_STICK"),
                       "bucket":("NODE_STICK","NODE_STICK")}
            return parents[kind][1 if part in ("rod","end_rod") else 0]
        if name == "bucket_linkage_rocker" or name.startswith(("linkage_rocker","linkage_input","linkage_link")):
            return "NODE_STICK"
        if name == "bucket_linkage_connecting_link" or name.startswith("linkage_bucket"):
            return "NODE_BUCKET"
        if name.startswith(("left_","right_","x_frame_","slew_")):
            return "NODE_UNDERCARRIAGE"
        if name.startswith(("cab_","engine_","service_","tower_")):
            return "NODE_UPPERSTRUCTURE"
        if name.startswith("boom_"):
            return "NODE_BOOM"
        if name.startswith("stick_"):
            return "NODE_STICK"
        if name.startswith("bucket_"):
            return "NODE_BUCKET"
        raise AssertionError("Unknown detail ownership: "+name)
    check("detail_canonical_ownership",all(o.parent and o.parent.name == expected_node(o.name) and
          o.parent.name == o.get("expected_node") for o in new))
    check("bucket_independent",ob["NODE_BUCKET"].parent == ob["NODE_STICK"] and all(ob[n].parent == ob["NODE_BUCKET"] for n in
        ("bucket","bucket_left_cheek","bucket_right_cheek","bucket_cutting_edge","bucket_tooth_01","bucket_tooth_05")))
    cylinder_records = {}
    cylinder_nodes = {"boom":("NODE_UPPERSTRUCTURE","NODE_BOOM"),"stick":("NODE_BOOM","NODE_STICK"),"bucket":("NODE_STICK","NODE_STICK")}
    for name,(base_node,rod_node) in cylinder_nodes.items():
        parts = [name+"_cylinder_"+s for s in ("barrel","rod","gland","end_base","end_rod")]
        anchors = ["ANCHOR_"+name.upper()+"_CYL_"+s for s in ("BASE","ROD")]
        check(name+"_cylinder_parts_anchors",all(ob.get(n) and ob[n].type == "MESH" for n in parts) and
              all(ob.get(n) and ob[n].type == "EMPTY" for n in anchors))
        check(name+"_cylinder_ownership",ob[parts[0]].parent.name == base_node and ob[parts[1]].parent.name == rod_node and
              ob[anchors[0]].parent.name == base_node and ob[anchors[1]].parent.name == rod_node)
        a,b = [ob[n].matrix_world.translation.copy() for n in anchors]
        barrel,rod = ob[parts[0]],ob[parts[1]]
        bp,rp = points(barrel),points(rod)
        bn,rn = len(bp)//2,len(rp)//2
        ba,bb = sum(bp[:bn],Vector())/bn,sum(bp[bn:],Vector())/bn
        ra,rb = sum(rp[:rn],Vector())/rn,sum(rp[rn:],Vector())/rn
        check(name+"_neutral_cylinder_alignment",(ba-a).length<EPS and (rb-b).length<EPS and
              (bb-ba).normalized().cross((rb-ra).normalized()).length<EPS and
              (ra-a).cross((b-a).normalized()).length<EPS)
        cylinder_records[name] = {"parts":parts,"base_anchor":anchors[0],"rod_anchor":anchors[1],
                                  "neutral_endpoints_m":[list(a),list(b)],"coupling":"STATIC; deferred to Stage 6"}
    check("linkage_separate",all(ob.get(n) and ob[n].type == "MESH" for n in
          ("bucket_linkage_rocker","bucket_linkage_connecting_link","linkage_rocker_pin_boss","linkage_bucket_pin_boss")))
    check("linkage_anchor_markers",all(ob.get("ANCHOR_LINKAGE_"+s) for s in ("ROCKER_PIVOT","CYL_PIN","LINK_PIN","BUCKET_PIN")))
    check("linkage_anchor_ownership",all(ob["ANCHOR_LINKAGE_"+s].parent.name ==
          ("NODE_BUCKET" if s == "BUCKET_PIN" else "NODE_STICK") for s in ("ROCKER_PIVOT","CYL_PIN","LINK_PIN","BUCKET_PIN")))
    check("finite_vertices",all(math.isfinite(c) for o in meshes for v in o.data.vertices for c in v.co))
    check("visible_neutral_auxiliaries",all(not o.hide_render for o in meshes if o.get("uncoupled_auxiliary")))
    # Independently accumulate canonical matrices and test every new primary
    # detail vertex. Static hydraulic/linkage proxies deliberately excluded.
    neutral = {n:ob[n].matrix_world.copy() for n in NODES}
    local = {n:ob[n].matrix_basis.copy() for n in NODES}
    snapshots = {o.name:points(o) for o in new if not o.get("uncoupled_auxiliary")}
    articulate()
    try:
        expected = {}
        for i,n in enumerate(NODES):
            rot = Matrix.Rotation(math.radians(ANGLES.get(n,0)),4,"Y")
            expected[n] = expected[NODES[i-1]]@local[n]@rot if i else local[n]@rot
        articulation_error = 0
        for n,ps in snapshots.items():
            node = ob[n].parent.name
            delta = expected[node]@neutral[node].inverted()
            articulation_error = max(articulation_error,max((p-delta@q).length for p,q in zip(points(ob[n]),ps)))
        check("new_primary_detail_follows_nodes",articulation_error<EPS,max_error_m=articulation_error)
    finally:
        reset()
    check("reset_primary_detail",max((p-q).length for n,ps in snapshots.items() for p,q in zip(points(ob[n]),ps))<EPS)
    triangles = 0
    for o in meshes:
        o.data.calc_loop_triangles()
        triangles += len(o.data.loop_triangles)
    report = {"stage":"04 primary detailing","blender_version":bpy.app.version_string,"source_sha256":source_hashes(),
              "checks":checks,"neutral_bbox_m":bounds,"mesh_count":len(meshes),"new_mesh_count":len(new),
              "vertex_count":sum(len(o.data.vertices) for o in meshes),"triangle_count":triangles,
              "cylinders":cylinder_records,"articulation_test_angles_deg":ANGLES,
              "articulation_render_note":"Static uncoupled hydraulic/linkage proxies hidden ONLY in articulated checkpoint, restored in neutral blend.",
              "anchors":[{"name":o.name,"parent":o.parent.name,"world_m":list(o.matrix_world.translation)} for o in owned if o.name.startswith("ANCHOR_")],
              "geometry_ownership":[{"name":o.name,"node":o.parent.name,"static_auxiliary":bool(o.get("uncoupled_auxiliary"))} for o in sorted(meshes,key=lambda x:x.name)],
              "reconstruction":"Added sections, roller representation, teeth, linkage and hydraulic anchors are visual estimates, not certified XE215C coordinates."}
    failed = [n for n,v in checks.items() if not v["pass"]]
    if failed:
        raise AssertionError(f"Stage 04 validation failed: {failed}")
    if write:
        OUT.mkdir(parents=True,exist_ok=True)
        (OUT/"inspection.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(f"PASS: {len(checks)} checks; {len(meshes)} meshes; {triangles} triangles; unchanged base error {error:.9f} m")
    return report


def main():
    artifact = Path(bpy.data.filepath)
    assert artifact.name == "xe215c_stage_04.blend"
    saved = json.loads((OUT/"inspection.json").read_text(encoding="utf-8"))
    assert saved["source_sha256"] == source_hashes(), "Stage 03 source changed"
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE/"xe215c_stage_03.blend"))
    source = capture_source()
    bpy.ops.wm.open_mainfile(filepath=str(artifact))
    validate(source)
    assert saved["source_sha256"] == source_hashes()
    print("PASS: reopened stage 04 and immutable stage 03 hashes")


if __name__ == "__main__":
    main()
