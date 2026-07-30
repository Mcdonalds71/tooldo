import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Dependencies point inward: tools, components, layouts and pages may reach into the
 * design system and lib, never the other way round. A failure here means a shared layer
 * has grown a dependency on a feature, which is how a design system starts to rot.
 *
 * Specifiers are resolved rather than pattern-matched, so `design-system/examples`
 * importing `../components` reads as the design system's own folder, which it is.
 */

const INNER_LAYERS = ['src/design-system', 'src/lib'];
const OUTER_LAYERS = ['src/tools', 'src/components', 'src/layouts', 'src/pages'];
const OUTER_ALIAS = /^@(?:tools|components|layouts|pages)\//;
const SPECIFIER = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) return sourceFiles(path);

    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function outwardImports(file: string): string[] {
  const source = readFileSync(file, 'utf8');

  return [...source.matchAll(SPECIFIER)]
    .map(([, specifier]) => specifier ?? '')
    .filter((specifier) => {
      if (OUTER_ALIAS.test(specifier)) return true;
      if (!specifier.startsWith('.')) return false;

      const target = relative(process.cwd(), resolve(dirname(file), specifier)).replaceAll(
        '\\',
        '/',
      );

      return OUTER_LAYERS.some((layer) => target === layer || target.startsWith(`${layer}/`));
    });
}

describe('dependency direction', () => {
  for (const layer of INNER_LAYERS) {
    it(`keeps ${layer} free of imports from the outer layers`, () => {
      const offenders = sourceFiles(layer).flatMap((file) =>
        outwardImports(file).map((specifier) => `${file} imports ${specifier}`),
      );

      expect(offenders).toEqual([]);
    });
  }

  it('catches an outward import when there is one', () => {
    expect(OUTER_ALIAS.test('@tools/pdf/engine')).toBe(true);
    expect(OUTER_ALIAS.test('@design-system/components/Button')).toBe(false);
  });
});
