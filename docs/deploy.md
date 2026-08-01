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

One variable, and it is optional:

| Name | Value |
|---|---|
| `CLASH_DISPLAY_URL` | A direct link to `clash-display-variable.woff2` |

Set it for **both** Production and Preview. Each environment keeps its own set, and a
preview that quietly renders headings in the system sans looks like a CSS regression
rather than a missing variable.

Without it the build still succeeds — see [`public/fonts/README.md`](../public/fonts/README.md)
for why the font can't live in the repo and what the fallback costs.

### Hosting the font on R2

Since the deploy is already on Cloudflare, the font may as well be:

1. Create an R2 bucket (`tooldo-assets` or similar).
2. Upload `clash-display-variable.woff2` under a path that isn't worth guessing.
3. Enable public access on the bucket, or attach a custom domain.
4. Point `CLASH_DISPLAY_URL` at the object URL.

Use a plain public URL, not a presigned one. R2's S3-compatible signatures expire after at
most seven days, which would change the site's face mid-month with nothing in the commit
log to explain it.

A public bucket is not a licence problem. The deployed site already serves that exact file
at a public URL — that is what a webfont *is*, and what the Fontshare licence grants. What
it forbids is shipping the file as a repository asset, which is why the build fetches it.

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
