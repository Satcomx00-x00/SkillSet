import { DEFAULT_REPO } from './github.ts';

const SCHEMA_BASE = `https://raw.githubusercontent.com/${DEFAULT_REPO}/main/schemas`;

/** Files written by `skillset init <topic>` on a fresh orphan branch. */
export const topicFiles = (name: string, description: string): Record<string, string> => ({
  '.claude-plugin/plugin.json': json({
    name,
    description,
    version: '0.1.0',
    author: { name: DEFAULT_REPO.split('/')[0] },
  }),
  'skillset.json': json({ $schema: `${SCHEMA_BASE}/skillset.schema.json`, imports: [] }),
  '.mcp.json': json({ mcpServers: {} }),
  [`skills/skillset-${name}-basics/SKILL.md`]: `---
name: skillset-${name}-basics
description: TODO one sentence on what this skill does and when the agent should use it.
---

# ${name} basics

TODO: instructions the agent follows.
`,
  'README.md': `# ${name}

${description}

\`\`\`bash
npx topic-skillset add ${name}            # skills + MCP
npx skills add https://github.com/${DEFAULT_REPO}/tree/${name}   # skills only
\`\`\`

Claude Code: \`/plugin marketplace add ${DEFAULT_REPO}\` then \`/plugin install ${name}@skillset\`.
`,
  '.github/workflows/validate.yml': `name: validate
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/checkout@v5
        with: { repository: ${DEFAULT_REPO}, ref: main, path: .skillset }
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile --cwd .skillset
      - run: bun .skillset/src/cli.ts validate .
`,
});

const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
