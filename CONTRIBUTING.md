# Contributing to tooldo

Thanks for taking a look. tooldo is a suite of free, privacy-first utilities that run entirely in the browser — no backend, no accounts, no uploads. Contributions are welcome, whether it's a bug fix, a new tool, or a docs improvement.

## Ground rules

- Everything runs **client-side**. No servers, no tracking, no collecting user data. A change that breaks that promise won't be merged.
- Keep it **accessible** (keyboard, focus, contrast, reduced-motion) and **fast** (lazy-load heavy libraries, animate only transform/opacity).
- Match the existing **design language** (neo-brutalism on the warm palette) and **code standards** — consistency is the point.

## Getting set up

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

Other commands:

```bash
pnpm build        # production build
pnpm preview      # preview the build
pnpm test         # unit tests (Vitest)
pnpm test:e2e     # smoke tests (Playwright)
pnpm lint         # Biome
pnpm typecheck    # tsc --noEmit
```

## How the project is organised

Read `docs/architecture.md` first — it explains the client-side model, the Astro-islands rendering, and the core rule that all tool logic lives in a pure `engine.ts` separate from the UI. `docs/build-spec.md` is the full spec.

Each tool is: a pure tested `engine.ts` → a thin React island → an `.astro` page → one entry in `src/lib/tools.ts`.

## Adding a tool

Follow the checklist in `.claude/skills/new-tool/SKILL.md`. In short: pure engine + unit tests, island built from shared design-system components, SEO'd page, registry entry, an interactive empty state with a sample file, full a11y, and a smoke test.

## Code standards

- TypeScript `strict`, zero `any`.
- No hardcoded design values — use the design tokens.
- Comments explain *why*, not *what*. No dead code, no leftover `console.log`.
- Phosphor icons only (no emoji, no other icon sets).
- Copy follows the voice in `.claude/skills/ux-copy/SKILL.md` (sentence case, verb-first, no filler).

## Commits & pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(pdf): add page reordering`, `fix(images): handle HEIC without EXIF`, etc.
- Keep PRs small and focused. Fill in the PR template.
- CI (typecheck, lint, tests, build) must pass before review.
- Run the pre-commit checklist (`.claude/skills/pre-commit/SKILL.md`) before pushing.

## Reporting bugs & requesting tools

Open an issue using the templates. For security issues, see `SECURITY.md` — don't open a public issue.

## Licence

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
