# ui-ux

UI/UX design: Web Interface Guidelines reviews (Vercel), design-system intelligence for 15+ stacks (UI UX Pro Max), and WCAG 2.2 accessibility.

| Skill | Source |
| --- | --- |
| `skillset-addyosmani-accessibility` | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills/tree/afa8da9/skills/accessibility) (MIT, vendored, weekly updates) |
| `skillset-nextlevel-ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/6ec2bb5/.claude/skills/ui-ux-pro-max) (MIT, vendored, weekly updates) |
| `skillset-vercel-web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/5a37a63/skills/web-design-guidelines) (MIT (per upstream README), vendored, weekly updates) |

`skillset-nextlevel-ui-ux-pro-max` runs `python3 scripts/search.py` from its own skill folder (upstream docs show a `.claude/skills/ui-ux-pro-max/` path; use the installed skill's folder instead).

## Install

```bash
npx topic-skillset add ui-ux
npx skills add https://github.com/Satcomx00-x00/SkillSet/tree/ui-ux
/plugin install ui-ux@skillset     # after: /plugin marketplace add Satcomx00-x00/SkillSet
```

Add third-party skills to `skillset.json` and run `skillset sync`. Tooling lives on [`main`](https://github.com/Satcomx00-x00/SkillSet).
