---
name: web-backend
description: Design and implement secure, observable HTTP backends - REST/JSON API design, validation, authN/authZ, database access, errors, rate limiting, and caching (Node/Bun with Hono or Fastify, or any stack). Use when building or reviewing API endpoints, auth flows, database schemas or server middleware.
---

# Web backend

## API design
- Resource-oriented URLs, plural nouns, standard verbs; `201` + `Location` on create, `204` on delete, `409` on conflicts, `422` on validation errors.
- Errors as RFC 9457 Problem Details (`application/problem+json`) with a stable `type`.
- Cursor pagination for lists; idempotency keys for unsafe retries (payments, orders).
- Version through the URL (`/v1`) or a header; never break a published contract silently. Publish an OpenAPI spec generated from the code's schemas.

## Request handling
1. Validate every input (body, query, params, headers) with a schema at the edge; reject unknown fields.
2. Keep handlers thin: parse → call a domain service → map result to HTTP. Business logic never touches `req`/`res`.
3. Inject dependencies (DB, clock, mailer) so services are unit-testable.

## Security
- AuthN: sessions in `HttpOnly; Secure; SameSite=Lax` cookies, or short-lived JWT access + rotating refresh tokens. Hash passwords with Argon2id. Prefer passkeys/OIDC over rolling your own.
- AuthZ on every request, checked server-side against the resource owner/role (no IDOR).
- Parameterised queries / ORM only; never string-built SQL. Rate-limit auth and expensive endpoints. Set CORS to explicit origins.
- Secrets from env/secret manager, never in code or logs.

## Data
- Migrations in version control (Drizzle, Prisma, Alembic, sqlx); every change is forward-only and reversible by a new migration.
- Transactions around multi-write operations; indexes for every hot `WHERE`/`JOIN`; watch for N+1 queries.

## Operability
Structured JSON logs with a request ID, OpenTelemetry traces/metrics, `/healthz` (liveness) and `/readyz` (readiness), graceful shutdown on SIGTERM.
