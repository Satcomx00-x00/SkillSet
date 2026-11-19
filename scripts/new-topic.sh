#!/usr/bin/env bash
# Create an orphan topic branch scaffolded by `skillset init`. Usage: scripts/new-topic.sh <name> "<description>"
set -euo pipefail
name=${1:?topic name}; desc=${2:-"$name skills and MCP servers"}
root=$(git rev-parse --show-toplevel)
wt=$(mktemp -d)
git -C "$root" worktree add --orphan -b "$name" "$wt"
(cd "$wt" && bun "$root/src/cli.ts" init "$name" -d "$desc" && git add -A && git commit -qm "feat($name): scaffold topic")
git -C "$root" worktree remove "$wt"
echo "✔ branch $name created. Add it to .claude-plugin/marketplace.json on main, then: git push -u origin $name"
