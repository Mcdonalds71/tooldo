# Deploying

The site is static — `pnpm build` writes plain HTML, CSS and JS to `dist/` with no server
behind it. Cloudflare Workers serves those files from the edge and rebuilds on every push
to `main`.

Workers rather than Pages because that is where a new git connection lands now, and a
static build needs nothing Pages offers that Workers Static Assets doesn't. There is no
`main` entry in `wrangler.jsonc` and so no Worker script: a request is answered by the
asset layer and never reaches compute.

## Project settings

| Setting | Value |
|---|---|
| Build command | `pnpm build` |
| Deploy command | `pnpm exec wrangler deploy` |
| Path | *(repository root)* |

Everything else is in `wrangler.jsonc` — project name, the `dist` directory, and routing
unmatched paths to the 404 page. Keeping it in the repo means the deploy is reviewable in
a pull request rather than being whatever the dashboard currently says.

The toolchain is pinned the same way: `.node-version` and the `packageManager` field fix
the versions from the repo, so a change to either travels with the commit that needed it.

## Environment variables

None. The build needs nothing set to produce the real site.

Clash Display is fetched from the `tooldo-assets` R2 bucket at build time, and the address
lives in `scripts/fetch-fonts.mjs` rather than in each environment's settings — see
[`public/fonts/README.md`](../public/fonts/README.md) for why the file can't be committed
but its URL can. `CLASH_DISPLAY_URL` overrides the default if the object ever moves.

Use a plain public URL there, never a presigned one. R2's S3-compatible signatures expire
after at most seven days, which would change the site's face mid-month with nothing in the
commit log to explain it.

## Install scripts

`pnpm-workspace.yaml` lists every dependency allowed to run an install script, and pnpm
skips the rest. `workerd` is on that list because wrangler shells out to it and its script
fetches the platform binary — without it the deploy fails on a runtime that never finished
installing. Anything new that asks for a build script is a supply-chain decision, so it
gets added deliberately or not at all.

## Checks

CI runs typecheck, lint, unit tests, a build, the Playwright smoke suite, and a dependency
audit on every pull request. Cloudflare builds independently of it, so a red check does not
block a deploy — treat the branch protection on `main` as the gate, not the build.
