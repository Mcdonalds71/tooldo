# Fonts

Every face is self-hosted from this folder — nothing is fetched from a font CDN at
runtime, so the CSP stays tight and no visitor request leaks to a third party.

| Face | Role | Licence | In this repo |
|---|---|---|---|
| Clash Display | Headings, button labels | [Fontshare EULA](https://www.fontshare.com/licenses/itf-ffl) | No — fetch it once, see below |
| Inter | UI and body | SIL OFL 1.1 | Yes |
| JetBrains Mono | Code, data, eyebrows | SIL OFL 1.1 | Yes |

## Why Clash Display isn't committed

The Fontshare EULA grants use of the family in any medium including the web, and
self-hosting it to render this site is exactly what it's for. But §02 forbids
distributing the files, naming "uploading them in a public server" specifically — and
a public repository is that. So the file is git-ignored rather than committed, and
every checkout fetches its own copy.

That does mean a build from a clean checkout has no Clash Display and falls back to the
system sans. Headings still render; they just aren't wearing the brand face yet.

## Fetching it locally

1. Open <https://www.fontshare.com/fonts/clash-display> and download the family.
2. Take `Fonts/WEB/fonts/ClashDisplay-Variable.woff2` from the archive.
3. Save it here as `clash-display-variable.woff2`.
4. Run `pnpm brand` to regenerate the share card with the real wordmark.

## Fetching it in a build

`pnpm build` runs `scripts/fetch-fonts.mjs` first, which downloads the file from the R2
bucket named in that script. Nothing needs configuring — a fresh clone, a fork's pull
request and the production deploy all end up on the real face.

The address is committed rather than held per-environment. A URL is not the file, so it
carries no licence weight, and the font behind it is public either way: the deployed site
serves that same woff2 to every visitor who loads a page.

`CLASH_DISPLAY_URL` overrides it if the file ever moves and a commit would be awkward.
Either way the link has to be reachable without a login, since the fetch is
unauthenticated.

If the download fails the build still succeeds and headings fall back — a typeface should
never take a deploy down with it.

`src/design-system/fonts.css` declares the weight axis as `400 700`. Clash Display has
no heavier weight, so map any 800 or 900 heading down to 700.
