---
name: setup
description: Run the one-time setup of every installed skill pack in one go (all skills named setup-*, e.g. setup-matt-pocock-skills). Use when the user runs /setup, optionally with skill names, or asks to set up or configure the installed skills for this repo.
disable-model-invocation: true
metadata:
  generated-by: skillset
---

# /setup

Runs each installed `setup-*` skill, one after another. The user typing `/setup` authorises running
them, including skills marked `disable-model-invocation`.

## 1. Discover
Collect every skill whose name starts with `setup-` (excluding this one) from:
- the skills available to you in this session (including plugin skills), and
- skill folders on disk: `.claude/skills`, `.agents/skills`, `.cursor/skills`, `.codex/skills`, `.gemini/skills`,
  and the same folders under the home directory.

De-duplicate by name. If the user passed names (`/setup setup-foo setup-bar`), keep only those.
If none are found, say so and stop.

## 2. Confirm once
List the setup skills with their one-line descriptions, in alphabetical order, and ask:
"Run all of these? (or name the ones to skip)". Wait for the answer.

## 3. Run each, in order
For each selected skill:
1. Read its `SKILL.md` in full, plus any files it tells you to read.
2. Follow it exactly as if the user had typed `/<skill-name>`, including its own questions and confirmations.
3. Finish it completely before starting the next. If one fails or the user aborts it, note why and continue.

Never skip a setup skill's own confirmation steps to go faster.

## 4. Report
Summarise per skill: done / skipped / failed, and the files it created or changed.
