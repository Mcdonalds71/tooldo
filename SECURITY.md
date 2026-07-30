# Security policy

tooldo runs entirely in the browser — no backend, no database, no accounts, and files are never uploaded. This removes most common risks, but front-end and supply-chain issues still matter.

## Reporting a vulnerability

Please **don't open a public issue** for security problems. Instead, email **emmanuelonugwu.c@gmail.com** with:

- a description of the issue and its impact,
- steps to reproduce (or a proof of concept),
- affected tool / page / browser.

You'll get an acknowledgement as soon as possible, and credit in the fix if you'd like it.

## Scope

In scope: XSS or unsafe handling of user input/files, dependency vulnerabilities, CSP or header weaknesses, anything that could exfiltrate a user's files or data.

Out of scope: issues that require a compromised device or browser, or social-engineering attacks.

## Our commitments

- A strict Content-Security-Policy and the standard security headers.
- User input and file contents treated as untrusted; output escaped; malformed files guarded.
- Automated dependency and secret scanning on the repository.
- The privacy promise ("your files never leave your device") is kept literally true.
