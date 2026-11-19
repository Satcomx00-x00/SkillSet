---
name: web-frontend
description: Build accessible, fast, type-safe web UIs with React 19 / Next.js (App Router, Server Components), Tailwind and modern CSS. Use when creating or reviewing components, pages, forms, client state, or fixing accessibility, layout or Core Web Vitals issues.
---

# Web frontend

## Architecture
- **Server first**: render on the server (RSC, SSR, static) by default; add `'use client'` only for interactivity, at the smallest leaf.
- Fetch data where it's rendered (server components / loaders); avoid client fetch waterfalls. Mutations via Server Actions or a typed API client.
- State: URL (search params) > server state (TanStack Query / framework cache) > local `useState` > global store. Global stores are the last resort.
- Validate form input with the same schema (Zod) on client and server.

## Components
- One component, one job; props typed explicitly, no `any`; composition (children/slots) over boolean prop explosions.
- No `useEffect` for derived data or event responses; compute during render or handle in the event.
- Keys are stable IDs, never array indexes for dynamic lists.

## Accessibility (non-negotiable)
- Semantic HTML first: `button`, `a`, `label`, `nav`, `main`, headings in order.
- Every interactive element is keyboard reachable with a visible focus ring; no `div onClick`.
- Images have `alt`; form fields have labels; errors are announced (`aria-live` / `aria-describedby`).
- Colour contrast ≥ 4.5:1; respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Performance
- Budgets: LCP < 2.5 s, INP < 200 ms, CLS < 0.1.
- Optimised images (`next/image` or `srcset` + AVIF/WebP, explicit size), self-hosted fonts with `font-display: swap`.
- Code-split heavy client code (`dynamic()`/`lazy`), keep client JS small; audit with Lighthouse and the bundle analyzer.

## Verify
Use the Playwright MCP to open the page, take a snapshot, tab through it, and check the console for errors before calling UI work done.
