"""Bake short-range ambient visibility against the triangles of the Three.js studio."""
import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from PIL import Image, ImageFilter

folder, output = map(Path, sys.argv[sys.argv.index("--") + 1:])
data = json.loads((folder / "charts.json").read_text())
points = np.fromfile(folder / "triangles.bin", dtype="<f4").reshape(-1, 3)
# The static batches contain duplicated triangle vertices. Build the BVH with
# Blender's bulk mesh API so the export also fits on a small development machine.
mesh = bpy.data.meshes.new("Studio bake geometry")
mesh.vertices.add(len(points))
mesh.vertices.foreach_set("co", points.ravel())
mesh.loops.add(len(points))
mesh.loops.foreach_set("vertex_index", np.arange(len(points), dtype=np.int32))
mesh.polygons.add(len(points)//3)
mesh.polygons.foreach_set("loop_start", np.arange(0, len(points), 3, dtype=np.int32))
mesh.update(calc_edges=True)
obj = bpy.data.objects.new(mesh.name, mesh)
bpy.context.collection.objects.link(obj)
graph = bpy.context.evaluated_depsgraph_get()
tree = BVHTree.FromObject(obj, graph)
size, pad = data["size"], data["padding"]
atlas = Image.new("L", (size, size), 255)
axes = ((2,1), (0,2), (0,1))
samples = 40
golden = math.pi * (3 - math.sqrt(5))
print(f"Baking {len(data['charts'])} charts against {len(points)//3:,} triangles", flush=True)

for c in data["charts"]:
    axis, sign = c["axis"], c["sign"]
    u, v = axes[axis]
    ray_dirs = []
    for i in range(samples):
        radius = math.sqrt((i + 0.5) / samples)
        d = Vector((0, 0, 0))
        d[u] = math.cos(i*golden) * radius
        d[v] = math.sin(i*golden) * radius
        d[axis] = sign * math.sqrt(1 - radius*radius)
        ray_dirs.append(d)
    w, h = c["w"], c["h"]
    near = 0.003 if c["kind"] == "top" else 0.012
    reach = 0.52 if c["kind"] == "top" else 1.15
    point = Vector((0,0,0))
    point[axis] = c["plane"] + sign * near
    values = np.empty((h,w), dtype=np.uint8)
    for j, py in enumerate(np.linspace(c["min"][1], c["max"][1], h)):
        point[v] = py
        for k, px in enumerate(np.linspace(c["min"][0], c["max"][0], w)):
            point[u] = px
            blocked = 0.0
            for direction in ray_dirs:
                dist = tree.ray_cast(point, direction, reach)[3]
                if dist is not None:
                    blocked += (1 - dist/reach)**2
            values[j,k] = round(255 * (1 - 0.90 * blocked/samples))
    tile = Image.fromarray(values).filter(ImageFilter.GaussianBlur(0.55))
    padded = Image.fromarray(np.pad(np.asarray(tile), pad, mode="edge"))
    atlas.paste(padded, (c["x"]-pad, c["y"]-pad))
# The runtime uses ordinary image textures, whose v=0 row is at the bottom.
for chart in data["charts"]:
    assert chart["x"] >= pad and chart["y"] >= pad
    assert chart["x"] + chart["w"] + pad <= size and chart["y"] + chart["h"] + pad <= size
assert atlas.getextrema()[0] < 100 and atlas.getextrema()[1] == 255
atlas.transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(output, "WEBP", lossless=True, method=6)
print(f"Wrote {output.name}, {output.stat().st_size:,} bytes", flush=True)
