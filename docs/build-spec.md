# Free Tools Suite — Full Build Spec

**For:** Emmanuel Onugwu
**Prepared:** July 28, 2026
**Purpose:** The single source of truth Claude Code builds from. Covers stack, architecture, design system, animation system, per-tool specs, hosting, scale, open-source setup, portfolio framing, and an inspiration-search guide.

**Decisions locked with you:** Full build spec · Code-first with light Figma · Open source (MIT).

---

## 0. TL;DR — The answers to your questions, up front

| Your question | Short answer |
|---|---|
| Do I need to design in Figma first? | **No.** Code-first. Build one Figma file *after* v1 ships — tokens + 3 hero screens — purely as the portfolio artifact. Claude Code builds the real UI from your inspirations + this spec. |
| Can Claude Code build it from scratch with inspirations? | **Yes**, and better than translating a full Figma. Give it reference screenshots + this design system, iterate in the browser. |
| Stack? | **Astro + React islands + TypeScript + Tailwind v4 + Motion (UI) + GSAP (landing scroll).** Details in §2. |
| Hosting? | **Cloudflare Pages** (unlimited free bandwidth, global edge). Vercel is the fine alternative. §7. |
| Scale to thousands/day + future? | Trivial. It's static + client-side compute — the users' own devices do the work. You could serve millions on the free tier. §8. |
| Open source? | **Yes, MIT.** It's a credibility multiplier for you and there are no secrets to protect (everything runs client-side). §9. |
| What's the gap / opportunity? | Every competitor is either **fast-but-ugly-and-privacy-leaking** (iLoveIMG, TinyWow — they upload your files, show ads, rate-limit) or **beautiful-but-single-purpose** (Squoosh — no batch, one tool). Nobody owns **"beautiful + private + batch + a whole suite."** That's your lane. §1. |
| What do I search for inspiration? | Full keyword list for Awwwards, Mobbin, Pinterest, etc. in §11. |

---

## 1. Competitive research + your gap

I looked at the current landscape (Squoosh, iLoveIMG, TinyWow, SmallPDF, remove.bg, PDF24, TinyPNG). Here's what's true in 2026:

**Where the big players are weak:**

- **iLoveIMG / iLovePDF / SmallPDF / TinyWow** upload your files to their servers. That means your IDs, medical scans, contracts, and business assets travel over the network and sit on someone else's disk. They also gate the free tier: iLoveIMG gives ~1 task/hour and caps batches at ~20 images; TinyWow rate-limits daily tasks and sprinkles ads everywhere. Reliability is patchy (TinyWow's tools "occasionally glitch").
- **Squoosh** (Google) is the gold standard for *quality and privacy* — fully in-browser via WebAssembly, works offline as a PWA — but it's **one image at a time, one tool only.** No batch. No suite. Utilitarian UI.
- **Result:** the market splits into "convenient but leaky and ad-filled" vs "private but narrow and plain."

**Your gap — the one-in-a-million position:**

> **Beautiful, private, batch-capable, and a whole suite — in one design language.**

Concretely, your differentiators:

1. **Nothing uploads.** Same privacy truth as Squoosh, stated as the headline promise. This is a *marketing hook*, not just a feature: *"Your files never leave your device."*
2. **Batch everywhere.** The #1 Squoosh complaint is "20 photos = 20 clicks." You do drag-a-folder, queue, process-all, download-a-zip on every relevant tool. This alone beats Squoosh for real work.
3. **One taste-level design system across ten tools.** Nobody in this category has craft. That's exactly why it reads as a portfolio piece — and why founders/recruiters remember it.
4. **No accounts, no ads, no rate limits.** The anti-dark-pattern positioning. Open source underlines the trust.
5. **Offline-first PWA.** Visit once, use forever without internet. Great story, near-free to add with Astro/Vite PWA plugin.

Keep a one-line "why this is different" on the landing page and in the case study. It writes itself: *"The privacy of Squoosh, the range of iLoveIMG, none of the ads or uploads — and it's actually beautiful."*

---

## 2. The stack (and why)

### Recommended stack

| Layer | Choice | Why |
|---|---|---|
| **Meta-framework** | **Astro 7** with **React islands** | Astro ships ~0 KB JS on static pages (landing, tool shells, SEO pages) and hydrates only the interactive tool as a React "island." You get Next-level DX where you need React, and a Lighthouse-100 marketing site everywhere else. This is the sharp choice for an SEO-driven, static, interactive-in-spots tool suite. |
| **Language** | **TypeScript** (strict) | Non-negotiable for a portfolio codebase recruiters will read. |
| **UI runtime** | **React 19** (as islands only) | Each tool is one React island. The rest of the site is zero-JS HTML. |
| **Styling** | **Tailwind CSS v4** + CSS variables for tokens | Fast, and the token layer (see §4) maps cleanly to Tailwind theme vars. |
| **Component primitives** | **Radix UI** (or shadcn/ui built on Radix) | Accessible, unstyled primitives for menus, dialogs, sliders, tabs, tooltips. You style them with your tokens. Saves you from re-solving a11y. |
| **UI animation** | **Motion** (formerly Framer Motion — `npm i motion`, import from `motion/react`) | ~6M weekly downloads, the standard for React UI transitions, gestures, layout animations. Covers ~90% of your micro-interactions. |
| **Landing scroll/hero animation** | **GSAP** (free as of 2025, incl. ScrollTrigger) | The engine behind most award-winning sites. Use it *only* on the landing page for scroll-driven, timeline-heavy hero moments. Don't reach for it inside tools. |
| **Icons** | **Phosphor (duotone)** — not Lucide | Premium, characterful, six weights incl. duotone. Duotone at large sizes reads far richer than Lucide's hairline outlines. Free + open source. See §4.5 for the full icon strategy. |
| **State (per tool)** | React local state + **Zustand** if a tool gets complex | Most tools need nothing beyond `useState`/`useReducer`. Zustand only where a tool has a lot of cross-component state. |
| **PWA / offline** | `@vite-pwa/astro` | One plugin → installable, offline-capable. |
| **Package manager** | **pnpm** | Fast, disk-efficient, monorepo-friendly if you ever split. |
| **Lint/format** | **Biome** (or ESLint + Prettier) | Biome is one fast tool for both; clean for a solo repo. |

### The per-tool compute libraries (all client-side)

| Tool | Library |
|---|---|
| PDF Toolbox | `pdf-lib` (merge/split/rotate/reorder), `pdfjs-dist` (render/preview) |
| Image Converter + Compressor | `@jsquash/*` codecs (MozJPEG, WebP, AVIF, OxiPNG) — the same stack Squoosh uses; `libheif` WASM for HEIC |
| Background Remover | `@huggingface/transformers` (transformers.js) with the **RMBG-1.4 / BiRefNet** model, WebGPU-accelerated where available |
| Video Compressor + Converter | `@ffmpeg/ffmpeg` (ffmpeg.wasm) |
| Invoice Generator | `pdf-lib` or `react-pdf` for layout-rich PDF output |
| Screenshot Beautifier | Native Canvas 2D API (+ optional `html-to-image`) |
| CSV/Excel/JSON | `SheetJS` (xlsx) + a virtualized table (`@tanstack/react-virtual`) |
| Timezone Overlap | `Luxon` or `date-fns-tz`; city data from a small static JSON |
| QR Studio | `qr-code-styling` (logo + colors + SVG/PNG) |
| Text Toolbox | Mostly native JS; `diff` for the diff checker |

> **Heavy libraries (ffmpeg.wasm, transformers.js) must be lazy-loaded** — dynamic `import()` only when the user actually opens that tool, ideally after they drop a file. Never in the initial bundle. Show a small "loading engine…" state with progress. This keeps the landing and light tools instant.

### The one alternative worth knowing

If you'd rather live in a **single React mental model** (one framework, no islands concept), use **Next.js 15** in static-export mode instead of Astro. It's completely viable and the ecosystem is deepest. The trade: heavier JS on your marketing pages and a slightly slower Lighthouse. For *this* product — SEO tool traffic + a landing that should feel featherlight — Astro wins. But there's no wrong answer here; pick the one you'll enjoy maintaining.

---

## 3. Architecture, folder structure, and routing

### Principles

- **Static shell, client compute.** Every route is pre-rendered HTML for SEO and instant paint. The interactive part of each tool is a hydrated island. Zero backend.
- **One shared design system** consumed by every tool. A tool is "a page + an island + a compute module," nothing more.
- **Each tool is independently code-split.** Opening `/pdf` never loads `/video`'s ffmpeg.

### Folder structure

```
free-tools-suite/
├─ public/                      # static assets, model files, favicons, og images
│  ├─ models/                   # background-remover model (or load from CDN)
│  └─ og/
├─ src/
│  ├─ pages/                    # Astro routes → SEO'd static HTML
│  │  ├─ index.astro            # landing
│  │  ├─ pdf.astro              # each tool = one .astro page that mounts its island
│  │  ├─ images.astro
│  │  ├─ background.astro
│  │  ├─ video.astro
│  │  ├─ invoice.astro
│  │  ├─ screenshot.astro
│  │  ├─ csv.astro
│  │  ├─ timezones.astro
│  │  ├─ qr.astro
│  │  ├─ text.astro
│  │  ├─ about.astro
│  │  └─ privacy.astro
│  ├─ tools/                    # one folder per tool = the React island + logic
│  │  ├─ pdf/
│  │  │  ├─ PdfTool.tsx         # the island (client:load / client:visible)
│  │  │  ├─ engine.ts           # pure compute (pdf-lib) — unit-testable, no UI
│  │  │  └─ types.ts
│  │  ├─ images/ …
│  │  └─ …
│  ├─ design-system/            # THE shared system (see §4)
│  │  ├─ tokens.css             # CSS variables: color, space, type, motion
│  │  ├─ components/            # Button, Card, Dropzone, Toast, Slider, Tabs, Dialog…
│  │  ├─ motion/                # reusable Motion variants + transitions
│  │  └─ primitives/            # Radix wrappers styled with tokens
│  ├─ layouts/
│  │  ├─ BaseLayout.astro       # <head>, nav, footer, PWA, analytics
│  │  └─ ToolLayout.astro       # shared tool chrome: title, breadcrumb, privacy badge
│  ├─ components/               # site-level (Nav, Footer, ToolCard, HeroCanvas)
│  ├─ content/                  # optional MDX for tool "how it works" / SEO copy
│  └─ lib/                      # shared utils: zip, download, filesize, worker helpers
├─ tests/                       # engine unit tests (Vitest) + a few Playwright e2e
├─ astro.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
└─ README.md
```

### The "add a new tool" recipe (so the suite scales cleanly)

1. Create `src/tools/<name>/engine.ts` — **pure functions**, no React. This is where the real logic + tests live.
2. Create `src/tools/<name>/<Name>Tool.tsx` — the island: dropzone → options → run → result, built entirely from `design-system` components.
3. Create `src/pages/<name>.astro` — SEO metadata + `<ToolLayout>` + mount the island with `client:visible`.
4. Add a `ToolCard` entry to the landing grid + the tool registry (`src/lib/tools.ts`).

Because every tool shares the same components and the same shape, tool #11 costs you a fraction of tool #1. That *is* the scalability story — and the portfolio story.

### Web Workers for heavy compute

Run ffmpeg.wasm, jsquash codecs, and the background-removal model **inside Web Workers** so the UI thread stays at 60fps and your animations never jank while a file processes. A tiny `lib/worker.ts` helper wraps `postMessage` with progress callbacks. This is the single biggest "feels premium" technical detail.

---

## 4. Design system

This is the spine of the whole thing — the part that makes ten tools feel like one product and reads as senior design work.

### 4.1 Design tokens (CSS variables → Tailwind theme)

Define everything as CSS custom properties in `tokens.css`, then map them into Tailwind. Two themes (light/dark) by swapping variable values under `[data-theme]`.

**Color — the "paper, ink & signal" palette** (adopted from Emmanuel's Figma Make direction). Warm, editorial, memorable: a cream paper base, near-black ink for text, and one hot vermilion "signal" accent used sparingly. This distinctive warmth is a deliberate edge over the generic cool-SaaS look — it's part of what makes the suite feel one-in-a-million.

```css
:root {
  /* Paper (backgrounds/surfaces) */
  --color-paper:      #f4f0e7;   /* page background */
  --color-paper-dim:  #ebe6da;   /* subtle recessed areas */
  --color-card:       #fbf9f3;   /* raised cards/surfaces */

  /* Ink (text) */
  --color-ink:        #16130d;   /* primary text */
  --color-ink-soft:   #57534a;   /* secondary text */
  --color-ink-faint:  #8a857a;   /* hints, captions */

  /* Lines / borders (warm) */
  --color-line:        #d9d3c5;
  --color-line-strong: #c4bcaa;

  /* Signal (the one hot accent — use sparingly: primary CTA, focus, key emphasis) */
  --color-signal:      #ff3b14;
  --color-signal-dark: #d92c08;  /* hover/active */

  /* Semantic */
  --color-success: #1f8a4c;
  --color-warning: #d97706;
  --color-danger:  #dc2626;

  /* Elevation — warm-tinted, soft */
  --shadow-sm: 0 1px 2px rgb(22 19 13 / .05);
  --shadow-md: 0 8px 24px rgb(22 19 13 / .08);
  --shadow-lg: 0 20px 50px rgb(22 19 13 / .12);
}
```

**Accent discipline:** vermilion is a *signal*, not a wash — reserve it for the single primary action, focus rings, and one or two moments of emphasis per view. Everything else is ink-on-paper. Overusing it kills the editorial calm.

**Dark mode:** this direction is intentionally light-first (warm paper). A dark theme is optional and secondary here — if added later, invert to a warm charcoal (`~#1c1a15`) paper with cream ink and the same signal, rather than a cool black. Don't force it for v1.

**Icon tint:** the large duotone Phosphor icons take a warm secondary tint (a paper-dim or soft-ink tone) with signal reserved for accents — see §4.5.

**Type scale** (fluid, 1.25 ratio). Full premium-font guidance in §4.6. The pairing is one characterful display face for headlines + one clean neutral grotesk for UI/body + a mono for code/data.

```
--font-display: "Clash Display", sans-serif;   /* headers — premium, Fontshare, max weight 700 */
--font-sans:    "Inter", system-ui, sans-serif;  /* UI + body */
--font-mono:    "JetBrains Mono", ui-monospace;  /* code/data + mono accents */

--text-xs: .75rem;  --text-sm: .875rem; --text-base: 1rem;
--text-lg: 1.25rem; --text-xl: 1.6rem;  --text-2xl: 2rem;
--text-3xl: 2.75rem; --text-hero: clamp(2.5rem, 6vw, 5rem);
```

**Spacing** — 4px base scale: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`.
**Radius** — `--radius-sm: 8px; --radius-md: 12px; --radius-lg: 20px; --radius-full: 999px`.
**Motion tokens** — see §5.

### 4.2 Component inventory (build these once, reuse everywhere)

**Core:** Button, IconButton, Card, ToolCard, Badge, Tag, Tooltip, Dialog/Modal, Drawer, Toast, Tabs, Dropdown/Menu, Slider, Switch, Checkbox, RadioGroup, Segmented control, Progress bar, Spinner, Skeleton, Empty state.

**Tool-specific (shared across tools):** **Dropzone** (drag-drop + click + paste), **FileList/Queue** (thumbnail, size, remove, reorder), **BeforeAfterSlider** (image compare), **OptionPanel** (settings rail), **ResultPanel** (preview + download / download-all-zip), **RangeTrimmer** (video/audio), **ProcessingOverlay** (progress + cancel).

### 4.3 Button types + states — NEO-BRUTALISM (locked signature style)

**The product's design language is neo-brutalism on the warm "paper, ink & signal" palette.** Chunky ink borders, hard offset shadows (no blur), pill shapes, bold Clash Display labels, one hot vermilion. It's loud, confident, Gen-Z, and — crucially — high-contrast and accessible, unlike neumorphism (which we rejected for its contrast/a11y problems). This is *the* look; build every button, dropzone, tool card, and empty state in it.

**The signature interaction:** the hard shadow lifts on hover and *snaps down* on press (the button translates onto its own shadow). That tactile snap is the whole vibe — bake it into the base Button.

**Button tokens (drive everything from these — one-file restyle):**
```css
--btn-radius:        999px;                 /* pill */
--btn-border:        2.5px solid var(--color-ink);
--btn-shadow:        4px 4px 0 var(--color-ink);   /* hard, zero blur */
--btn-shadow-hover:  6px 6px 0 var(--color-ink);
--btn-translate-hover: -2px, -2px;          /* lifts toward cursor */
--btn-translate-press:  4px, 4px;           /* snaps down onto the shadow */
--btn-height-sm: 40px; --btn-height-md: 48px; --btn-height-lg: 56px;
--btn-font: var(--font-display); --btn-weight: 600;
```

**Variants**
- **Primary** — vermilion fill (`--color-signal`), white text, ink border + hard ink shadow. One per view (e.g. "Compress all"). The loud one.
- **Secondary** — card/paper fill, ink text, ink border + hard shadow. Supporting actions ("Add more files").
- **Ink** — ink fill, paper text. High-emphasis alternative ("Download all").
- **Ghost** — transparent, ink border, no shadow; hover tints paper-dim. Low-emphasis/toolbar.
- **Destructive** — danger fill, same brut treatment. "Remove all."
- **Badge variant** — optional circular icon badge on the right (the "Subscribe" detail), inverted colors.
- **Icon** — square-ish brut icon button, `aria-label` required.

**Sizes:** `sm (40px)`, `md (48px, default)`, `lg (56px, hero CTAs)`. Min touch target 44×44.

**States (every variant defines all):** default, hover (lift + bigger shadow), active/pressed (snap down onto shadow), focus-visible (shadow flips to vermilion — visible, keyboard-friendly), disabled (muted, shadow → line color, no motion), loading (spinner replaces label, width locked).

**Inputs** take the same tactile treatment (chunky ink border + hard shadow), and on focus the shadow flips to vermilion — this is the accessible way to get the soft "neumo" feel you liked without its contrast problems.

**The restraint rule (keeps it classy at ten-tools scale):** go **full neo-brut on the hero surfaces** — buttons, dropzones, tool cards, empty states, the landing. Keep the **dense working UI calmer** — option panels, data tables, long forms use lighter borders and no hard shadows, so real work stays comfortable. Loud where it delights, quiet where it works.

Reference implementation for all of the above (buttons, states, tactile input, dramatic dropzone) lives in `docs/inspiration/button-and-upload-style.html`.

### 4.4 Layout system

- Max content width **1200px**, generous gutters, 12-col grid on desktop.
- **Landing:** hero → tool grid (3-col desktop / 2 tablet / 1 mobile) → privacy promise → "how it works" → footer.
- **Tool page:** two-pane on desktop (left = dropzone/queue, right = options + result), stacked on mobile. Consistent chrome via `ToolLayout`: tool name, one-line description, the **privacy badge** ("🔒 Runs in your browser · nothing uploaded"), and a "back to all tools" link.

### 4.5 Icon system — premium, big, not Lucide

Your call is right: at the sizes this product uses icons (46px tool tiles, 64px feature illustrations, empty-state hero glyphs), Lucide's uniform hairline outlines look generic. Go premium and go **duotone/filled at large sizes** — that's what reads as craft.

**Primary recommendation — Phosphor Icons (duotone weight).** ~9,000 icons, six weights (thin → fill → duotone), first-class React package (`@phosphor-icons/react`), free and open source (MIT). Duotone gives you a two-tone brand-tinted look that feels designed, not defaulted. Use `weight="duotone"` for hero/tool/empty-state icons, `weight="regular"` for inline controls. One library, one visual language, all sizes.

**Premium alternatives (worth the look / small spend):**
- **Solar** — bold + duotone sets that look expensive; a designer favourite for exactly this "premium not basic" brief. Free.
- **Hugeicons** — 46,000+ icons, 7 styles; Pro is a $49 one-time (lifetime). Enormous coverage and a distinctly modern look. Free tier exists.
- **Streamline** — 180,000+ icons, the deepest premium set; paid, best if you want one house style across everything.
- **Iconoir** — clean, 1,600+, free, if you ever want a lighter register.

**Rules so icons look intentional:**
- **One family only.** Never mix Phosphor with Lucide with emoji. Pick one and commit — mixing is the #1 tell of amateur/AI work.
- **The emoji in the landing mockup are placeholders.** Replace every one with the chosen icon set before shipping. Emoji render differently per-OS and instantly cheapen a premium page.
- **Two sizes of intent:** large expressive icons (duotone, 32–64px) for tool tiles, empty states, feature rows; small functional icons (regular, 16–20px) for buttons, inputs, menus.
- **Tint duotone to brand.** Set the secondary duotone colour to `--brand-100` so icons feel part of the system, not stock.
- Tree-shake: import per-icon, never the whole set.

### 4.6 Premium typography — the header font

You want headers that feel premium. The move is a characterful **display** face for headlines paired with a quiet, neutral **sans** for everything else. Because the repo is **public and open source, licensing matters** — use fonts that are free for commercial use and self-hostable (OFL, or the Fontshare licence). Avoid paid webfonts unless you buy a licence and self-host; never hotlink a paid foundry.

**Recommended header faces (free, premium feel, self-hostable):**
- **Clash Display** (Fontshare) — *top pick.* Modern, confident, slightly editorial character on the capitals; the current designer-favourite for next-gen tech brands. Variable. Reads premium at hero sizes.
- **Fraunces** (Google, OFL) — if you want an editorial/serif angle with warmth and personality (great "one-in-a-million" flavour). Variable, tons of optical-size character.
- **General Sans** / **Satoshi** (Fontshare) — cleaner, more neutral display option if Clash feels too characterful.

**Recommended UI/body face:** **Satoshi** (Fontshare) or **Inter** / **Geist** (OFL). Neutral, legible at small sizes, huge weight range. Body should never compete with the display face.

**Premium paid options (only if you'll license + self-host):** *Graphik* (Commercial Type) and anything from *Hoefler&Co* are the "senior designer" tells — but they cost, and for an open-source repo the free Fontshare/Google stack looks just as premium and keeps licensing clean.

**Chosen pairing (locked):** `Clash Display` (headers — Fontshare, max weight 700, so map any 800/900 headings to 600/700) + `Inter` (UI/body) + `JetBrains Mono` (code/data + the mono accent labels/eyebrows that give the editorial feel). Self-host all three via `@fontsource`/Fontshare files in `/public/fonts` with `font-display: swap`, preload the hero weight, and subset to the characters used to keep it fast.

### 4.7 Interactive empty states (not empty-empty)

Great instinct — empty states are where most tools feel dead, and where yours can feel alive. Treat every "nothing here yet" moment as a **mini onboarding + a demo**, never a shrug. Principles:

- **Invite, don't apologize.** No "No files yet." Instead: a headline that names the win ("Drop a photo to remove its background") + one line of what happens + the action itself right there.
- **The dropzone *is* the empty state.** For file tools, the empty state and the drop target are the same element — big, friendly, animated. On drag-over it reacts (border pulses, bg tints, an icon "opens"). Idle, it gently breathes so it doesn't look static.
- **Show, don't tell — the "try me" sample.** Every tool's empty state offers a **one-click sample file** ("No file handy? Try a sample →") that runs the whole flow so a visitor (or recruiter) instantly sees the magic without hunting for a file. This is a huge portfolio moment.
- **Animated illustration, on-brand.** A small looping/animated duotone illustration (Phosphor duotone or a tiny Lottie/SVG animation) themed per tool — the background-remover shows a subject with the checkerboard dissolving in; the QR tool shows a QR assembling. Keep it lightweight and `prefers-reduced-motion`-aware (freeze to a static frame).
- **Contextual empties beyond the first load:** no results after a filter ("Nothing matches 'x' — clear filters"), an error empty ("That file isn't a PDF — try another"), an offline empty. Each with a clear next action, never a dead end.
- **Micro-delight, sparingly.** A subtle cursor-reactive tilt on the illustration, a staggered fade-in of the hint text, a tip that rotates. One tasteful beat per empty state — not a circus.

Build one `<EmptyState>` component (icon/illustration slot, headline, subtext, primary action, optional "try sample") so all ten tools share the pattern and the polish is automatic.

---

## 5. Animation + micro-interaction system

Your ask: "dope related animations, subtle ones and high ones, great micro-interactions, seamless." Here's how to get award-level motion without it feeling like a toy.

### Motion tokens (consistency = polish)

```css
--ease-out: cubic-bezier(.22, 1, .36, 1);     /* default UI easing */
--ease-in-out: cubic-bezier(.65, 0, .35, 1);
--spring-snappy: /* Motion: {type:'spring', stiffness:400, damping:30} */;
--dur-fast: 150ms;   --dur-base: 250ms;   --dur-slow: 450ms;
```

Pick **one easing + one duration family** and use them everywhere. Inconsistent motion is what makes sites feel amateur.

### Three tiers of motion

**Tier 1 — Micro-interactions (subtle, everywhere).** These are the "feels alive" details:
- Buttons: press `scale .97`, hover lift + shadow.
- Cards: hover raise (`y: -4`, shadow-md → lg), cursor-follow tilt on the landing tool cards (small, ±6°).
- Dropzone: border pulses and background tints when a file is dragged over; a satisfying "snap" as files land into the queue (Motion layout animation).
- Inputs/toggles: spring thumb travel; focus rings animate in.
- Toasts: slide+fade from bottom, auto-dismiss with a progress line.
- Success moments: checkmark draw-on, subtle confetti *only* on first successful export (don't overdo).
- Numbers (file size saved, % compressed): count-up animation — this is a huge "wow" for a compressor. "2.4 MB → 340 KB, 86% smaller" animating up feels magical.

**Tier 2 — Transitions (seamless flow).** State changes should never "pop":
- Dropzone → queue → processing → result are one continuous `AnimatePresence` flow, not hard swaps.
- Shared-element feel: the file thumbnail persists from queue into the result via Motion `layoutId`.
- Route changes: Astro **View Transitions** for cross-page morphs (native, buttery, near-free).
- Skeletons for anything that loads (model, ffmpeg engine) so there's never a blank flash.

**Tier 3 — Landing showpieces (high, GSAP).** This is where recruiters go "whoa":
- Hero: a scroll-driven or WebGL-lite moment — e.g. a gradient/mesh that reacts to cursor, or the ten tool icons assembling into a grid on load (GSAP timeline, staggered).
- Scroll-triggered reveals for each section (GSAP ScrollTrigger), parallax on the privacy section.
- An animated "before/after" hero demo showing an image compressing live.
- Keep it **tasteful and fast** — one or two big moments, not a carnival. Award sites win on restraint + one unforgettable beat.

### Accessibility guardrail (also on your list)

Wrap all non-essential motion in a `prefers-reduced-motion` check — provide instant/opacity-only fallbacks. This is both an a11y requirement and something reviewers notice. Build a `useReducedMotion()` gate into your motion helpers so it's automatic, not per-component.

### Performance guardrail

Animate only `transform` and `opacity`. Keep compute in Web Workers so the main thread stays free for 60fps motion. Test on a mid-range phone, not just your laptop.

---

## 6. Per-tool build specs (priority order)

Build order stays as your plan: **1, 2, 5 first · then 3 or 6 for wow · 8–10 evenings · 4, 7 week two.** For each tool, the pattern is identical: **Dropzone/Input → Options → Run in Worker (progress) → Result (preview + download/zip).**

**1. PDF Toolbox** — `/pdf` · `pdf-lib` + `pdfjs-dist`. Merge, split, compress, reorder (drag thumbnails), rotate. Multi-file dropzone, page-thumbnail reorder grid. *Wow:* live page previews + drag-to-reorder with Motion.

**2. Image Converter + Compressor** — `/images` · `@jsquash/*` + `libheif`. HEIC→JPG, PNG↔WebP↔AVIF, bulk resize, **compress-to-target-size**. **Batch queue + download-all-zip** (your edge over Squoosh). *Wow:* before/after slider + animated size-saved counter.

**3. Background Remover** — `/background` · transformers.js + RMBG/BiRefNet, WebGPU. Drop photo → bg gone → download transparent PNG. *Wow:* the reveal animation as background dissolves; checkerboard transparency preview. Highest wow-per-effort — lazy-load the model, show progress.

**4. Video Compressor + Converter** — `/video` · ffmpeg.wasm (Worker). Compress for WhatsApp/email, MP4→GIF, trim, extract audio. *Wow:* range-trimmer scrubber + target-size presets. Warn about large files; lazy-load ffmpeg on file drop.

**5. Invoice Generator** — `/invoice` · `pdf-lib`/`react-pdf`, details in `localStorage`. Form → clean PDF. *Wow:* live PDF preview updating as they type; 2–3 tasteful templates. Your typography craft shows here.

**6. Screenshot Beautifier** — `/screenshot` · Canvas 2D. Gradient/mesh bg, rounded corners, shadow, device frame, padding, export for LinkedIn/X aspect ratios. *Wow:* the presets + your taste. Paste-from-clipboard support.

**7. CSV / Excel / JSON** — `/csv` · SheetJS + virtualized table. Open cleanly, convert formats, quick filter/sort. *Wow:* fast virtualized grid on big files.

**8. Timezone Overlap Finder** — `/timezones` · Luxon. Pick 2–5 cities → visual overlap grid → shareable URL (state in query params). *Wow:* the grid + "best meeting window" highlight.

**9. QR Code Studio** — `/qr` · `qr-code-styling`. Logo + colors + shapes, SVG/PNG export. *Wow:* live restyle as you tweak.

**10. Text Toolbox** — `/text` · native + `diff`. Case converter, word/char counter, remove formatting, diff checker, lorem ipsum. High SEO traffic; each is an afternoon. Ship as tabs within one page.

---

## 7. Hosting + deployment

**Recommended: Cloudflare Pages.**
- Unlimited free bandwidth (Vercel's free tier meters bandwidth) — matters if a tool goes viral.
- Global edge CDN → fast everywhere, which suits a privacy/no-server product.
- Free unlimited static requests, generous build minutes, custom domain + auto HTTPS.
- Git push → auto build/deploy, preview URLs per branch.

**Fine alternative: Vercel** — best-in-class DX and Astro support; only reason to prefer it is if you like the dashboard/previews and won't hit bandwidth limits.

**Domain:** your plan's locked domain `tooldo.online` — register it (Porkbun or Cloudflare Registrar for the cheapest renewal), then point DNS at Pages. Set up: custom domain, `www`→apex redirect, and a strict **CSP** (you have no backend, so lock it down).

**One config note:** ffmpeg.wasm and some WASM codecs need cross-origin isolation headers (`COOP: same-origin`, `COEP: require-corp`) for SharedArrayBuffer/threads. Set these via Pages `_headers` file. Test that image tools still work with COEP on (or scope headers to the video route).

---

## 8. Scale — "thousands daily" and beyond

You're already architected for this, and it's worth understanding *why* it's a non-issue:

- **The users' devices do the compute.** Compression, PDF work, background removal — all run in the visitor's browser. Your server does nothing but hand over static HTML/JS/WASM.
- **Static + CDN = effectively unlimited reads.** Thousands/day is rounding error for a CDN edge. You'd need *millions* of daily users before hosting cost enters the conversation, and even then it's cache hits.
- **Cost stays ~$0** beyond the domain (~$10–15/yr). No database, no server, no per-request billing, nothing to scale, nothing to page you at 3am.
- **Future scaling levers, if you ever want them:** add tools (pure additive, §3 recipe), add an optional "Pro" (bigger local models, desktop app via Tauri) — but you never *have* to. The architecture is the scale story.

**What actually needs attention as you grow** isn't infra, it's: bundle size discipline (lazy-load heavy tools), SEO (per-tool metadata, structured data, fast Core Web Vitals — Astro gives you this), and browser compatibility (feature-detect WebGPU/WASM, graceful fallbacks).

---

## 9. Open source — yes, and how

**Do it. MIT license.** Reasons specific to you:

- **Credibility signal.** A recruiter/founder can *read your actual code* — clean TypeScript, a real design system, tested engine modules. That's stronger than screenshots.
- **No downside.** Everything is client-side; there are no API keys, secrets, or business logic to protect. You're not giving away a moat — the moat is your taste and execution.
- **Social proof compounds.** A clean repo with a great README picks up GitHub stars; stars are a legible signal on a portfolio.
- **Contribution surface.** Others may add tools/translations, which only grows the suite.

**Make the repo itself a portfolio artifact:**
- A **README** with hero image, live link, the "one system, ten tools, built solo" line, stack badges, and a GIF per tool.
- `CONTRIBUTING.md`, an MIT `LICENSE`, conventional commits, a tidy history.
- **Screenshots/GIFs** in the README (huge — most people judge a repo in 10 seconds).
- GitHub Actions: typecheck + lint + unit tests on PR. Green checks read as "this person ships properly."
- Pin it on your GitHub profile.

*(Optional hybrid if you ever get precious about it: open-source the design-system package separately as `@emmanuel/tools-ui` and keep the app private. But for max credibility, just open the whole thing.)*

---

## 10. Portfolio case study framing

**Title:** *"One design system. Ten tools. Built solo."*

**The narrative arc (what makes founders/recruiters DM you):**
1. **Insight** — the market is ugly, leaky, and ad-ridden *or* pretty but narrow. Show the gap (§1).
2. **System** — the tokens → components → motion system. Show the Figma tokens + component library beside the live tools. This is the senior-designer proof.
3. **Craft** — the micro-interactions. Embed short GIFs: the size-saved counter, the background dissolving, drag-to-reorder. Motion is what makes people *feel* quality.
4. **Ship** — "built solo, AI-native workflow, 10 tools live, open source, 100 Lighthouse." Link every tool. Link the repo.
5. **Proof** — usage numbers once live (even "X files processed, 0 uploaded"), GitHub stars, any tweets.

**Placement:** your Work section with the **Products / Landing Pages / Labs** filter you noted. This is the flagship "Product" entry. Lead the case study with a 10-second hero video montage of all ten tools' best moments.

**Why it converts:** it simultaneously proves *design-system thinking* (the thing companies pay seniors for), *shipping ability* (10 live tools), and *modern workflow* (AI-native, solo). Most portfolios prove at most one. Yours proves three in one artifact.

---

## 11. Inspiration search guide

**How to gather references (do this before Claude Code builds — feed it 5–10 screenshots per surface):**

Create a simple board (Figma, Milanote, or a Pinterest board) with three sections: **Landing**, **Tool UI**, **Micro-interactions**. Save the *specific frame* you love and a one-line note on *why*.

**Awwwards** (awwwards.com) — search / filter:
- "tools", "utility", "web app", "SaaS", "product", "minimal", "gradient", "developer tools"
- Sort by "Sites of the Day" + filter category **Technology / Web Application**
- Also mine **Honorable Mentions** — often more practical than the flashy winners.

**Mobbin** (mobbin.com) — best for real product UI patterns:
- "onboarding", "upload", "file", "empty state", "settings", "editor" — study how top apps handle dropzones, queues, progress.

**Godly** (godly.website) and **Land-book** (land-book.com) — curated landing pages:
- filter "minimal", "gradient", "dark", "product", "startup".

**Pinterest** — search terms:
- "SaaS landing page design", "web tool UI", "file upload UI", "dashboard micro interaction", "gradient mesh hero", "product landing page dark", "button states UI kit", "toast notification design", "before after slider UI", "bento grid landing page".

**Dribbble** (dribbble.com) — for component/detail craft:
- "file converter", "upload interaction", "toggle micro interaction", "pricing card", "empty state illustration", "loading state". *Caveat:* Dribbble is often non-functional eye-candy — use for detail inspiration, not layout truth. Mobbin > Dribbble for real UX.

**Motion-specific:**
- **Codrops** (tympanus.net/codrops) — cutting-edge WebGL/GSAP demos for hero ideas.
- **Emil Kowalski's animations.dev** — the reference for tasteful UI micro-interaction craft.
- **Motion examples** (motion.dev/examples) — copy-pasteable patterns for your tier-1/2 interactions.

**Direct competitors to study (for the anti-pattern — what NOT to do, plus what they get right):** squoosh.app (privacy/quality bar, the batch gap), tinypng.com (simplicity), remove.bg (the reveal interaction), iloveimg.com / smallpdf.com (breadth of tooling, but note the ads/upload friction).

**Search strings that map to your exact aesthetic goal:** "premium minimal utility app", "privacy-first tool design", "developer tool landing page", "one product many tools navigation", "bento tool grid".

---

## 12. Suggested build sequence (concrete next steps)

1. **Scaffold** — Astro + React + TS + Tailwind v4 + Motion + Radix + Phosphor + Biome + pnpm. Set up `tokens.css`, self-hosted fonts, `BaseLayout`, `ToolLayout`, Nav, Footer (with your credit link), View Transitions, PWA. Commit `CLAUDE.md` + skills (§14) *first* so every later commit follows the rules.
2. **Design system pass** — build Button (all variants/states), Card, Dropzone, Queue, Toast, ProcessingOverlay, ResultPanel + the motion helpers with `prefers-reduced-motion`. Get these *right* — every tool inherits them.
3. **Ship tool #1 (PDF)** end-to-end as the template. Nail the dropzone→result flow + micro-interactions. This becomes the pattern you clone.
4. **Tools 2 & 5** (Images, Invoice) reusing everything.
5. **Landing page** — now that you have real tools to show, build the hero + GSAP showpieces + tool grid.
6. **Wow tool** — Background Remover (3) or Screenshot Beautifier (6).
7. **Fill in** 8, 9, 10 (evenings), then 4, 7 (week two).
8. **Polish + case study** — Lighthouse pass, a11y pass (your `prefers-reduced-motion` + the portfolio review fixes), record GIFs, write the case study, open the repo.

Ship tool #1 fully before adding breadth — one polished tool + landing beats ten half-done ones for the portfolio.

---

## 13. Senior-level code, architecture & the public repo

The repo is a portfolio artifact people will read. The goal: it should look like a small, disciplined team built it — no AI tells, no scaffolding cruft, no dead code. What makes code read as senior:

**Architecture (the thing reviewers judge first):**
- **Strict separation: logic ≠ UI.** Every tool's real work lives in `engine.ts` as pure, typed, framework-free functions. The React island is a thin shell that calls the engine. This is the single most senior-looking decision — it makes the code testable, portable, and obviously well-reasoned.
- **Dependency direction points inward.** `tools/*` and `components/*` depend on `design-system/*` and `lib/*`, never the reverse. No circular imports (enforce with a lint rule).
- **One canonical way to do each thing.** One dropzone, one download helper, one worker wrapper, one toast API. Repetition/variation is the amateur tell.
- **A tool registry** (`lib/tools.ts`) as the single source of truth — nav, landing grid, sitemap, and routes all derive from it. Adding a tool touches one data file, not five components.
- **Workers, typed.** A generic typed `runInWorker<TIn, TOut>()` helper so heavy compute never blocks the UI and the pattern is consistent across tools.

**Code quality standards to put in `CLAUDE.md` (so every commit follows them):**
- TypeScript `strict` + `noUncheckedIndexedAccess`; **zero `any`** (use `unknown` + narrowing). No `@ts-ignore` without a comment explaining why.
- Small files, single responsibility. A component over ~150 lines is a smell — split it.
- Named exports, no default-export sprawl; consistent import ordering (Biome handles it).
- Meaningful names; no `data2`, `tmp`, `handleClick2`. Comments explain **why**, never **what** — no narrating comments (a classic AI tell).
- Error handling is real: typed error states, user-facing messages via the toast/empty system, never a swallowed `catch {}`.
- Accessibility is part of "done": semantic HTML, labels, focus management, keyboard paths — not bolted on.
- Conventional Commits (`feat:`, `fix:`, `refactor:`…) and small, atomic PRs — the git history itself reads as professional.

**Avoiding "AI wrote this" tells specifically:**
- Delete boilerplate comments, `console.log`s, and unused imports/vars before every commit.
- No over-commenting obvious lines; no giant do-everything files; no inconsistent naming between files.
- Real, specific copy — not "Lorem ipsum" or "Here is the component". The `ux-copy` skill (§14) enforces voice.
- A human-written-sounding README and CHANGELOG (see below), not a generic template dump.

**File organization** — as in §3, plus at the repo root:
```
README.md            CONTRIBUTING.md      CHANGELOG.md        LICENSE (MIT)
.github/             # workflows (CI), issue/PR templates
  workflows/ci.yml   # typecheck + lint + unit tests + build on every PR
CLAUDE.md            # the rules Claude Code follows (see §14)
.claude/skills/      # project skills (see §14)
docs/
  architecture.md    # the "how it's built + why" doc — big senior signal
  adr/               # short Architecture Decision Records (why Astro, why client-side)
  inspiration/       # your reference screenshots (button, fonts, layouts)
```

**The README — make it a showpiece** (this is what most people actually see): a clean hero banner/logo, one-line pitch, the privacy promise, a live-demo link, an animated GIF per flagship tool, a concise "Architecture" section with a small diagram, the stack with reasoning, "run locally" steps, and the "One system, ten tools, built solo" story with a link to your portfolio. Add badges (build passing, license, Lighthouse score). A `docs/architecture.md` that explains the decisions is the thing that makes a senior engineer nod.

---

## 14. Skills & `CLAUDE.md` for Claude Code

Yes — set these up *before* building so every file Claude Code writes obeys them. Two mechanisms:

**A. `CLAUDE.md` at the repo root — the always-on rulebook.** Claude Code reads this automatically on every task. Keep it tight and imperative. It should contain: the stack and versions; the architecture rules from §13 (logic-in-engine, dependency direction, tool registry); the design-token contract (never hardcode a colour/space/radius — always a token); the icon rule (Phosphor only, no emoji, no Lucide); the a11y + `prefers-reduced-motion` requirement; the "no AI tells" checklist; commit conventions; and the "definition of done" for a tool (engine + tests + island + page + registry entry + empty state + a11y pass). Also: how to run tests/lint/build. This one file is what keeps 10 tools consistent.

**B. Project skills in `.claude/skills/` — invocable playbooks for repeated jobs.** Each is a folder with a `SKILL.md`. Recommended set to write:
- **`new-tool`** — the end-to-end recipe for adding a tool: create `engine.ts` (pure + tested), the island from design-system components, the `.astro` page with SEO metadata, the registry entry, the interactive empty state, and a Playwright smoke test. Guarantees every tool ships to the same bar.
- **`design-system`** — how to add/modify a component: token usage, all states (hover/focus/disabled/loading), dark mode, a11y, a Storybook-style example. Prevents drift.
- **`empty-state`** — the §4.7 pattern: headline, subtext, animated duotone illustration, "try a sample", reduced-motion fallback.
- **`animation`** — the motion-token contract, the three tiers, `useReducedMotion` gating, "animate only transform/opacity."
- **`ux-copy`** — the voice: sentence case, verb-first, warm, no filler ("simply/seamless/unlock"), no AI-ish phrasing. Ensures buttons, empties, and errors all sound like one product. *(You already have design/ux-copy and design/design-system skills available — adapt those into project skills so they carry your specifics.)*
- **`pre-commit`** — the cleanup pass: remove logs/dead code/unused imports, run typecheck+lint+tests, check no hardcoded tokens, verify a11y basics. This is your anti-"AI wrote this" gate.
- **`security-check`** — the §15 checklist run before each deploy.

Also enable **CI as a hard gate** (`.github/workflows/ci.yml`): typecheck, lint, unit tests (Vitest), and a build must pass on every PR. Green checks on a public repo read as "this person ships properly."

---

## 15. Security — how to lock it down

Good news: your architecture removes ~90% of the usual attack surface. **No backend, no database, no accounts, no user data stored server-side = nothing to breach, no credentials to leak, no SQL/API to exploit.** That's a genuine security posture, not a shortcut. What remains is front-end and supply-chain hygiene:

**Ship these headers (via Cloudflare Pages `_headers` or `wrangler`):**
- **Content-Security-Policy** — the big one. Lock `script-src` / `style-src` / `connect-src` / `img-src` / `font-src` to `'self'` + only the exact CDNs you use (e.g. the model host). No `unsafe-inline` for scripts (use nonces/hashes). A tight CSP neutralises most XSS.
- **Strict-Transport-Security** (HSTS, long max-age + preload) — force HTTPS always.
- **X-Content-Type-Options: nosniff**, **X-Frame-Options: DENY** (or CSP `frame-ancestors 'none'`) to block clickjacking, **Referrer-Policy: strict-origin-when-cross-origin**, **Permissions-Policy** to disable APIs you don't use (camera, geolocation, etc.).
- The COOP/COEP cross-origin-isolation headers you need for ffmpeg.wasm (§7) — scope them carefully so they don't break other tools.
- Verify the result with securityheaders.com and Mozilla Observatory (aim for A+; it's a nice screenshot for the case study).

**XSS is the main real risk in a client-side app** — because tools take user input (filenames, CSV cells, text, invoice fields) and render it:
- Let React escape by default; **never** `dangerouslySetInnerHTML` with user content. If you must render rich content, sanitise with **DOMSVGsafe/DOMPurify**.
- Treat file contents as untrusted: validate type/size before processing, guard against malformed PDFs/images/zip bombs, cap file sizes, and wrap parsing in try/catch so a crafted file can't crash or hang the tab.
- Sanitise anything that becomes a download filename or a shareable URL param.

**Supply-chain (the most likely way an open-source project actually gets hurt):**
- **Dependabot** (or Renovate) on for automated dependency-update PRs; **`npm audit`/`pnpm audit` in CI**.
- Enable **GitHub secret scanning + push protection** and **CodeQL** code scanning (free for public repos) — these catch vulns and accidental secret commits automatically.
- Pin dependencies via lockfile; review new deps before adding; prefer well-maintained libraries (all the ones in §2 qualify).
- Add a **`SECURITY.md`** with how to report issues, and consider `SLSA`/signed releases later.

**Repo & account hygiene:**
- 2FA on your GitHub; protect `main` (require PR + passing CI); no secrets in the repo (there shouldn't be any — but scanning guarantees it).
- If you add privacy-respecting analytics (§16), pick a cookieless one and document it in the privacy page so the promise stays honest.

Net: with a tight CSP, escaped output, untrusted-file handling, and automated dependency/secret scanning, a static client-side app like this is about as hard to "hack" as a web product gets — there's simply no server to break into.

---

## 16. What more — things worth deciding now

- **Privacy-respecting analytics.** To know your "thousands daily," use a cookieless, no-personal-data tool (Plausible, Umami self-hosted, or Cloudflare Web Analytics). It keeps the privacy promise intact and needs no cookie banner. Track page views + "tool used" events, nothing about the files.
- **SEO is your growth engine.** Per-tool `<title>`/meta/OpenGraph, JSON-LD `SoftwareApplication` structured data, a generated `sitemap.xml` + `robots.txt`, and a short "how it works / FAQ" block on each tool page (this is the search traffic the Text Toolbox etc. live on). Astro makes all of this cheap.
- **Testing bar for a public repo:** Vitest unit tests on every `engine.ts` (pure functions = easy, high-value tests), plus a handful of Playwright smoke tests (drop sample file → get output) for the flagship tools. Visible tests are a senior signal.
- **Performance budget:** set one and enforce it (e.g. landing < 100 KB JS, LCP < 1.5s). Lazy-load heavy WASM tools. Run Lighthouse CI. A 100 score is a portfolio flex.
- **Analytics of trust:** a live "X files processed · 0 uploaded" counter (computed client-side, stored as an aggregate) is a great landing stat and honest.
- **Internationalisation later, not now** — but structure copy in one place so it's addable. Smallpdf's 20 languages are a big traffic lever if this grows.
- **Licensing discipline:** MIT for your code; check every font (Fontshare/OFL — self-host), icon set (Phosphor MIT), and library licence is compatible with a public MIT repo. Keep a `NOTICES` file crediting them — another senior touch.
- **Domain + brand:** lock `tooldo.online` early; set up the apex/www redirect and a simple favicon/OG image set so shared links look sharp.
- **Error monitoring (optional, privacy-safe):** a lightweight client error logger (self-hosted GlitchTip or Sentry with PII scrubbed) so you hear about broken tools without collecting user data.
- **Contribution funnel:** good first issues, a clear `CONTRIBUTING.md`, and issue/PR templates. Even if no one contributes, it signals maturity to recruiters.

---

## Sources

- [TinyWow alternatives & weaknesses — SoftwareWorld](https://www.softwareworld.co/competitors/tinywow-alternatives/)
- [TinyWow review, pros & cons — Outright Systems](https://www.outrightsystems.org/blog/tinywow-digital-toolbox/)
- [iLoveIMG alternatives (privacy) — Resizo](https://www.resizo.in/blog/iloveimg-alternatives/)
- [TinyPNG/iLoveIMG/Squoosh alternatives that never upload — ImageMarker](https://imagemarker.app/en/blog/tinypng-iloveimg-squoosh-alternatives)
- [5 image compression tools compared: privacy, speed, quality (2026) — DEV](https://dev.to/yangjiaqiang12/5-free-image-compression-tools-compared-privacy-speed-and-quality-2026-305n)
- [Building an enhanced Squoosh with WASM (batch gap) — Medium](https://medium.com/@AlixWang/building-an-enhanced-squoosh-high-performance-local-image-compression-with-libimagequant-wasm-514c578c2778)
- [Squoosh alternative, client-side compressor — Asset Melt](https://assetmelt.com/squoosh-alternative)
- [Next.js vs Astro in 2026 — Vercel](https://vercel.com/i/astro-vs-next-js)
- [Astro vs Next.js 2026, JS payload tested — Tech Insider](https://tech-insider.org/astro-vs-nextjs-2026/)
- [Best React animation libraries 2026 — LogRocket](https://blog.logrocket.com/best-react-animation-libraries/)
- [GSAP vs Motion in 2026 — Satish Kumar](https://satishkumar.xyz/blogs/gsap-vs-motion-guide-2026)
- [Best open-source icon libraries 2026 — Hugeicons](https://hugeicons.com/blog/development/best-open-source-icon-libraries)
- [Best free icon sets picked by pro designers — Streamline](https://blog.streamlinehq.com/best-free-icon-sets/)
- [Best fonts for websites 2026 — Untitled UI](https://www.untitledui.com/blog/best-free-fonts)
- [40 best Google Fonts curated 2026 — Typewolf](https://www.typewolf.com/google-fonts)
- [Best type foundries every designer should know — Creative Bloq](https://www.creativebloq.com/design/fonts-typography/the-best-type-foundries-every-designer-should-know)
