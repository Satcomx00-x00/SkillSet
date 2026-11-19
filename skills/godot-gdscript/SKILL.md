---
name: godot-gdscript
description: Write idiomatic, statically typed GDScript for Godot 4.x (scenes, nodes, signals, resources, autoloads). Use when creating or editing .gd/.tscn files, structuring a Godot project, or debugging Godot scripts.
---

# Godot 4 GDScript

## Style
- Static typing everywhere: `var speed: float = 200.0`, `func hit(dmg: int) -> void:`. Enable *Untyped Declaration* as an error in Project Settings › Debug › GDScript.
- `snake_case` for files, functions, vars; `PascalCase` for `class_name` and nodes; `CONSTANT_CASE` for consts.
- Script order: `class_name`, `extends`, docstring, signals, enums, consts, `@export`, public vars, private `_vars`, `@onready`, built-in callbacks, public methods, private methods.
- Use `@onready var sprite: Sprite2D = %Sprite` (unique names), never long `get_node("../../X")` paths.

## Architecture
- **Call down, signal up.** Parents call child methods; children emit signals. Siblings talk through the parent or an autoload event bus.
- One responsibility per scene; compose scenes instead of deep inheritance.
- Data in custom `Resource` classes (`class_name WeaponData extends Resource`) edited in the inspector, not hard-coded dictionaries.
- Autoloads only for truly global services (save system, audio, event bus).
- Physics in `_physics_process(delta)`, visuals/input polling in `_process(delta)`; prefer `_unhandled_input` for gameplay input.

## Signals
```gdscript
signal health_changed(current: int, max: int)
health_changed.connect(_on_health_changed)   # Callable syntax, no strings
```

## Before finishing
- No parser warnings in the editor's Output/Debugger.
- Scenes run standalone with F6 when practical.
- Never edit `.import/` or `.godot/`; commit `.tscn`/`.tres` as text.
