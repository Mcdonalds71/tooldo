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
    ["connect-src 'self'", 'the privacy promise depends on nothing being sent anywhere'],
  ])('keeps %s — %s', (directive) => {
    expect(csp).toContain(directive);
  });

  it('never allows eval, which nothing here needs', () => {
    expect(csp).not.toContain('unsafe-eval');
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
