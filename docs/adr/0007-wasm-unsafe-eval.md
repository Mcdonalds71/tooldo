# ADR 0007 — `'wasm-unsafe-eval'` in the CSP

## Status
Accepted.

## Context
The Image Converter is the first tool to touch WebAssembly at all: `@jsquash/{jpeg,webp,avif,resize}` and `heic-to` all compile a `.wasm` module before they can decode or encode anything. Chrome refuses `WebAssembly.instantiate()` outright under a `script-src` that has neither `'unsafe-eval'` nor the narrower `'wasm-unsafe-eval'` — confirmed by actually enforcing the shipped policy in a browser and watching every conversion fail with `CompileError: ... violates the following Content Security Policy directive`, not assumed from reading the spec. `astro preview`, which the rest of local testing runs against, doesn't send `public/_headers` at all, so this was invisible until the policy was enforced on purpose.

Nothing before this tool used WebAssembly — pdf-lib and pdf.js are both pure JS — so the gap in the policy was never exercised.

## Decision
Add `'wasm-unsafe-eval'` to `script-src`. It is not the same permission as `'unsafe-eval'` despite sharing the substring: it only allows compiling a WebAssembly module from bytes the other directives already had to approve fetching, not evaluating a JavaScript string. It does not reopen the XSS vector the rest of the policy defends against.

`src/headers.test.ts` now asserts this precisely — tokenising the directive rather than a substring check, since `csp.includes('unsafe-eval')` is true for `'wasm-unsafe-eval'` too and would have let a real `'unsafe-eval'` back in without failing.

## Consequences
- Any future tool that reaches for a WASM codec (video, background removal) already has what it needs; this isn't a per-tool decision.
- The policy is very slightly wider than before, in a way scoped to exactly what it grants: compiling WASM, nowhere else.
- Verify CSP-affecting changes against the real header, not `astro preview`'s absence of one — this is the second time in the project that a policy gap was invisible until specifically checked (the first being the glass `backdrop-filter` bug in tool 1, a rendering issue rather than a security one, but the same root cause: nothing local was exercising the real, deployed headers).
