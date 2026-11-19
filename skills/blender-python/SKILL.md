---
name: blender-python
description: Script Blender 4.x/5.x with the bpy Python API - scene setup, mesh and material creation, modifiers, batch processing and headless rendering. Use when writing bpy scripts or add-ons, automating Blender, or driving Blender through the blender MCP server.
---

# Blender Python (bpy)

## Principles
- Prefer the **data API** (`bpy.data`, `obj.data`, `bmesh`) over operators (`bpy.ops`). Operators depend on context, selection and mode, and are slow in loops.
- When an operator is unavoidable, scope context explicitly: `with bpy.context.temp_override(active_object=obj, selected_objects=[obj]): bpy.ops.object.shade_smooth()`.
- Link new data to a collection: `bpy.context.collection.objects.link(obj)`.
- Build meshes with `mesh.from_pydata(verts, edges, faces)` then `mesh.validate(); mesh.update()`, or with `bmesh` for edits.
- Materials: create node trees via `mat.use_nodes = True` and `mat.node_tree.nodes['Principled BSDF']`; set inputs by name, not index.
- Units: Blender is metres, +Z up, -Y forward.

## Headless / batch
```bash
blender -b scene.blend --python-expr "import bpy; bpy.ops.render.render(write_still=True)"
blender -b -P script.py -- --input in.fbx --out out.glb   # args after --
```
Parse args with `sys.argv[sys.argv.index('--') + 1:]`.

## Via MCP (blender-mcp)
- Inspect first (`get_scene_info`, `get_object_info`), then run small, idempotent code chunks.
- Name every created object; re-running a script must not duplicate it (look up by name, reuse).
- Take a viewport screenshot after visual changes to verify.

## Add-ons
- Ship `bl_info` or a `blender_manifest.toml` (extensions, 4.2+); register/unregister every class symmetrically.
