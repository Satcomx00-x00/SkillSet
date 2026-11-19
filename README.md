# SkillSet

Topic-scoped [Agent Skills](https://agentskills.io) + MCP servers. **`main` holds the tooling; each topic lives on its own branch.**

| Topic    | Branch                            | Contents                                                                                     |
| -------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| Coding   | [`coding`](../../tree/coding)     | TDD, debugging, code review, strict TS, commits · MCP: context7, sequential-thinking, GitHub |
| Game dev | [`game-dev`](../../tree/game-dev) | Godot 4 / GDScript, game loop architecture · MCP: godot-mcp                                  |
| 3D dev   | [`3d-dev`](../../tree/3d-dev)     | Blender Python, glTF pipeline · MCP: blender-mcp                                             |

The list is generated from [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json), the single source of truth.

## Install

Pick whichever fits your toolchain. All of them read the same branch.

```bash
# 1. SkillSet CLI: skills for every agent + MCP config (npm / bun / pnpm)
npx topic-skillset add coding              # or: bunx topic-skillset add coding
npx topic-skillset add coding game-dev -a claude-code -a cursor -m claude -m vscode -y
npx topic-skillset list

# 2. Skills only, via the standard skills CLI (40+ agents)
npx skills add https://github.com/Satcomx00-x00/SkillSet/tree/coding
npx skills add https://github.com/Satcomx00-x00/SkillSet/tree/coding --skill tdd

# 3. Claude Code plugin marketplace (skills + MCP, auto-updates)
/plugin marketplace add Satcomx00-x00/SkillSet
/plugin install coding@skillset

# 4. Plain git
git clone -b coding --depth 1 https://github.com/Satcomx00-x00/SkillSet.git
```

Before the package is on npm, use `npx github:Satcomx00-x00/SkillSet add coding`.

### `skillset add` options

| Flag                                           | Meaning                                                                                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-a, --agent <id>`                             | Agent(s) for skills, passed to `skills add` (`claude-code`, `cursor`, `codex`, …). Default: prompt                                                    |
| `-s, --skill <name>`                           | Only these skills                                                                                                                                     |
| `-m, --mcp <target>`                           | `claude` (`.mcp.json`), `cursor`, `vscode`, `gemini`, or `none`. Default: detected from `.claude/`, `.cursor/`, `.vscode/`, `.gemini/`, else `claude` |
| `-g, --global`                                 | User scope instead of project                                                                                                                         |
| `--no-skills` / `--dry-run` / `--force` / `-y` | MCP only / preview / overwrite servers / no prompts                                                                                                   |

MCP merges never touch servers you already have unless `--force`. Secrets are `${ENV_VAR}` references, never literals.

## Topic branch layout

```
.claude-plugin/plugin.json   # name, description, version (Claude Code plugin manifest)
skills/<name>/SKILL.md       # custom + vendored skills (agentskills.io format)
.mcp.json                    # { "mcpServers": { … } }
skillset.json                # external skills to vendor
skills.lock.json             # pinned commit + content hash per vendored skill
```

## Custom vs imported skills

Write custom skills directly in `skills/`. Import third-party skills by listing them in `skillset.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/Satcomx00-x00/SkillSet/main/schemas/skillset.schema.json",
  "imports": [
    {
      "repo": "mattpocock/skills",
      "path": "skills/engineering",
      "skills": ["tdd", "diagnosing-bugs"]
    },
    {
      "repo": "DietrichGebert/ponytail",
      "skills": ["ponytail", { "name": "ponytail-review", "as": "lazy-review" }]
    }
  ]
}
```

`skillset sync` sparse-clones each repo, copies the skill folders (plus upstream `LICENSE`) into `skills/`, and pins them in `skills.lock.json`. Vendoring means every install path above works offline from one branch, with no runtime fetches from third parties. `skillset validate` fails if a vendored skill is edited by hand, so local changes go in a renamed custom skill. A weekly workflow on `main` re-syncs each topic and opens a PR with the upstream diff.

## Add a topic

```bash
scripts/new-topic.sh rust "Rust systems programming"   # orphan branch scaffolded by `skillset init`
# add skills, .mcp.json, skillset.json → bun src/cli.ts sync && bun src/cli.ts validate
# add an entry to .claude-plugin/marketplace.json on main (name == branch)
```

Topic branches are orphans: no tooling, no shared history, so installs stay small.

## Develop

```bash
bun install
bun run check      # tsc + biome + tests + marketplace validation
bun run build      # dist/ for npm
```

Code layout: `src/registry.ts` (topics from the marketplace), `src/skills.ts` (delegates to `skills add`), `src/mcp/` (one entry per agent target), `src/sync.ts` (vendoring), `src/validate.ts`, `src/cli.ts`.

## License

MIT for this repo's tooling and custom skills. Vendored skills keep their upstream license, copied next to each skill.
