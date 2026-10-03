"""Inspect a saved checkpoint and verify two reproducible in-session rebuilds.

Run with Blender --background checkpoint.blend --python-exit-code 1 --python
scripts/blender/check_stage_01.py. Does not save or alter on-disk artifacts.
"""

import importlib.util
import sys
from pathlib import Path

import bpy

sys.dont_write_bytecode = True
path = Path(__file__).with_name("stage_01_blockout.py")
spec = importlib.util.spec_from_file_location("stage01", path)
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)


def signature():
    return [
        (obj.name, obj.type, tuple(obj.location), tuple(obj.scale),
         tuple(tuple(v.co) for v in obj.data.vertices) if obj.type == "MESH" else None,
         tuple(tuple(p.vertices) for p in obj.data.polygons) if obj.type == "MESH" else None)
        for obj in sorted(bpy.context.scene.objects, key=lambda item: item.name)
        if obj.get("stage_owner") == stage.OWNER and obj.type in ("MESH", "EMPTY")
    ]


stage.inspect(write=False)
before = signature()
sentinel = bpy.data.objects.new("REPEATABILITY_SENTINEL", None)
bpy.context.scene.collection.objects.link(sentinel)
for iteration in range(2):
    stage.COLS = stage.reset_owned()
    stage.build()
    stage.inspect(write=False)
    assert signature() == before, "Rebuilt geometry or pivots differ from checkpoint"
    assert bpy.data.objects.get(sentinel.name) == sentinel, "Unrelated object removed"
    assert len([obj for obj in bpy.data.objects if obj.name == "boom"]) == 1
print("PASS: checkpoint inspection and two identical rebuilds; unrelated content preserved.")
