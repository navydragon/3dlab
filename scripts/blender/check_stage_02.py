"""Run in Blender with stage_02.blend open. Does not save any artifacts."""

import importlib.util
import json
import sys
from pathlib import Path

import bpy

sys.dont_write_bytecode = True
path = Path(__file__).with_name("stage_02_proportions.py")
spec = importlib.util.spec_from_file_location("stage02", path)
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)


def signature():
    return [(o.name,tuple(o.location),tuple(o.scale),
             tuple(tuple(v.co) for v in o.data.vertices),
             tuple(tuple(p.vertices) for p in o.data.polygons))
            for o in sorted(bpy.context.scene.objects,key=lambda x:x.name)
            if o.type == "MESH" and o.get("stage_owner") == stage.OWNER]


report = stage.inspect(write=False)
saved = json.loads((stage.OUT/"inspection.json").read_text(encoding="utf-8"))
assert saved["immutable_stage_01_sha256"] == stage.source_hashes()
before = signature()
for iteration in range(2):
    stage.rebuild()
    stage.inspect(write=False)
    assert signature() == before, "Rebuilt vertices/faces/origins/scales differ"
    assert saved["immutable_stage_01_sha256"] == stage.source_hashes()
print("PASS: reopened stage 02, two identical reconstructions, immutable stage 01 and matching cameras.")
