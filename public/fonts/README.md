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

## Fetching it

1. Open <https://www.fontshare.com/fonts/clash-display> and download the family.
2. Take `Fonts/WEB/fonts/ClashDisplay-Variable.woff2` from the archive.
3. Save it here as `clash-display-variable.woff2`.
4. Run `pnpm brand` to regenerate the share card with the real wordmark.

`src/design-system/fonts.css` declares the weight axis as `400 700`. Clash Display has
no heavier weight, so map any 800 or 900 heading down to 700.
