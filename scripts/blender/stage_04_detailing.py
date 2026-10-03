"""Primary educational detailing on immutable stage 03; static auxiliaries only."""

import importlib.util
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/"models/xe215c/stage_04"
SOURCE = ROOT/"models/xe215c/stage_03/xe215c_stage_03.blend"
OWNER = "xe215c_stage_04"


def module(name, file):
    spec = importlib.util.spec_from_file_location(name,Path(__file__).with_name(file))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


base = module("stage01_mesh_helpers", "stage_01_blockout.py")
base.OWNER = OWNER
parenting = module("stage03_parent_helper", "stage_03_hierarchy_kinematics.py")


def own(obj, node, auxiliary=False):
    bpy.context.view_layer.update()
    parenting.parent_keep_world(obj,bpy.data.objects[node])
    obj["expected_node"] = node
    obj["detail_stage"] = 4
    obj["uncoupled_auxiliary"] = auxiliary
    obj["basis"] = "Proportional visual reconstruction, not factory geometry"
    return obj


def mesh(name, verts, faces, node, tone=.58, auxiliary=False):
    collection = {"NODE_UNDERCARRIAGE":"10_UNDERCARRIAGE","NODE_UPPERSTRUCTURE":"20_UPPERSTRUCTURE",
                  "NODE_BOOM":"30_WORKGROUP","NODE_STICK":"30_WORKGROUP","NODE_BUCKET":"30_WORKGROUP"}[node]
    return own(base.mesh(name,verts,faces,collection,tone=tone),node,auxiliary)


def profile(name, xz, ymin, ymax, node, tone=.58, auxiliary=False):
    n = len(xz)
    verts = [(x,y,z) for y in (ymin,ymax) for x,z in xz]
    faces = [tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,verts,faces,node,tone,auxiliary)


def box(name, low, high, node, tone=.58):
    return profile(name,[(low[0],low[2]),(high[0],low[2]),(high[0],high[2]),(low[0],high[2])],low[1],high[1],node,tone)


def tube(name, a, b, radius, node, tone=.58, segments=16, auxiliary=False, inner=0):
    a,b = Vector(a),Vector(b)
    axis = (b-a).normalized()
    u = axis.cross(Vector((0,0,1)) if abs(axis.z)<.9 else Vector((0,1,0))).normalized()
    v = axis.cross(u)
    verts = [p+(u*math.cos(i*math.tau/segments)+v*math.sin(i*math.tau/segments))*r
             for p in (a,b) for r in ((radius,inner) if inner else (radius,)) for i in range(segments)]
    n = segments
    if inner:
        faces = []
        for i in range(n):
            j = (i+1)%n
            faces += [(i,j,2*n+j,2*n+i),(n+i,3*n+i,3*n+j,n+j),
                      (i,n+i,n+j,j),(2*n+i,2*n+j,3*n+j,3*n+i)]
    else:
        faces = [tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
        faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,verts,faces,node,tone,auxiliary)


def y_eye(name, p, radius, width, node, tone=.56, auxiliary=False):
    p = Vector(p)
    return tube(name,p-Vector((0,width/2,0)),p+Vector((0,width/2,0)),radius,node,tone,16,auxiliary,inner=radius*.38)


def anchor(name, p, node):
    obj = bpy.data.objects.new(name,None)
    base.COLS["00_GUIDES"].objects.link(obj)
    obj["stage_owner"] = OWNER
    obj.location = p
    obj.empty_display_type = "ARROWS"
    obj.empty_display_size = .13
    obj.hide_render = True
    return own(obj,node,True)


def undercarriage():
    node = "NODE_UNDERCARRIAGE"
    for side,y in (("left",1.195),("right",-1.195)):
        for kind,x,r in (("idler",1.775,.325),("sprocket",-1.765,.34)):
            tube(f"{side}_{kind}_wheel",(x,y-.275,.43),(x,y+.275,.43),r,node,.55,20)
            y_eye(f"{side}_{kind}_hub",(x,y,.43),r*.46,.566,node,.49)
        for i,x in enumerate((-1.22,-.81,-.40,0,.40,.81,1.22),1):
            tube(f"{side}_road_roller_{i:02}",(x,y-.266,.245),(x,y+.266,.245),.19,node,.48,14)
        for i,x in enumerate((-.72,.72),1):
            tube(f"{side}_carrier_roller_{i:02}",(x,y-.25,.745),(x,y+.25,.745),.095,node,.54,12)
        # Combined repetitions: simple wedge pads on exposed top/end contour.
        # Clip to accepted envelope instead of expanding length/width/ground.
        band = bpy.data.objects[f"{side}_track_blockout"]
        n = len(band.data.vertices)//4
        path = [band.matrix_world@v.co for v in list(band.data.vertices)[:n]]
        verts,faces = [],[]
        for i in range(1,n):
            a,b = path[i],path[(i+1)%n]
            tangent = (b-a).normalized()
            outward = Vector((tangent.z,0,-tangent.x))
            length = (b-a).length
            count = max(1,round(length/.15))
            for j in range(count):
                c = a+(b-a)*((j+.5)/count)
                half = min(.057,length/count*.40)
                points = []
                for depth in (-.018,.002):
                    for yy,t in ((y-.3,-half),(y+.3,-half),(y+.3,half),(y-.3,half)):
                        p = c+tangent*t+outward*depth
                        points.append((max(-2.1275,min(2.1275,p.x)),yy,max(0,min(.91,p.z))))
                k = len(verts)
                verts.extend(points)
                faces += [tuple(k+t for t in f) for f in ((3,2,1,0),(4,5,6,7),(0,1,5,4),
                                                        (1,2,6,5),(2,3,7,6),(3,0,4,7))]
        mesh(f"{side}_track_treads",verts,faces,node,.49)
        profile(f"{side}_crawler_beam_cap",[(-1.55,.38),(1.56,.38),(1.64,.52),(1.47,.59),(-1.45,.59),(-1.62,.50)],
                y-.249,y+.249,node,.55)
    tube("slew_bearing_ring",(0,0,.89),(0,0,1.015),.835,node,.55,32,inner=.73)
    for side,yy in (("left",.65),("right",-.65)):
        profile(f"x_frame_{side}_gusset",[(-.62,.49),(.62,.49),(.44,.74),(-.44,.74)],yy-.035,yy+.035,node,.52)


def upperstructure():
    node = "NODE_UPPERSTRUCTURE"
    # Opaque neutral display panels on the unchanged cab shell. No glass shader
    # or interior; large seams/mullions are supplied by gaps between panels.
    for side,y in (("left",1.416),("right",.447)):
        profile(f"cab_{side}_main_window",[(.16,1.78),(1.29,1.78),(1.15,2.69),(.99,2.88),(.16,2.88)],y,y+.006,node,.17)
        profile(f"cab_{side}_rear_window",[(-.29,1.87),(.06,1.87),(.06,2.86),(-.24,2.86),(-.31,2.73)],y,y+.006,node,.19)
    mesh("cab_front_windshield",[(1.445,.56,1.84),(1.445,1.29,1.84),(1.315,1.29,2.68),(1.315,.56,2.68)],[(0,1,2,3)],node,.15)
    mesh("cab_front_upper_glazing",[(1.303,.57,2.75),(1.303,1.28,2.75),(1.151,1.28,2.99),(1.151,.57,2.99)],[(0,1,2,3)],node,.18)
    box("cab_roof_cap",(-.27,.51,3.04),(1.08,1.365,3.10),node,.62)
    box("cab_lower_sill",(-.36,1.408,1.31),(1.43,1.433,1.47),node,.53)
    for side,y in (("right",-1.365),("left",1.314)):
        profile(f"engine_{side}_service_panel",[(-2.04,1.43),(-.70,1.43),(-.70,2.08),(-1.98,2.08),(-2.04,2.02)],y,y+.008,node,.58)
    profile("service_front_right_panel",[(-.38,1.41),(.66,1.41),(.66,1.96),(-.38,1.96)],-1.369,-1.360,node,.60)
    box("engine_top_access_panel",(-1.95,-1.10,2.273),(-.78,1.08,2.291),node,.59)
    root = bpy.data.objects["PIVOT_BOOM"].matrix_world.translation
    for sign in (-1,1):
        y_eye(f"tower_pin_support_{'left' if sign>0 else 'right'}",root+Vector((0,sign*.36,0)),.235,.052,node,.53)


def plates_and_bucket():
    for part,node in (("boom","NODE_BOOM"),("stick","NODE_STICK")):
        obj = bpy.data.objects[part]
        world = [obj.matrix_world@v.co for v in obj.data.vertices]
        if part == "boom":
            for sign in (-1,1):
                verts = []
                for k in range(1,9):
                    bottom,top = (world[k*4],world[k*4+3]) if sign<0 else (world[k*4+1],world[k*4+2])
                    b,t = bottom+Vector((0,0,.05)),top-Vector((0,0,.05))
                    verts += [b+Vector((0,sign*.003,0)),t+Vector((0,sign*.003,0)),
                              t+Vector((0,sign*.015,0)),b+Vector((0,sign*.015,0))]
                faces = [(3,2,1,0),(28,29,30,31)]
                for k in range(7):
                    faces += [(4*k+i,4*k+(i+1)%4,4*(k+1)+(i+1)%4,4*(k+1)+i) for i in range(4)]
                mesh(f"boom_{'left' if sign>0 else 'right'}_side_plate",verts,faces,node,.62)
        else:
            n = len(world)//2
            for sign,points in ((-1,world[:n]),(1,world[n:])):
                center = sum(points,Vector())/n
                front = [Vector((center.x+(p.x-center.x)*.94,p.y+sign*.012,center.z+(p.z-center.z)*.86)) for p in points]
                back = [p-Vector((0,sign*.010,0)) for p in front]
                faces = [tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
                faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
                mesh(f"stick_{'left' if sign>0 else 'right'}_side_plate",back+front,faces,node,.54)
    for part,pivot,node,radius,width in (("boom_root","PIVOT_BOOM","NODE_BOOM",.22,.72),
        ("stick_root","PIVOT_STICK","NODE_STICK",.18,.59),("bucket_root","PIVOT_BUCKET","NODE_BUCKET",.14,.75)):
        y_eye(part+"_pin_boss",bpy.data.objects[pivot].matrix_world.translation,radius,width,node,.50)
    p = bpy.data.objects["PIVOT_BUCKET"].matrix_world.translation
    for i,y in enumerate((-.44,-.22,0,.22,.44),1):
        profile(f"bucket_tooth_{i:02}",[(p.x+1.02,p.z-1.22),(p.x+1.34,p.z-1.29),
                (p.x+1.38,p.z-1.34),(p.x+1.07,p.z-1.37)],y-.055,y+.055,"NODE_BUCKET",.55)
    for side,y in (("left",.32),("right",-.32)):
        profile(f"bucket_{side}_wear_rib",[(p.x-.32,p.z-.69),(p.x-.10,p.z-1.05),(p.x+.25,p.z-1.31),
                (p.x+.68,p.z-1.37),(p.x+.68,p.z-1.32),(p.x+.25,p.z-1.26),
                (p.x-.05,p.z-1.00),(p.x-.27,p.z-.66)],y-.035,y+.035,"NODE_BUCKET",.52)
    for side,y in (("left",.28),("right",-.28)):
        profile(f"bucket_{side}_mount_ear",[(p.x-.13,p.z-.20),(p.x+.23,p.z-.20),
                (p.x+.22,p.z+.12),(p.x-.10,p.z+.14)],y-.045,y+.045,"NODE_BUCKET",.52)


def cylinder(prefix, a, b, base_node, rod_node, radius):
    a,b = Vector(a),Vector(b)
    anchor("ANCHOR_"+prefix.upper()+"_CYL_BASE",a,base_node)
    anchor("ANCHOR_"+prefix.upper()+"_CYL_ROD",b,rod_node)
    tube(prefix+"_cylinder_barrel",a,(a+(b-a)*.66),radius,base_node,.48,16,True)
    tube(prefix+"_cylinder_rod",a+(b-a)*.46,b,radius*.44,rod_node,.76,14,True)
    tube(prefix+"_cylinder_gland",a+(b-a)*.63,a+(b-a)*.69,radius*1.09,base_node,.55,16,True)
    y_eye(prefix+"_cylinder_end_base",a,radius*1.16,.18,base_node,.53,True)
    y_eye(prefix+"_cylinder_end_rod",b,radius*1.03,.16,rod_node,.55,True)


def hydraulics_and_linkage():
    root = bpy.data.objects["PIVOT_BOOM"].matrix_world.translation
    end = bpy.data.objects["PIVOT_STICK"].matrix_world.translation
    pin = bpy.data.objects["PIVOT_BUCKET"].matrix_world.translation
    v = (pin-end).normalized()
    normal = Vector((-v.z,0,v.x))
    rocker = pin-v*.43-normal*.18
    rod = rocker-v*.20-normal*.22
    link_end = rocker+v*.32-normal*.28
    bucket_attach = pin+Vector((.45,0,-.15))
    cylinder("boom",(1.12,-.43,1.42),(2.23,-.43,2.39),"NODE_UPPERSTRUCTURE","NODE_BOOM",.115)
    cylinder("stick",(2.60,0,2.91),end+v*.18-normal*.45,"NODE_BOOM","NODE_STICK",.10)
    cylinder("bucket",end+v*.60-normal*.30,rod,"NODE_STICK","NODE_STICK",.08)
    anchor("ANCHOR_LINKAGE_ROCKER_PIVOT",rocker,"NODE_STICK")
    anchor("ANCHOR_LINKAGE_CYL_PIN",rod,"NODE_STICK")
    anchor("ANCHOR_LINKAGE_LINK_PIN",link_end,"NODE_STICK")
    anchor("ANCHOR_LINKAGE_BUCKET_PIN",bucket_attach,"NODE_BUCKET")
    outline = [(rod.x-.05,rod.z+.07),(link_end.x-.08,link_end.z+.04),
               (link_end.x-.02,link_end.z-.08),(rocker.x+.10,rocker.z-.09),(rod.x+.10,rod.z-.04)]
    profile("bucket_linkage_rocker",outline,-.10,.10,"NODE_STICK",.54,True)
    direction = (bucket_attach-link_end).normalized()
    perpendicular = Vector((-direction.z,0,direction.x))*.055
    outline = [(p.x,p.z) for p in (link_end+perpendicular,bucket_attach+perpendicular,
                                    bucket_attach-perpendicular,link_end-perpendicular)]
    profile("bucket_linkage_connecting_link",outline,-.18,.18,"NODE_BUCKET",.58,True)
    for label,p,node in (("rocker",rocker,"NODE_STICK"),("input",rod,"NODE_STICK"),
                          ("link",link_end,"NODE_STICK"),("bucket",bucket_attach,"NODE_BUCKET")):
        y_eye("linkage_"+label+"_pin_boss",p,.078,.28,node,.50,True)


def build(checker):
    hashes = checker.source_hashes()
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    source = checker.capture_source()
    scene = bpy.context.scene
    scene.name = "XE215C_STAGE_04"
    scene["stage"] = "04 primary educational detailing; static hydraulic/linkage proxies"
    for obj in scene.objects:
        if obj.get("stage_owner") == "xe215c_stage_03":
            obj["stage_owner"] = OWNER
    for col in bpy.data.collections:
        if col.get("stage_owner") == "xe215c_stage_03":
            col["stage_owner"] = OWNER
    base.COLS = {name:bpy.data.collections[name] for name in base.COLLECTIONS}
    undercarriage()
    upperstructure()
    plates_and_bucket()
    hydraulics_and_linkage()
    bpy.context.view_layer.update()
    assert hashes == checker.source_hashes()
    return source,hashes


def render(checker):
    scene = bpy.context.scene
    folder = OUT/"checkpoints"
    folder.mkdir(parents=True,exist_ok=True)
    for view in ("left","right","front","rear","top","three_quarter_front","three_quarter_rear"):
        scene.camera = bpy.data.objects["CAM_"+view]
        scene.render.filepath = str(folder/(view+".png"))
        bpy.ops.render.render(write_still=True)
    # Uncoupled static struts would separate under independent joint rotation.
    # Hide only these proxies, explicitly, rather than imply hydraulic coupling.
    proxies = [o for o in scene.objects if o.get("uncoupled_auxiliary")]
    previous = {o.name:o.hide_render for o in proxies}
    try:
        for o in proxies:
            o.hide_render = True
        checker.articulate()
        scene.camera = bpy.data.objects["CAM_three_quarter_front"]
        scene.render.filepath = str(folder/"articulated_primary_geometry.png")
        bpy.ops.render.render(write_still=True)
    finally:
        checker.reset()
        for o in proxies:
            o.hide_render = previous[o.name]


def main():
    checker = module("stage04_checker","check_stage_04.py")
    source,hashes = build(checker)
    checker.validate(source,write=True)
    render(checker)
    checker.validate(source,write=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"xe215c_stage_04.blend"))
    assert hashes == checker.source_hashes()


if __name__ == "__main__":
    main()
