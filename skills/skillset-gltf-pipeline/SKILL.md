---
name: skillset-gltf-pipeline
description: Export, validate and optimise glTF 2.0/GLB assets for web and game engines (Draco/Meshopt compression, KTX2 textures, LODs). Use when exporting 3D models, shrinking asset size, fixing glTF validation errors, or preparing models for three.js, Babylon, Godot, Unity or Unreal.
---

# glTF pipeline

## Export (Blender)
- Apply transforms (Ctrl+A › All Transforms) and check normals before export.
- Export `.glb` (single binary) unless the target needs separate textures.
- Use Principled BSDF only; other shader nodes do not translate.
- Name meshes, materials and animations; engines key off these names.

## Validate
```bash
npx gltf-validator model.glb            # zero errors before shipping
npx @gltf-transform/cli inspect model.glb
```

## Optimise (gltf-transform)
```bash
npx @gltf-transform/cli optimize in.glb out.glb \
  --compress meshopt --texture-compress ktx2 --texture-size 2048
```
- **Meshopt** for broad engine support; **Draco** for smallest static meshes (needs decoder at runtime).
- **KTX2/Basis** textures stay compressed on the GPU; use UASTC for normal maps, ETC1S for colour.
- Weld and simplify for LODs: `gltf-transform weld` then `simplify --ratio 0.5`.
- Budget per web hero asset: ≤ 5 MB GLB, ≤ 100k triangles, ≤ 2048² textures.

## Engine notes
- three.js: register `MeshoptDecoder`/`DRACOLoader`/`KTX2Loader` on `GLTFLoader`.
- Godot 4: imports glTF natively; keep scale at 1 m and +Y up after import.
- Report triangle count, draw calls (materials) and file size before/after.
