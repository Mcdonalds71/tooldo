# ADR 0001 — Astro over Next.js

## Status
Accepted.

## Context
The product is SEO-driven utility-tool traffic plus a landing page that must feel featherlight. Interactivity is confined to isolated per-tool islands; there is no backend, auth, or server-rendered user data.

## Decision
Use Astro 5 with React islands. Content pages ship as near-zero-JS static HTML; only each tool's UI hydrates.

## Consequences
- Lighthouse ~100 on content pages; minimal JS shipped.
- Per-tool code splitting is natural.
- Team works in React where it matters, HTML elsewhere.
- Trade-off: the islands mental model is slightly less uniform than an all-React app. Accepted for the performance and SEO win.
