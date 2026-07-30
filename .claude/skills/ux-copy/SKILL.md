---
name: ux-copy
description: The writing voice for tooldo — how to write every user-facing word so the whole product sounds like one confident, warm, human product (never AI-generated). Use whenever writing or reviewing any copy: button labels, headings, empty states, error messages, tooltips, tool descriptions, onboarding, SEO/FAQ text, the README. Trigger on "write copy", "what should this say", "microcopy", "error message", "label", or any user-facing text.
---

# Skill: ux-copy

Every word ships in a public, portfolio product. Copy is where "AI wrote this" shows most — so this voice is a hard requirement, not a nicety. Obey `CLAUDE.md`.

## Voice

Intelligent, warm, unvarnished, human. Like the smartest friend explaining something in plain terms. Confident and calm — the product knows it's good and doesn't oversell. Friendliness lives in the words, not in exclamation marks.

## Mechanics

- **Sentence case everywhere.** Buttons, headings, labels, menu items. "Open the tools", not "Open The Tools". Title case only for proper nouns.
- **Verb-first, active voice.** "Compress all", "Remove background" — not "Compression" or "Background removal".
- **Contractions.** "It's", "you'll", "won't". Conversational, not stiff.
- **No terminal punctuation on labels/headings.** Helper text and body copy do end with a period.
- **Ellipsis = in progress only** ("Compressing…"). Not for menu suffixes or trailing off.
- **Serial comma.** "Convert, compress, and clean up."
- **Spell out "and"** — no ampersands in body copy.

## Words and phrases to cut

- **Filler:** "simply", "just", "easy", "seamless", "unlock", "leverage", "empower", "powerful", "effortless", "revolutionary". Say what it does instead.
- **"successfully"** — the result is the success. "File compressed", not "File compressed successfully".
- **"please"** in UI — "Enter a name", not "Please enter a name".
- **"Click here" / "Tap to…"** — name the destination: "See the privacy promise".
- **Exclamation marks** on system copy — reads as shouty.
- **AI-isms:** "Here is…", "In today's fast-paced world", "Whether you're X or Y", "Look no further", "the perfect solution", "with just a few clicks", "seamlessly". These are instant tells — never write them.

## Patterns

- **Buttons / CTAs** — verb first, 1–3 words, no punctuation. "Open the tools", "Try a sample", "Download all". Not "OK", "Submit", "Click to continue".
- **Headings** — say the value plainly and confidently. "We make everyday files easy." "Free. Actually free."
- **Empty states** — an invitation: headline names the win, one line of context, action inline. Never "No files yet." (see `empty-state` skill).
- **Errors** — what happened, then what to do. One sentence, no "Error:" prefix, no first person, no raw exception. "That file isn't a PDF — try another."
- **Tool descriptions** — one crisp verb-first line. "Erase any background in one drop." "Fill a form, get a clean PDF."
- **Privacy copy** — plain and honest, the product's backbone. "Your files never leave your device." Don't hedge it, don't overstate it.
- **Placeholders** — a real example of valid input ("name@company.com"), no "e.g.", don't repeat the label.
- **Links** — describe where they go ("View the source", "Read the privacy promise").

## Pronouns

- The user's things: **your** ("Your files"), never "my".
- Confirmations: none or past tense ("Saved", "Done"), never "I saved it".
- Errors: **you/your** ("Your file's too large"), never "I couldn't".
- The UI speaks as the product, not as an assistant — it never says "I".

## Quick do / don't

| Do | Don't |
|---|---|
| "File compressed" | "Your file was compressed successfully!" |
| "Drop a photo to start" | "Simply drag and drop your photo to get started" |
| "That file isn't a PDF — try another" | "Error: I was unable to process the file" |
| "Free. Actually free." | "Unlock powerful tools, completely free!" |
| "Your files never leave your device" | "We seamlessly ensure your privacy" |

## Review pass

Before shipping any copy, reread it and cut every filler word — if a sentence survives with a word removed, remove it. If it sounds like a marketing template or a chatbot, rewrite it plainer.
