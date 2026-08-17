---
name: design-system
description: How to add or modify a component in the tooldo design system. Use whenever creating or changing anything in src/design-system (Button, Card, Dropzone, Toast, Slider, Dialog, EmptyState, etc.), defining or editing design tokens, or when a component needs new states, variants, or dark-mode work. Trigger on "add a component", "update the button", "new variant", "design token", or any change under src/design-system.
---

# Skill: design-system

The design system is the spine of the product — one language across nine tools. Consistency here is what makes the suite read as senior, designed work. Obey `CLAUDE.md`.

## Design language: neo-brutalism (locked)

The house style is **neo-brutalism on the warm "paper, ink & signal" palette**: chunky ink borders (2.5px), hard offset shadows (zero blur, e.g. `4px 4px 0 var(--color-ink)`), pill radii, bold Clash Display labels, one hot vermilion accent. High-contrast, accessible, Gen-Z, unmistakably not-basic. Every hero-surface component (Button, Dropzone, ToolCard, EmptyState, Badge) is built this way.

- **Signature interaction:** hard shadow lifts on hover (`translate(-2px,-2px)`, shadow grows) and snaps down on press (`translate(4px,4px)`, shadow → 0). Focus-visible flips the shadow to vermilion.
- **Neo-brut tokens** live in `tokens.css`: `--btn-radius`, `--btn-border`, `--btn-shadow`, `--btn-shadow-hover`, `--btn-translate-hover`, `--btn-translate-press`, plus card/dropzone equivalents. Components read these — never inline the shadow/border.
- **Restraint rule:** full neo-brut on hero surfaces; dense working UI (option panels, tables, forms) stays calmer — lighter borders, no hard shadows — so tools stay comfortable for real work.
- **No neumorphism, no soft blurry shadows** on hero surfaces. Reference implementation: `docs/inspiration/button-and-upload-style.html`.

## Golden rules

1. **Tokens, never literals.** Every colour, space, radius, font size, shadow, duration, and easing comes from `src/design-system/tokens.css`. No `#hex`, `16px`, or `0.25s` in a component. Missing value? Add a token, don't inline one.
2. **One component per concept.** There is exactly one `Button`, one `Dropzone`, one `EmptyState`. Never fork a second variant — extend the existing one with a prop.
3. **Props over duplication.** Variation is expressed through a typed props API, not copy-pasted components.
4. **Light-first, and stay dark-ready.** The warm paper palette is the v1 theme; dark is deferred. Components read the token layer rather than raw values, so adding dark later is a token swap — but don't ship, or block on, dark-specific work now.
5. **Accessibility is built in, not added later** (checklist below).

## Token layers (`tokens.css`)

- **Primitives:** brand ramp, neutral ramp, semantic (success/warning/danger), shadows.
- **Semantic aliases:** `--color-bg`, `--color-surface`, `--color-text`, `--color-border` — components consume these, not primitives.
- **Component tokens:** `--btn-radius`, `--btn-height-{sm,md,lg}`, `--btn-shadow`, `--card-radius` — so a component's whole look is swappable in one place.
- **Motion tokens:** `--ease-*`, `--dur-*`, spring presets.
- A dark theme would swap values under `[data-theme="dark"]`. Never write a per-component dark override — flip the token.

## Building or changing a component

1. **Define the typed API first.** Variants, sizes, states as a typed props interface. No `any`. Sensible defaults so it's usable with minimal props where reasonable.
2. **Cover every state.** For interactive components: default, hover, active/pressed, focus-visible (visible ring), disabled (no pointer, reduced emphasis), loading (spinner replaces content, width locked to avoid layout shift). "Default" only = not done.
3. **Compose from primitives.** Use Radix for menus, dialogs, sliders, tabs, tooltips, switches — style with tokens. Don't re-solve a11y Radix already handles.
4. **Icons** are Phosphor, passed in or named via a typed prop. Duotone for large, regular for inline. Never emoji.
5. **Motion** uses motion tokens, gated by `useReducedMotion()` (see `animation` skill).
6. **Keep it small.** Over ~150 lines → split. One responsibility per file.
7. **Add a usage example** showing every variant/state — doubles as living docs on the public repo.

## Reference: the standard components

Core: `Button`, `IconButton`, `Card`, `ToolCard`, `Badge`, `Tag`, `Tooltip`, `Dialog`, `Drawer`, `Toast`, `Tabs`, `Menu`, `Slider`, `Switch`, `Checkbox`, `RadioGroup`, `Segmented`, `Progress`, `Spinner`, `Skeleton`, `EmptyState`.
Tool-shared: `Dropzone`, `FileQueue`, `BeforeAfterSlider`, `OptionPanel`, `ResultPanel`, `RangeTrimmer`, `ProcessingOverlay`.

Before creating anything new, check this list — if it exists, extend it.

## Accessibility checklist (every component)

- [ ] Semantic element — not a clickable `<div>`.
- [ ] Keyboard operable; logical tab order; visible focus ring.
- [ ] Icon-only controls have `aria-label`; decorative icons `aria-hidden`.
- [ ] Contrast ≥ WCAG AA in both themes.
- [ ] Touch target ≥ 44px.
- [ ] Respects `prefers-reduced-motion`.
- [ ] Screen-reader friendly (roles, labels, state announced).

## Done when

Typed API, all states, a11y checklist passed, an example rendered, zero hardcoded tokens, `pnpm typecheck && pnpm lint` clean. Commit `feat(ds): …` or `refactor(ds): …`.
