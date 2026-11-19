---
name: typescript-tooling
description: Set up or modernise a TypeScript project's toolchain - package manager, tsconfig, Biome lint/format, Vitest or bun test, build and publish (ESM, exports map). Use when scaffolding a TS/Node/Bun project, fixing module resolution errors, or replacing ESLint/Prettier/Jest/ts-node.
---

# TypeScript tooling

## Defaults (2026)
| Concern | Pick | Notes |
| --- | --- | --- |
| Runtime / PM | Bun or Node 22+ with pnpm | Node runs `.ts` natively (type stripping); no ts-node |
| Lint + format | Biome | One tool, one config; replaces ESLint + Prettier |
| Tests | `bun test` or Vitest | Jest only for legacy |
| Type check | `tsc --noEmit` (or `tsgo`) | Run in CI, separate from build |
| Build lib | `tsc` or tsdown | Emit ESM + `.d.ts` |
| Validation | Zod 4 / Valibot | At every I/O boundary |

## package.json
```jsonc
{
  "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
  "files": ["dist"],
  "engines": { "node": ">=22" },
  "scripts": { "check": "tsc --noEmit && biome check . && bun test" }
}
```

## Module resolution
- Node apps/libs: `"module": "NodeNext"`; import with `.ts` + `rewriteRelativeImportExtensions`, or `.js` in source.
- Bundled apps (Vite, Next): `"module": "Preserve"`, `"moduleResolution": "Bundler"`.
- `verbatimModuleSyntax: true` and `import type` for type-only imports.

## Steps when modernising
1. Remove ESLint/Prettier configs and deps; `biome init`, `biome migrate eslint --write`.
2. Replace Jest with Vitest/bun test; keep test files next to sources.
3. Tighten tsconfig (see `typescript-strict`), fix errors file by file.
4. Add a single `check` script and run it in CI on every push.
