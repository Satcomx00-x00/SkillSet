---
name: python-typed
description: Write modern, fully typed Python 3.12+ managed with uv, linted and formatted with Ruff, and type-checked strictly with Pyright or mypy; validate external data with Pydantic. Use when writing or refactoring Python, setting up pyproject.toml, or when the user asks for typesafe or idiomatic Python.
---

# Typed modern Python

## Toolchain
- **uv** for everything: `uv init`, `uv add pkg`, `uv run …`, `uv lock`. No `pip install` into global envs, no `requirements.txt` as source of truth.
- **Ruff** for lint + format (`ruff check --fix`, `ruff format`). Enable at least `E,F,I,UP,B,SIM,RUF,ANN`.
- **Pyright** (`typeCheckingMode = "strict"`) or mypy `--strict` in CI.

## Typing rules
1. Annotate every function signature, including `-> None`. No bare `Any`; use `object` and narrow.
2. Use builtin generics and PEP 695 syntax: `def first[T](xs: list[T]) -> T | None`, `type UserId = NewType(...)` / `type Json = dict[str, "Json"] | list["Json"] | str | int | float | bool | None`.
3. Model data with `@dataclass(frozen=True, slots=True)` internally and **Pydantic v2** models at I/O boundaries (HTTP, files, env via `pydantic-settings`).
4. Prefer `Protocol` over inheritance for dependencies; inject them.
5. Enumerate states with `enum.StrEnum` or `Literal[...]`, and handle exhaustively with `match` + `assert_never`.
6. Use `pathlib`, f-strings, `contextlib`, and `logging` (no `print` in libraries).
7. Async: `asyncio.TaskGroup`, never fire-and-forget tasks; `httpx.AsyncClient` over `requests` in async code.

## pyproject.toml skeleton
```toml
[project]
requires-python = ">=3.12"
[tool.ruff]
line-length = 100
[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM", "RUF", "ANN"]
[tool.pyright]
typeCheckingMode = "strict"
```

## Done when
`uv run ruff check`, `uv run ruff format --check`, `uv run pyright` and `uv run pytest` all pass.
