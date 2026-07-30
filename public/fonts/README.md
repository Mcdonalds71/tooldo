# Fonts

Every face is self-hosted from this folder — nothing is fetched from a font CDN at
runtime, so the CSP stays tight and no visitor request leaks to a third party.

| Face | Role | Licence | In this repo |
|---|---|---|---|
| Clash Display | Headings, button labels | [Fontshare](https://www.fontshare.com/licenses/itf-ffl) | No — fetch it once, see below |
| Inter | UI and body | SIL OFL 1.1 | Yes |
| JetBrains Mono | Code, data, eyebrows | SIL OFL 1.1 | Yes |

## Fetching Clash Display

The Fontshare licence covers using and self-hosting the family, but not
redistributing the font files, so it isn't committed here. Download it once:

1. Open <https://www.fontshare.com/fonts/clash-display> and download the family.
2. Take the **variable** WOFF2 from the archive.
3. Save it in this folder as `clash-display-variable.woff2`.

Until then headings fall back to the system sans — the site works, it just isn't
wearing its own face yet. `src/design-system/fonts.css` declares the weight axis as
`400 700`; Clash Display has no heavier weight, so map any 800/900 heading to 700.
