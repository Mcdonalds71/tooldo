# ADR 0011 — Timezone Finder: no Worker, and a second persistence layer

## Status
Accepted.

## Context
Every tool before this one routes its real work through `runInWorker` — reasonably,
since the work is heavy: parsing a PDF, re-encoding an image, generating a document.
Timezone Finder's only work is date arithmetic against a handful of cities, which
`luxon` does in well under a millisecond regardless of how many are on screen. There
is no operation in this tool a visitor could ever notice on the main thread.

Separately, the brief asked for the same live-updating feel that worked for the
invoice preview — drag a control, watch every city's clock update immediately — and
for the selected cities to be both shareable (a link sent to whoever the visitor is
coordinating with) and remembered (so a solo return visit doesn't start from scratch).

## Decision
**No Worker anywhere in this tool.** `engine.ts` exports plain synchronous functions —
`buildCityTimeline`, `searchCities`, `dayPhase` — called directly from the hook on
every keystroke and every drag of the time control. `runInWorker` exists to keep the
main thread free during real work; routing sub-millisecond arithmetic through a
message-passing boundary would add latency to fix a problem that doesn't exist here.
The rule this suite actually follows is "heavy compute runs in a Worker," not "every
tool has one" — this is the first tool where the honest answer to "is there heavy
compute" is no.

**Two persistence layers, each answering a different question** (extending the
reasoning ADR 0010 opened for the invoice tool's saved business profile, not reusing
it by default). The city list encodes into the URL as a `cities` query parameter,
updated with `history.replaceState` so adding or removing a city doesn't leave a trail
of back-button stops — that's what makes a specific comparison something you can send
to a colleague rather than describe to them. The same list is separately saved to
`localStorage`, so opening the tool again later, alone, picks up where you left off.
The URL wins when both are present: opening a shared link should show that link's
cities, not override them with whatever was saved from a previous session.

**A fresh visit isn't actually empty.** With no URL parameter and nothing saved yet,
the tool detects the visitor's own timezone (`Intl.DateTimeFormat().resolvedOptions()`)
and adds it as the first row — a real, true fact about the visitor rather than a
guessed default. If that exact zone isn't one of the curated cities, the city name is
read off the IANA identifier itself (the last segment, underscores to spaces) rather
than leaving the row blank.

**Day-offset math compares calendar dates, not elapsed time between two midnights.**
The first implementation computed how many hours apart two zones' midnights were and
divided by 24 — which quietly breaks for exactly the cities this tool exists to
compare: a Tokyo viewer at their own midnight watches Los Angeles read the previous
afternoon, seven hours away in absolute time but a full calendar day back, and the
elapsed-time approach reported that as the same day. Comparing the two `DateTime`s'
plain `(year, month, day)` instead — with the zone stripped out entirely — gets this
right regardless of how far apart the two offsets are. Caught by checking the expected
output against real values before writing it into a test as correct, not by the test
itself; a test built on the same wrong assumption would have passed just as cleanly.

## Consequences
- The suite's shape is "a Worker when there's real work to move off the main thread,"
  not "every tool has one." A future tool this simple should ask the same question
  rather than adding `runInWorker` out of habit.
- `citySlug` (`cities.ts`) exists because the display label ("City, Country") contains
  a comma, which a comma-joined URL list would misparse. Diacritics are stripped
  (`\p{Diacritic}` after NFD normalization) so "São Paulo" produces a plain-ASCII slug
  — checked against all 111 curated entries for collisions, not assumed unique.
- `localStorage` now exists in two tools for two independently-argued reasons. Still
  not a default for the other eight — a third tool reaching for it needs its own
  version of this reasoning, the same condition ADR 0010 set.
- The curated city list (`cities.ts`) is ~110 cities, not the full ~400-zone IANA set,
  deliberately weighted so Africa, Asia and South America have real coverage rather
  than one token entry each. Every zone identifier is the current canonical one, even
  where Node's own bundled `Intl.supportedValuesOf('timeZone')` still enumerates a
  pre-2022 alias (Kolkata vs. the enumerated Calcutta, Kyiv vs. Kiev) — both resolve
  correctly, but the current name is what a visitor searching by city expects to see,
  and what a modern browser reports on its own.
