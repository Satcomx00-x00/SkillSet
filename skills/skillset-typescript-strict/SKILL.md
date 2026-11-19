---
name: skillset-typescript-strict
description: Write and refactor TypeScript to strict, type-safe 2026 standards (strict tsconfig, schema-validated I/O, discriminated unions, no any). Use when writing, reviewing or migrating TypeScript, configuring tsconfig, or when the user asks for "typesafe" code.
---

# Strict TypeScript

## Compiler baseline
Ensure `tsconfig.json` has, at minimum:

```jsonc
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "verbatimModuleSyntax": true,
  "isolatedModules": true,
  "module": "NodeNext"   // or "Preserve" for bundlers
}
```

## Rules
1. **No `any`.** Use `unknown` at boundaries and narrow. No `as` casts except after a runtime check; never `as unknown as T`.
2. **Validate every boundary** (HTTP, files, env, `JSON.parse`, LLM output) with a schema (Zod 4, Valibot, ArkType). Derive types from the schema: `type User = z.infer<typeof User>`.
3. **Model states as discriminated unions**, not optional-field bags. Exhaust with `satisfies never` in the default branch.
4. **`satisfies` over annotations** for config objects so literals stay narrow: `const routes = {...} as const satisfies Routes`.
5. **Readonly by default** for parameters and returned collections (`readonly T[]`, `Readonly<>`).
6. **Errors are values at module seams**: return `{ ok: true, value } | { ok: false, error }` for expected failures; throw only for bugs.
7. **Branded types** for IDs and units that must not mix: `type UserId = string & { readonly __brand: 'UserId' }`.
8. **Depend on interfaces**, inject implementations (I/O, clock, random) so logic stays pure and testable.
9. Prefer `type` imports (`import type`), named exports, and ESM only.
10. Keep functions small and expression-bodied when it reads clearly; no clever one-liners that hide control flow.

## Checklist before finishing
- `tsc --noEmit` passes with zero errors and no new `// @ts-expect-error`.
- No `any`, non-null `!`, or unchecked casts were added.
- Every external input passes through a schema.
