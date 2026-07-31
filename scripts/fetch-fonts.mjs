import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Clash Display can't live in the repo — the Fontshare EULA allows self-hosting the
 * family but not redistributing the files, and a public repository is redistribution.
 * So the build fetches it from somewhere private instead, which keeps the deployed
 * site on the real face.
 *
 * Set CLASH_DISPLAY_URL in the host's build environment to a private, direct link to
 * ClashDisplay-Variable.woff2. Without it the build still succeeds and headings fall
 * back to the system sans, because a missing brand font should not break a deploy.
 */

const TARGET = 'public/fonts/clash-display-variable.woff2';
const url = process.env.CLASH_DISPLAY_URL;

if (existsSync(TARGET)) {
  console.log('fonts: Clash Display already present');
} else if (!url) {
  console.warn('fonts: CLASH_DISPLAY_URL is not set — headings will fall back.');
  console.warn('       See public/fonts/README.md.');
} else {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`fonts: CLASH_DISPLAY_URL returned ${response.status} ${response.statusText}`);
  }

  await mkdir(dirname(TARGET), { recursive: true });
  await writeFile(TARGET, Buffer.from(await response.arrayBuffer()));
  console.log('fonts: fetched Clash Display');
}
