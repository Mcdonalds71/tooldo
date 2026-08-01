import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Clash Display can't live in the repo — the Fontshare EULA allows self-hosting the
 * family but not redistributing the files, and a public repository is redistribution.
 * So the build fetches it instead, which keeps the deployed site on the real face.
 *
 * The address is committed rather than kept in each host's environment. A URL is not
 * the file, so it carries no licence weight, and the font behind it is already public:
 * the deployed site serves that same woff2 to every visitor who loads a page. Holding
 * it as a build variable bought nothing and cost a setup step in every environment —
 * including forks and fresh clones, which got the fallback face for no good reason.
 *
 * CLASH_DISPLAY_URL still overrides it, for moving the file without a commit.
 */

const TARGET = 'public/fonts/clash-display-variable.woff2';
const DEFAULT_URL =
  'https://pub-736856a13bb042a59dc746553c316ee1.r2.dev/clash-display-variable.woff2';

const url = process.env.CLASH_DISPLAY_URL || DEFAULT_URL;

if (existsSync(TARGET)) {
  console.log('fonts: Clash Display already present');
} else {
  // A brand font is a finish, not a dependency. If it can't be had, the build still
  // ships and headings fall back — never a failed deploy over a typeface.
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    await mkdir(dirname(TARGET), { recursive: true });
    await writeFile(TARGET, Buffer.from(await response.arrayBuffer()));
    console.log('fonts: fetched Clash Display');
  } catch (error) {
    console.warn(`fonts: could not fetch Clash Display — headings will fall back.`);
    console.warn(`       ${url}`);
    console.warn(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}
