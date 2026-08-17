# ADR 0003 — Pure engine, thin island

## Status
Accepted.

## Context
Nine tools must stay consistent, testable, and readable on a public portfolio repo.

## Decision
Each tool splits into a pure, framework-free `engine.ts` (all computation, fully typed) and a thin `<Tool>.tsx` island (state + orchestration only). Heavy work runs in a Web Worker.

## Consequences
- Engines are unit-testable in isolation with no DOM.
- UI stays thin and uniform across tools.
- The main thread stays free for 60fps motion.
- Trade-off: a little more upfront structure per tool — paid back immediately in testability and consistency.
