# coding

General software engineering: TDD, debugging, code review, strict TypeScript, commits.

| Skill | Source |
| --- | --- |
| `typescript-strict` | custom |
| `conventional-commits` | custom |
| `tdd`, `diagnosing-bugs`, `codebase-design`, `code-review` | [mattpocock/skills](https://github.com/mattpocock/skills) (MIT, vendored) |
| `ponytail`, `ponytail-review` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (MIT, vendored) |

| MCP server | Needs |
| --- | --- |
| `context7` | Node 22+ |
| `sequential-thinking` | Node 22+ |
| `github` | `GITHUB_TOKEN` env var |

## Install

```bash
npx topic-skillset add coding
npx skills add https://github.com/Satcomx00-x00/SkillSet/tree/coding
# Claude Code
/plugin marketplace add Satcomx00-x00/SkillSet
/plugin install coding@skillset
```

Vendored skills are pinned in `skills.lock.json`; edit `skillset.json` and run `skillset sync` to change them. Tooling and docs live on [`main`](https://github.com/Satcomx00-x00/SkillSet).
