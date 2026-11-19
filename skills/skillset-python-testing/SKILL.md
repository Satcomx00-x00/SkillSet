---
name: skillset-python-testing
description: Write fast, reliable pytest suites - fixtures, parametrisation, property-based tests with Hypothesis, async tests, and coverage. Use when adding or fixing Python tests, setting up pytest config, or debugging flaky tests.
---

# Python testing with pytest

## Layout
- `tests/` mirrors `src/<pkg>/`; files `test_<module>.py`; use `src` layout so tests import the installed package.
- Config in `pyproject.toml` under `[tool.pytest.ini_options]`: `addopts = "-ra --strict-markers --strict-config"`, `testpaths = ["tests"]`.

## Practices
1. One behaviour per test, named for the behaviour: `test_refund_rejects_negative_amount`.
2. **Fixtures** for setup, scoped as narrowly as possible; `tmp_path` for files, `monkeypatch` for env.
3. **`@pytest.mark.parametrize`** for tables of cases, with `ids=` for readable output.
4. **Hypothesis** for pure functions and parsers: `@given(st.text())` finds edge cases you will not.
5. Mock only at boundaries (network, clock, randomness). Prefer fakes implementing a `Protocol` over `unittest.mock` patches of internals.
6. Async: `pytest-asyncio` (or `anyio`) with `asyncio_mode = "auto"`.
7. HTTP: `respx` for httpx, `responses` for requests; never hit real services in unit tests.
8. Coverage: `pytest --cov=src --cov-branch`; treat coverage as a gap finder, not a target.

## Flaky tests
Check for shared state between tests, time/timezone dependence, ordering (`pytest -p no:randomly` vs `pytest-randomly`), and unawaited coroutines. Fix the cause; never add retries to hide it.
