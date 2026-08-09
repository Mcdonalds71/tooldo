# ADR 0014 — CSV/JSON Viewer: a hand-written parser, not SheetJS

## Status
Accepted. Supersedes the "SheetJS" entry in `CLAUDE.md`'s stack list for this tool.

## Context
`CLAUDE.md` names SheetJS as the compute library for this category, which is a
reasonable default — it's the standard choice for spreadsheet work in a browser.
Before writing to it, checking what shipping it would actually mean:

`npm view xlsx time` shows the last version published to the npm registry, 0.18.5,
went out on 2022-03-24 — over four years old at the time of this tool. SheetJS did
not stop developing; they moved the actively maintained free/community build to
their own CDN (`cdn.sheetjs.com`) rather than continuing to publish it through npm.
The package on the npm registry specifically — the one `pnpm add xlsx` would pull —
is the one that stopped.

This tool only needs CSV and JSON. SheetJS's real value is the formats a hand-rolled
parser genuinely can't replace — XLS, XLSX, ODS, binary spreadsheet formats with
their own byte-level structure. None of that is in scope here.

## Decision
**A pure, hand-written CSV parser and native `JSON.parse`/`JSON.stringify`, no new
dependency.** The CSV parser is a straightforward character-by-character state
machine — quoted fields, embedded commas and newlines inside quotes, doubled-quote
escaping — the same well-documented shape any CSV parser has, and small enough to
read in one sitting and test exhaustively rather than trust a third party's internals
for. JSON needs no library at all.

**This is a scoped substitution, not a reversal of the stack list.** If a future
tool needs real spreadsheet formats — reading an actual `.xlsx` file's binary
structure — that's the moment to bring in SheetJS, and it should be pulled from
SheetJS's own current CDN distribution rather than the stale npm one. This ADR only
says CSV and JSON specifically don't need it.

## Consequences
- Zero new runtime dependencies for this tool. Smaller bundle, nothing stale in the
  supply chain, and the entire parsing surface is unit-tested rather than partially
  black-boxed behind a library.
- JSON normalizes to the same table shape CSV produces: an array of objects becomes
  rows directly; a single object becomes one row; an array of primitives or a lone
  primitive wraps into a `value` column. Heterogeneous objects (different keys per
  item) take the union of every key seen as the header set, leaving a row's missing
  keys blank rather than dropping data or erroring.
- Duplicate or empty CSV header cells are disambiguated (`Column 2`, `Name (2)`)
  before becoming object keys — a plain `Record` would otherwise silently drop every
  column but the last one sharing a name.
- Parsing still runs through a Worker like every other file-in tool; nothing about
  this decision touches that. The reasoning here is narrowly "which code parses the
  bytes," not "does this tool need a Worker" the way ADR 0011/0012/0013 each asked.
