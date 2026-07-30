import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Dependencies point inward: tools, components and pages may reach into the design
 * system and lib, never the other way round. A failure here means a shared layer has
 * grown a dependency on a feature, which is how a design system starts to rot.
 */

const INNER_LAYERS = ['src/design-system', 'src/lib'];
const OUTWARD_IMPORT =
  /(?:from|import)\s*\(?\s*['"](?:@(?:tools|components|layouts|pages)\/|(?:\.\.\/)+(?:tools|components|layouts|pages)\/)/;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) return sourceFiles(path);

    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe('dependency direction', () => {
  for (const layer of INNER_LAYERS) {
    it(`keeps ${layer} free of imports from the outer layers`, () => {
      const offenders = sourceFiles(layer).filter((file) =>
        OUTWARD_IMPORT.test(readFileSync(file, 'utf8')),
      );

      expect(offenders).toEqual([]);
    });
  }
});
