import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

/**
 * A tool's Web Worker bundle and the WASM that worker instantiates are deliberately
 * left out of the precache; the service worker picks them up at runtime the first
 * time that tool actually runs.
 *
 * The line is conceptual rather than a byte threshold: the precache is *the site* —
 * every page, the fonts, the shared client runtime — and a worker plus its WASM is
 * *one tool's engine*. Holding engines back keeps the install near 2MB instead of
 * 17MB, which matters because this fires for every first-time visitor on whatever
 * connection they happen to be on, not only for people who deliberately installed.
 */
const ENGINE = /(^|[-.])worker[-.]|\.wasm$/i;

/** Source maps are a debugging aid for us; nothing offline needs them. */
const SKIP = /\.map$/i;

/** The service worker cannot sensibly precache itself or its own manifest. */
const SELF = /^sw(-manifest)?\.js$/i;

async function walk(root: string, dir: string = root): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return walk(root, full);
      return [relative(root, full).split(sep).join(posix.sep)];
    }),
  );
  return nested.flat();
}

/** `about/index.html` is served at `/about/`, and that is the URL a fetch handler
 *  will be asked for — so it is the URL that has to be the cache key. */
function toUrlPath(file: string): string {
  if (file === 'index.html') return '/';
  if (file.endsWith('/index.html')) return `/${file.slice(0, -'index.html'.length)}`;
  return `/${file}`;
}

function toFilePath(url: string): string {
  if (url === '/') return 'index.html';
  const relative = url.slice(1);
  return relative.endsWith('/') ? `${relative}index.html` : relative;
}

/**
 * Emits the precache list the service worker reads at install time.
 *
 * Written as a generated sibling file the worker pulls in with `importScripts`
 * rather than templated into the worker source, so `public/sw.js` stays a plain
 * hand-written file that can be read and reviewed on its own terms — no build step
 * standing between the source and what ships.
 */
export function precache(): AstroIntegration {
  return {
    name: 'tooldo:precache',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = await walk(root);

        const shell = files
          .filter((file) => {
            const name = posix.basename(file);
            return !ENGINE.test(name) && !SKIP.test(name) && !SELF.test(name);
          })
          .map(toUrlPath)
          .sort();

        /* The version is the fingerprint of the shell itself, so a deploy that
           changes nothing a visitor would download does not evict their cache and
           re-fetch an identical site. Astro already content-hashes asset filenames,
           which is why hashing the *names* is enough to notice any change. */
        const version = createHash('sha256').update(shell.join('\n')).digest('hex').slice(0, 12);

        const bytes = await Promise.all(
          shell.map(async (url) => (await readFile(join(root, toFilePath(url)))).byteLength),
        );
        const total = bytes.reduce((sum, size) => sum + size, 0);

        await writeFile(
          join(root, 'sw-manifest.js'),
          `self.__PRECACHE_VERSION__ = ${JSON.stringify(version)};\n` +
            `self.__PRECACHE__ = ${JSON.stringify(shell, null, 2)};\n`,
          'utf8',
        );

        logger.info(
          `precache ${version}: ${shell.length} files, ${(total / 1024 / 1024).toFixed(1)}MB ` +
            `(engines load on first use)`,
        );
      },
    },
  };
}
