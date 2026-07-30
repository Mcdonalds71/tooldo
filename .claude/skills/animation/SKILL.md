---
name: animation
description: The motion system for tooldo — how to add tasteful, performant, accessible animation and micro-interactions. Use whenever animating anything: button/card/input micro-interactions, state transitions, page transitions, the landing-page showpieces, or any use of Motion or GSAP. Trigger on "animate", "add motion", "micro-interaction", "transition", "hover effect", or work involving motion.
---

# Skill: animation

Motion is what makes the product feel premium — but only with restraint and consistency. Award sites win on one unforgettable beat, not a carnival. Obey `CLAUDE.md`.

## Non-negotiables

1. **Motion tokens only.** Use `--ease-*`, `--dur-*`, and the spring presets from `tokens.css`. One easing + one duration family everywhere. No ad-hoc `cubic-bezier` or random durations.
2. **Animate only `transform` and `opacity`.** Never animate layout-affecting properties (width, height, top, margin) — they jank. Use transforms and `layout` animations instead.
3. **Every non-essential animation is gated by `useReducedMotion()`** with an instant/opacity-only fallback. Build the gate into the motion helpers so it's automatic, not per-component. This is an accessibility requirement.
4. **Compute stays in Workers.** Never let processing block the main thread — 60fps motion depends on it.
5. **Tools use Motion. The landing uses GSAP.** Don't reach for GSAP inside a tool.

## The three tiers

**Tier 1 — Micro-interactions (subtle, everywhere).** The "feels alive" layer.
- Buttons (neo-brut signature): hover lifts toward cursor (`translate(-2px,-2px)`) and the hard shadow grows; press snaps the button down onto its shadow (`translate(4px,4px)`, shadow → 0). Fast (`--dur-fast`). This tactile snap is the product's defining beat.
- Cards: hover raise (`y: -4`, shadow step up), optional small cursor-tilt (±5°) on landing tool cards.
- Dropzone (the dramatic upload — signature moment): on drag-over the whole zone lifts and tilts slightly, the hard shadow floods vermilion and grows, the big glyph jumps up + rotates, a drop-arrow fades in, and file-type tags peek out. Idle, it breathes gently. A spring "snap" as files land in the neo-brut queue (`layout`). Every tool opens with this. Reference: `docs/inspiration/button-and-upload-style.html`.
- Inputs/toggles: spring thumb travel; focus rings animate in.
- Toasts: slide+fade from bottom with a progress line.
- Success beats: checkmark draw-on; count-up on numbers (file size saved, % smaller) — a signature moment for compressors.

**Tier 2 — Transitions (seamless flow).** State changes never "pop".
- `empty → ready → processing → result` is one continuous `AnimatePresence` flow.
- Shared-element feel: a thumbnail persists from queue into result via `layoutId`.
- Cross-page morphs via Astro **View Transitions**.
- Skeletons for anything loading (model, ffmpeg) — never a blank flash.

**Tier 3 — Landing showpieces (high, GSAP).** One or two big beats only.
- Hero moment (cursor-reactive gradient/mesh, or tool icons assembling on load — staggered timeline).
- Scroll-triggered reveals (ScrollTrigger), light parallax on the privacy section.
- A live before/after compression demo.
- Restraint: two big moments max. Fast, purposeful, never blocking scroll.

## Helpers to build/use

- `useReducedMotion()` — the global gate; all motion helpers respect it.
- Shared Motion variants in `src/design-system/motion/` (fadeUp, scaleIn, springPress, staggerChildren) so components don't re-declare transitions.
- A `<Reveal>` wrapper for scroll-in fades (IntersectionObserver + reduced-motion aware).

## Checklist

- [ ] Uses motion tokens + shared variants — no ad-hoc easings/durations.
- [ ] Only `transform`/`opacity` animated.
- [ ] `useReducedMotion()` fallback verified (test with the OS setting on).
- [ ] Motion doesn't block interaction or scroll.
- [ ] GSAP confined to the landing page; Motion elsewhere.
- [ ] 60fps on a mid-range phone, not just desktop.
