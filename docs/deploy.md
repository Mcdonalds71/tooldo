# Deploying

The site is static — `pnpm build` writes plain HTML, CSS and JS to `dist/` with no
server behind it. It is hosted on Cloudflare Pages, built from `main` on every push.

## Pages project settings

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Root directory | *(leave empty)* |

Nothing pins the toolchain in the dashboard. `.node-version` and the `packageManager`
field in `package.json` do it from the repo, so a change to either travels with the
commit that needed it rather than living in a settings page nobody remembers to check.

## Environment variables

One variable, and it is optional:

| Name | Value |
|---|---|
| `CLASH_DISPLAY_URL` | A direct link to `clash-display-variable.woff2` |

Set it in **both** Production and Preview. Pages keeps a separate set per environment,
and a preview that quietly renders headings in the system sans looks like a regression
in the CSS rather than a missing variable.

Without it the build still succeeds — see [`public/fonts/README.md`](../public/fonts/README.md)
for why the font can't live in the repo and what the fallback costs.

### Hosting the font on R2

Since the deploy is already on Cloudflare, the font may as well be:

1. Create an R2 bucket (`tooldo-assets` or similar).
2. Upload `clash-display-variable.woff2` under a path that isn't worth guessing.
3. Enable public access on the bucket, or attach a custom domain.
4. Point `CLASH_DISPLAY_URL` at the object URL.

Use a plain public URL, not a presigned one. R2's S3-compatible signatures expire after
at most seven days, which would change the site's face mid-month with nothing in the
commit log to explain it.

A public bucket is not a licence problem. The deployed site already serves that exact
file at a public URL — that is what a webfont *is*, and what the Fontshare licence
grants. What it forbids is shipping the file as a repository asset, which is why the
build fetches it instead.

## Checks

CI runs typecheck, lint, unit tests, a build, the Playwright smoke suite, and a
dependency audit on every pull request. Cloudflare builds independently of it, so a red
check does not block a deploy — treat the branch protection on `main` as the gate, not
the Pages build.
