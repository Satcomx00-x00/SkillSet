---
name: game-loop-architecture
description: Design game runtime architecture - fixed-timestep loops, state machines, entity/component composition, input buffering and save data. Use when planning a game's structure, fixing jitter or framerate-dependent bugs, or choosing between ECS, scene trees and state machines (engine-agnostic).
---

# Game loop architecture

## Loop
- Simulate on a **fixed timestep** (e.g. 60 Hz) with an accumulator; render with interpolation `alpha = acc / dt`. Never scale gameplay by a variable frame delta for physics or networking.
- Clamp the accumulator (e.g. ≤ 0.25 s) to avoid the spiral of death.
- Keep simulation deterministic where possible: seeded RNG per system, no wall-clock reads in game logic.

## Structure
| Need | Use |
| --- | --- |
| Few, distinct actors with behaviour | Scene/node tree + composition |
| Thousands of similar entities | ECS / data-oriented arrays |
| Modes (menu, play, pause) and AI behaviour | Explicit state machine, one class per state with `enter/exit/update` |
| Cross-system notifications | Event bus with typed events |

## Input
- Map raw input to **actions**; buffer them for a few frames (jump buffering, coyote time).
- Read input once per tick into a struct consumed by the simulation (enables replays and rollback).

## Persistence
- Version save files; migrate old versions explicitly.
- Serialise data, not engine objects.

## Review checklist
- Does anything depend on frame rate? Test at 30 and 240 FPS.
- Can a system be unit tested without the engine running?
- Is every state transition explicit and logged in debug builds?
