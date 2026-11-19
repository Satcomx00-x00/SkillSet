---
name: rust-async
description: Build async Rust services with Tokio - runtime setup, task spawning, cancellation, channels, timeouts, and tracing; avoid blocking and lock-across-await bugs. Use when writing async Rust, axum/tonic/reqwest code, or debugging hangs, deadlocks or slow async code.
---

# Async Rust with Tokio

## Rules
1. **Never block the runtime**: CPU-heavy or blocking I/O goes in `tokio::task::spawn_blocking` (or rayon).
2. **Don't hold a `std::sync::Mutex` guard across `.await`.** Scope the guard, or use `tokio::sync::Mutex` only when the lock must span awaits.
3. Every spawned task is owned: keep its `JoinHandle` or use `tokio::task::JoinSet`; propagate panics and errors.
4. **Cancellation**: futures can be dropped at any `.await`. Use `tokio_util::sync::CancellationToken` for graceful shutdown and keep state consistent at await points.
5. Bound everything: `mpsc::channel(n)` not unbounded, `tokio::time::timeout` on network calls, `Semaphore` for concurrency limits.
6. Use `tokio::select!` with care: branches that lose are dropped; prefer `biased;` when order matters.
7. Async traits: native `async fn` in traits (Rust 1.75+); add `+ Send` bounds via `trait_variant` when spawning.

## Observability
`tracing` + `tracing-subscriber` with `#[instrument(skip(big_args))]` on handlers; `tokio-console` to find stuck tasks.

## Service skeleton
```rust
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_env_filter("info").init();
    let app = axum::Router::new().route("/health", axum::routing::get(|| async { "ok" }));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, app).with_graceful_shutdown(async { tokio::signal::ctrl_c().await.ok(); }).await?;
    Ok(())
}
```
