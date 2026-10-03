"""Stage 02 proportion correction from the immutable Stage 01 blend.

Batch workflow deliberately loads the source checkpoint, modifies its owned
geometry and saves ONLY stage_02 outputs. No GUI, parenting, rig or materials.
"""

import argparse
import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "models/xe215c/stage_01"
OUT = ROOT / "models/xe215c/stage_02"
spec = importlib.util.spec_from_file_location("stage01_helpers", Path(__file__).with_name("stage_01_blockout.py"))
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
base.OUT = OUT
OWNER = "xe215c_stage_02"
base.OWNER = OWNER


def source_hashes():
    paths = list(SOURCE.rglob("*")) + [Path(__file__).with_name(n) for n in
                                     ("stage_01_blockout.py", "check_stage_01.py")]
    return {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(paths) if p.is_file()}


def remove(name):
    obj = bpy.data.objects.get(name)
    if obj is None or obj.get("stage_owner") != OWNER:
        raise ValueError(f"Cannot replace unowned object: {name}")
    data = obj.data
    kind = obj.type
    bpy.data.objects.remove(obj, do_unlink=True)
    if data and data.users == 0:
        {"MESH": bpy.data.meshes, "CURVE": bpy.data.curves,
         "CAMERA": bpy.data.cameras}[kind].remove(data)


def loft(name, rings, collection, origin=(0, 0, 0), tone=.62):
    """Few matched rings for large chamfers/taper; no smoothing modifiers."""
    n = len(rings[0])
    vertices = [p for ring in rings for p in ring]
    faces = [tuple(range(n - 1, -1, -1))]
    for k in range(len(rings) - 1):
        faces += [(k*n+i, k*n+(i+1)%n, (k+1)*n+(i+1)%n, (k+1)*n+i)
                  for i in range(n)]
    faces += [tuple(range((len(rings)-1)*n, len(rings)*n))]
    return base.mesh(name, vertices, faces, collection, origin, tone)


def track_ring(side, y):
    # Continuous faceted band, not individual links; recess reveals the separate
    # crawler beam. End regions retain the exact 4.255 m longitudinal envelope.
    outer = [(-1.731, 0), (1.731, 0), (1.97, .10), (2.09, .27),
             (2.1275, .43), (2.09, .60), (1.98, .76), (1.73, .87),
             (.85, .91), (0, .87), (-.85, .90), (-1.73, .86),
             (-1.98, .74), (-2.09, .59), (-2.1275, .42), (-2.07, .24), (-1.96, .09)]
    inner = [(x*.91, .44+(z-.44)*.67) for x, z in outer]
    n = len(outer)
    vertices = [(x, yy, z) for yy in (y-.3, y+.3) for ring in (outer, inner) for x, z in ring]
    faces = []
    for i in range(n):
        j = (i+1) % n
        faces += [(i, j, 2*n+j, 2*n+i), (n+i, 3*n+i, 3*n+j, n+j),
                  (i, n+i, n+j, j), (2*n+i, 2*n+j, 3*n+j, 3*n+i)]
    obj = base.mesh(f"{side}_track_blockout", vertices, faces, "10_UNDERCARRIAGE", (0,y,.44), .38)
    obj["shoe_width_m"] = .600
    obj["contact_length_m"] = 3.462
    obj["front_region"] = "+X idler; -X sprocket, continuous band only"


def modify():
    under, upper, work = "10_UNDERCARRIAGE", "20_UPPERSTRUCTURE", "30_WORKGROUP"
    for side, y in (("left", 1.195), ("right", -1.195)):
        remove(f"{side}_track_blockout")
        remove(f"{side}_crawler_frame")
        track_ring(side, y)
        base.profile(f"{side}_crawler_frame",
                     [(-1.74,.25),(1.72,.25),(1.86,.39),(1.84,.55),
                      (1.60,.65),(.8,.69),(-.8,.68),(-1.60,.63),(-1.86,.51),(-1.86,.39)],
                     y-.24,y+.24,under,tone=.49)

    remove("cab")
    # Shorter fore-aft cab; narrowed/sloped roof and stepped front envelope.
    outline = [(-.40,1.30),(1.45,1.30),(1.45,1.68),(1.29,2.73),
               (1.07,3.10),(-.25,3.10),(-.43,2.91)]
    rings = []
    for y in (.46, 1.405):
        rings.append([(x, y + (.05 if y < 1 else -.05) if z > 2.9 else y, z)
                      for x,z in outline])
    loft("cab", rings, upper, tone=.72)

    remove("engine_body")
    # Rear hood below roof, front service mass on right of mounting tower.
    xy = [(-2.32,-1.29),(-2.12,-1.35),(.75,-1.35),(.84,-1.17),
          (.84,-.48),(-.50,-.48),(-.50,1.30),(-2.12,1.30),(-2.32,1.12)]
    loft("engine_body", [[(x,y,1.30) for x,y in xy],
                          [(x,y,2.12) for x,y in xy],
                          [(x*.97,y*.94,2.28) for x,y in xy]],upper,tone=.64)

    remove("counterweight")
    radius = 2.890
    a = math.asin(1.415/radius)
    arc = [(-radius*math.cos(-a+2*a*i/16), radius*math.sin(-a+2*a*i/16)) for i in range(17)]
    # Inset the deck beneath the rear shell: avoid coincident exterior faces
    # inherited from stage 01 while retaining full width at the forward deck.
    remove("main_upper_platform")
    deck = [(x+.06,y*.98) for x,y in arc] + [(-1.90,1.415),(1.45,1.415),
            (1.58,1.25),(1.58,-1.25),(1.45,-1.415),(-1.90,-1.415)]
    base.plan_volume("main_upper_platform",deck,1.05,1.30,upper,.51,origin=(0,0,1.05))
    footprint = arc + [(-2.20,1.415),(-2.02,1.25),(-2.02,-1.25),(-2.20,-1.415)]
    # Full-radius lower belt and recessed top shoulder soften rear massing.
    loft("counterweight", [[(x,y,1.05) for x,y in footprint],
                           [(x,y,1.92) for x,y in footprint],
                           [(x+.10,y*.93,2.18) for x,y in footprint]],upper,tone=.61)

    # Mechanical pose reconstruction: folded stick rises back toward the bucket
    # pin; bucket hangs from that pin. The stick head defines forward envelope.
    stick_dz = .55
    v = Vector((-math.sqrt(2.910**2-stick_dz**2),0,stick_dz))/2.910
    normal = Vector((-v.z,0,v.x))
    stick_outline = [(-.25,-.32),(.12,-.34),(.75,-.25),(2.65,-.12),
                     (2.91,-.12),(3.04,0),(2.91,.13),(2.50,.16),
                     (.60,.34),(-.25,.30)]
    margin = max((v*t+normal*h).x for t,h in stick_outline)
    end = Vector((6.735-margin,0,1.15))
    root_z = 1.64
    root = Vector((end.x-math.sqrt(5.680**2-(end.z-root_z)**2),0,root_z))
    bucket_pin = end + v*2.910
    for name,p in (("PIVOT_BOOM",root),("PIVOT_STICK",end),("PIVOT_BUCKET",bucket_pin)):
        bpy.data.objects[name].location = p
        bpy.data.objects[name]["position_basis"] = "Stage 02 proportional reconstruction, not factory coordinates"
    remove("boom_mounting_base")
    base.profile("boom_mounting_base",[(.30,1.30),(1.25,1.30),(1.20,1.76),
                                        (.78,1.95),(.30,1.70)],-.36,.36,upper,tone=.55)
    for name in ("boom","stick","bucket","bucket_left_cheek","bucket_right_cheek","bucket_cutting_edge"):
        remove(name)

    # Variable longitudinal and transverse box section. Section centers describe
    # the reconstructed knee; pin centers remain exact and independent.
    sections = [(-.15,.02,.25,.30),(0,.02,.29,.31),(.55,.48,.38,.32),
                (1.30,1.04,.42,.33),(1.95,1.17,.37,.32),
                (2.60,1.02,.29,.29),(4.15,.55,.22,.25),
                (5.35,.13,.17,.21),(5.68,0,.14,.20),(5.79,0,.12,.20)]
    rings = []
    chord = end-root
    for t,h,half_height,half_width in sections:
        p = root + chord*(t/5.68) + Vector((0,0,h))
        rings.append([(p.x,-half_width,p.z-half_height),(p.x,half_width,p.z-half_height),
                      (p.x,half_width,p.z+half_height),(p.x,-half_width,p.z+half_height)])
    loft("boom",rings,work,root,.68)["pivot_length_m"] = 5.680
    # Side taper plus cross-width taper, matching a separate welded member.
    stick_xz = [(end+(v*t+normal*h)).xz for t,h in stick_outline]
    rings = []
    for side in (-1,1):
        rings.append([(x,side*(.23-.085*max(0,min(t,2.91))/2.91),z)
                      for (x,z),(t,h) in zip(stick_xz,stick_outline)])
    loft("stick",rings,work,end,.59)["pivot_length_m"] = 2.910

    bx,bz = bucket_pin.x,bucket_pin.z
    # Back/heel wraps down from upper rear pin, floor goes forward to low lip.
    scoop = [(-.14,.02),(-.34,-.29),(-.32,-.69),(-.10,-1.05),
             (.25,-1.30),(.68,-1.36),(1.05,-1.32)]
    shell = [(bx+x,bz+z) for x,z in scoop]
    shell += [(bx+x+.065,bz+z+.065) for x,z in reversed(scoop)]
    base.profile("bucket",shell,-.53,.53,work,bucket_pin,.43)
    cheek = [(bx+x,bz+z) for x,z in scoop]+[(bx+.85,bz-.53),(bx+.25,bz-.09)]
    for side,y in (("left",.53),("right",-.59)):
        base.profile(f"bucket_{side}_cheek",cheek,y,y+.06,work,bucket_pin,.47)
    base.profile("bucket_cutting_edge",[(bx+.97,bz-1.25),(bx+1.15,bz-1.30),
                                        (bx+1.15,bz-1.37),(bx+1.0,bz-1.36)],
                 -.59,.59,work,bucket_pin,.40)
    for name,points in (("GUIDE_boom_pin_centers",[root,end]),
                        ("GUIDE_stick_pin_centers",[end,bucket_pin])):
        for point,co in zip(bpy.data.objects[name].data.splines[0].points,points):
            point.co = (*co,1)
    scene = bpy.context.scene
    scene["stage"] = "02 proportion correction ONLY"
    scene["pose"] = "Reconstructed folded pose; bucket pin high/rear, lip low/forward"
    bpy.context.view_layer.update()


def rebuild():
    hashes = source_hashes()
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE / "xe215c_stage_01.blend"))
    scene = bpy.context.scene
    scene.name = "XE215C_STAGE_02"
    for obj in scene.objects:
        if obj.get("stage_owner") == "xe215c_stage_01":
            obj["stage_owner"] = OWNER
    base.COLS = {name:bpy.data.collections[name] for name in base.COLLECTIONS}
    for col in base.COLS.values():
        col["stage_owner"] = OWNER
    modify()
    assert hashes == source_hashes(), "Stage 01 input changed"
    return hashes


def inspect(write=True):
    report = base.inspect(write=False)
    ob = bpy.data.objects
    pin = ob["PIVOT_BUCKET"].location
    shell_vertices = [ob["bucket"].matrix_world@v.co for v in ob["bucket"].data.vertices]
    lip_lo,lip_hi = base.bounds(ob["bucket_cutting_edge"])
    checks = report["checks"]
    checks["bucket_hangs_below_pin"] = {"pass": sum(p.z < pin.z for p in shell_vertices)/len(shell_vertices) > .8}
    checks["cutting_edge_low_forward"] = {"pass": lip_hi[2] < pin.z-1 and lip_lo[0] > pin.x+.8}
    checks["bucket_ground_clearance"] = {"pass": min(p.z for p in shell_vertices) >= 0}
    checks["cab_left_separate_lower_hood"] = {"pass": base.bounds(ob["cab"])[0][1] > 0 and
        base.bounds(ob["engine_body"])[1][2] < base.bounds(ob["cab"])[1][2]-.6}
    checks["no_parenting_modifiers"] = {"pass": all(not o.parent and not o.modifiers for o in bpy.context.scene.objects if o.get("stage_owner") == OWNER)}
    checks["independent_major_meshes"] = {"pass": all(ob.get(n) and ob[n].type == "MESH" for n in
        ("left_track_blockout","right_track_blockout","main_upper_platform","cab","counterweight","boom","stick","bucket"))}
    checks["overall_width"] = {"actual_m": report["machine_bbox_world_m"]["max"][1]-report["machine_bbox_world_m"]["min"][1],
                               "target_m":2.990,"pass":abs(report["machine_bbox_world_m"]["max"][1]-report["machine_bbox_world_m"]["min"][1]-2.990)<.005}
    report["stage"] = "02"
    report["immutable_stage_01_sha256"] = source_hashes()
    report["reconstruction"] = "Pin positions, pose and shell proportions are estimates from selected references, not certified coordinates."
    cameras = [o for o in bpy.context.scene.objects if o.type == "CAMERA" and o.get("stage_owner") == OWNER]
    views = {"left":(0,1,0),"right":(0,-1,0),"front":(1,0,0),"rear":(-1,0,0),
             "top":(0,0,1),"three_quarter_front":(1,1,.65),"three_quarter_rear":(-1,-1,.65)}
    camera_records = []
    matched = len(cameras) == 7
    for name,direction in views.items():
        camera = ob.get("CAM_"+name)
        target = Vector((1.9225,0,1.55))
        expected = target+Vector(direction).normalized()*24
        rotation = (target-expected).to_track_quat("-Z","Y")
        matched = matched and camera is not None and camera.data.type == "ORTHO"
        if camera:
            matched = matched and (camera.location-expected).length < 1e-5 and abs(camera.data.ortho_scale-11.7)<1e-5
            matched = matched and abs(camera.rotation_euler.to_quaternion().dot(rotation)) > .999999
            camera_records.append({"name":camera.name,"position_m":list(camera.location),
                                   "rotation_rad":list(camera.rotation_euler),"ortho_scale_m":camera.data.ortho_scale})
    checks["stage01_matching_cameras"] = {"pass":matched}
    checks["stage01_matching_resolution"] = {"pass": bpy.context.scene.render.resolution_x == 1400 and
        bpy.context.scene.render.resolution_y == 900 and bpy.context.scene.render.resolution_percentage == 100}
    report["cameras"] = camera_records
    failed = [k for k,v in checks.items() if not v["pass"]]
    if failed:
        raise AssertionError(f"Stage 02 checks failed: {failed}")
    if write:
        OUT.mkdir(parents=True,exist_ok=True)
        (OUT/"inspection.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print("STAGE 02: all",len(checks),"checks PASS")
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inspect-only",action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    if args.inspect_only:
        inspect()
        return
    hashes = rebuild()
    inspect()
    for obj in list(bpy.context.scene.objects):
        if obj.get("stage_owner") == OWNER and obj.type == "CAMERA":
            remove(obj.name)
    base.render_checkpoints()
    inspect()
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"xe215c_stage_02.blend"))
    assert hashes == source_hashes(), "Immutable source files changed"


if __name__ == "__main__":
    main()
