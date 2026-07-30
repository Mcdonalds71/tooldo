# ADR 0002 — Client-side-only computation

## Status
Accepted.

## Context
The tools process user files (PDFs, images, video, data). Uploading them creates privacy, cost, and scaling burdens.

## Decision
All computation runs in the browser via WebAssembly and Web APIs. No backend, database, or file upload.

## Consequences
- Privacy is structural, not a promise — no server can receive a file.
- Hosting is static and effectively free at any scale; users' devices do the work.
- The attack surface nearly vanishes (no server/DB/auth/API).
- Trade-off: heavy tools depend on the visitor's device and browser capabilities (WASM, WebGPU) — mitigated with lazy loading and graceful fallbacks.
