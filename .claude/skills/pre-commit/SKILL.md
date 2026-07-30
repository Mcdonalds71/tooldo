---
name: pre-commit
description: The cleanup and quality gate to run before every commit on tooldo — the anti-"AI wrote this" pass that keeps the public repo reading as senior, human work. Use before staging or committing any change, before opening a PR, or whenever asked to "clean up", "commit", "prepare a PR", or "make this ready to ship". Run it every time; it is not optional.
---

# Skill: pre-commit

Run this before every commit. It's the gate that keeps the public repo looking like disciplined senior work and strips the tells that reveal AI-generated code. Obey `CLAUDE.md`.

## 1. Strip the AI tells (manual scan of the diff)

- [ ] **No narrating comments.** Delete comments that restate the code ("// loop over files", "// set state"). Comments may only explain a non-obvious *why*.
- [ ] **No leftover `console.log` / `console.debug`.**
- [ ] **No dead code** — commented-out blocks, unused functions, unreachable branches.
- [ ] **No unused imports or variables.**
- [ ] **No `TODO`/`FIXME`** left in shipped code (open a real issue instead).
- [ ] **No placeholder copy** — "Lorem ipsum", "Here is…", "Example text". Real copy per the `ux-copy` skill.
- [ ] **No AI-ish phrasing** in any user-facing string or doc ("seamless", "simply", "in today's world", "with just a few clicks").
- [ ] **Consistent naming** — no `data2`, `tmp`, `handleClick2`, `Component1`.
- [ ] **No emoji** and **no Lucide** in the UI (Phosphor only).

## 2. Enforce the architecture

- [ ] Logic lives in `engine.ts`, not the component.
- [ ] No hardcoded design values — colours/space/radius/motion all tokens.
- [ ] No duplicated component — reused/extended the shared one.
- [ ] Tool lists come from `lib/tools.ts` only.
- [ ] Heavy deps are lazy-loaded in a Worker, not imported at module top level.
- [ ] Files are small and single-responsibility (split anything over ~150 lines).

## 3. Types & correctness

- [ ] Zero `any` (use `unknown` + narrowing). No unexplained `@ts-ignore`.
- [ ] Real error handling — no swallowed `catch {}`.
- [ ] `prefers-reduced-motion` respected on any new motion.
- [ ] a11y basics on new UI (semantic elements, labels, focus, contrast).

## 4. Run the gates (all must pass)

```
pnpm typecheck     # tsc --noEmit — no errors
pnpm lint          # biome — no errors or warnings
pnpm test          # vitest unit tests — all green
pnpm test:e2e      # if a flagship flow changed
pnpm build         # production build succeeds
```

## 5. Commit

- Conventional Commits, imperative, lower-case, scoped where useful:
  `feat(pdf): add page reordering` · `fix(images): handle HEIC without EXIF` · `refactor(ds): extract Button states` · `a11y(dropzone): add keyboard support` · `docs: expand architecture notes`.
- Keep the commit atomic — one logical change. Split unrelated changes.
- Write the message so the git log reads as a clear story — this history is part of the portfolio.

If any box is unchecked or any gate fails, fix it before committing. Do not commit partial or failing work.
