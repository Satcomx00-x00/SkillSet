---
name: conventional-commits
description: Split work into small, reviewable commits with Conventional Commits messages. Use when committing, writing a commit message, preparing a PR, or when the user asks for clean or granular git history.
---

# Conventional, granular commits

## Message format
```
<type>(<scope>)!: <imperative summary, ≤72 chars, no period>

<why, wrapped at 72. What changed is in the diff; explain intent and trade-offs.>

BREAKING CHANGE: <what breaks and how to migrate>   # only if `!`
Refs: #123
```
Types: `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `build`, `ci`, `chore`, `revert`.

## Splitting
1. Run `git status` and `git diff`; group hunks by intent, not by file.
2. One logical change per commit; each commit builds and passes tests.
3. Order: refactors and moves first, then behaviour changes, then tests/docs if separate.
4. Stage partial files with `git add -p`; never mix formatting churn with logic.
5. Never commit secrets, generated artefacts, or unrelated files. Check `git diff --cached` before each commit.

## Don'ts
- No "WIP", "fix stuff", or summaries of the diff.
- Don't amend or force-push shared branches without being asked.
