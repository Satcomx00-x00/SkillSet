---
name: rust-idioms
description: Write idiomatic, Clippy-clean Rust (2024 edition) - ownership and borrowing patterns, error handling with thiserror/anyhow, traits, iterators, and crate layout. Use when writing, reviewing or refactoring Rust, fixing borrow-checker errors, or designing a crate's public API.
---

# Idiomatic Rust

## Baseline
- Edition 2024, `cargo fmt`, and `cargo clippy --all-targets -- -D warnings -W clippy::pedantic` (allow specific pedantic lints with a reason).
- `#![forbid(unsafe_code)]` unless the crate genuinely needs `unsafe`; then wrap it in a small, documented safe API with `// SAFETY:` comments.

## Ownership
1. Take `&str`, `&[T]`, `impl AsRef<Path>` in parameters; return owned types.
2. Clone deliberately, not to silence the borrow checker; restructure instead (split borrows, scope blocks, indices).
3. Prefer iterators and combinators over index loops; collect once.
4. Shared mutable state: `Arc<Mutex<T>>` only across threads; single-threaded use `Rc<RefCell<T>>` sparingly or redesign.

## Errors
- Libraries: typed errors with `thiserror`, one enum per module boundary, `#[from]` for wrapping.
- Binaries: `anyhow::Result` with `.context("what failed")` at each layer.
- No `unwrap()`/`expect()` outside tests and proven invariants (document the invariant in `expect`).

## Types and APIs
- Newtypes for domain values (`struct UserId(u64)`), enums for states; make invalid states unrepresentable.
- Builders or `Default` + struct update for many optional params.
- Implement standard traits (`Debug`, `Clone`, `PartialEq`, `Display`, `From`, `TryFrom`) where meaningful; derive `serde` behind a feature flag in libraries.
- Keep `pub` surface minimal; `pub(crate)` by default.

## Tests
Unit tests in `#[cfg(test)] mod tests` beside code, integration tests in `tests/`, `proptest` for invariants, `cargo nextest` for speed.
