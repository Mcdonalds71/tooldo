import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `public/_headers` is applied by Cloudflare, so nothing in the local build exercises
 * it. These assertions are the guard: they fail if the policy is quietly widened.
 */

const headers = readFileSync('public/_headers', 'utf8');
const csp = headers.match(/Content-Security-Policy:\s*(.+)/)?.[1] ?? '';

describe('the shipped security headers', () => {
  it('sets a content security policy at all', () => {
    expect(csp.length).toBeGreaterThan(0);
  });

  it.each([
    ["default-src 'self'", 'no source is allowed by accident'],
    ["object-src 'none'", 'plugins are a legacy XSS vector'],
    ["frame-ancestors 'none'", 'clickjacking'],
    ["base-uri 'self'", 'a rewritten base tag redirects every relative URL'],
    ["form-action 'self'", 'posting user input off-site'],
  ])('keeps %s — %s', (directive) => {
    expect(csp).toContain(directive);
  });

  it('scopes connect-src to self plus exactly the Hugging Face hosts the Background Remover needs', () => {
    // The privacy promise is about files, not every network request: the model itself
    // is a public, cacheable download with nothing of the visitor's in it, fetched once
    // from huggingface.co and the CDN its redirect resolves to. Everything else in the
    // suite still makes zero outbound requests, which is what this pins down — a third
    // host showing up here later should fail this test, not slip in unnoticed.
    const connectSrc = csp
      .split(';')
      .find((directive) => directive.trim().startsWith('connect-src'));

    expect(connectSrc?.trim().split(/\s+/)).toEqual([
      'connect-src',
      "'self'",
      'https://huggingface.co',
      'https://*.hf.co',
    ]);
  });

  it('never allows full eval — only the narrower wasm-unsafe-eval the image codecs need', () => {
    // A plain substring check would false-positive on 'wasm-unsafe-eval' itself, which
    // contains 'unsafe-eval' as text but grants a much narrower permission: compiling a
    // WebAssembly module, not evaluating a JS string. Tokenising checks the real claim.
    const tokens = csp.split(/[\s;]+/);

    expect(tokens).not.toContain("'unsafe-eval'");
  });

  it('scopes wasm-unsafe-eval to script-src, where the image codecs actually run', () => {
    const scriptSrc = csp.split(';').find((directive) => directive.trim().startsWith('script-src'));

    expect(scriptSrc).toContain("'wasm-unsafe-eval'");
  });

  it('allows inline only where Astro, Radix and Motion force it, and nowhere else', () => {
    const inlineDirectives = csp
      .split(';')
      .map((directive) => directive.trim())
      .filter((directive) => directive.includes("'unsafe-inline'"))
      .map((directive) => directive.split(' ')[0]);

    expect(inlineDirectives.sort()).toEqual(['script-src', 'style-src']);
  });

  it.each([
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Cross-Origin-Opener-Policy',
  ])('still sends %s', (header) => {
    expect(headers).toContain(`${header}:`);
  });

  it('asks to be preloaded into the HSTS list', () => {
    expect(headers).toMatch(/Strict-Transport-Security:.*preload/);
  });
});
