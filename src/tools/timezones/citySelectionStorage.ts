const STORAGE_KEY = 'tooldo:timezones:cities';
const URL_PARAM = 'cities';

/**
 * Two persistence layers for one list, each answering a different question. The URL
 * is what makes a specific comparison shareable — send the link, the recipient sees
 * the same cities with no account and nothing saved on their end. `localStorage` is
 * what makes returning alone convenient — same reasoning as the invoice tool's saved
 * business profile (ADR 0010), applied here for its own reason, not copied as a
 * default. The URL wins when both are present, since a visitor who opened a shared
 * link is asking to see that link's cities, not last session's.
 */
export function readSlugsFromUrl(): readonly string[] {
  try {
    const raw = new URLSearchParams(window.location.search).get(URL_PARAM);
    return raw ? raw.split(',').filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** `replaceState`, not `pushState` — adding or removing a city shouldn't leave a
 *  trail of back-button stops behind it. */
export function writeSlugsToUrl(slugs: readonly string[]): void {
  try {
    const url = new URL(window.location.href);
    if (slugs.length > 0) {
      url.searchParams.set(URL_PARAM, slugs.join(','));
    } else {
      url.searchParams.delete(URL_PARAM);
    }
    window.history.replaceState(null, '', url);
  } catch {
    // Not fatal - the tool still works in-session without a shareable URL.
  }
}

export function loadSlugsFromStorage(): readonly string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')
      ? parsed
      : [];
  } catch {
    // Corrupted JSON, or storage unavailable entirely (private browsing, disabled) —
    // either way the tool still works this session, just starting blank.
    return [];
  }
}

export function saveSlugsToStorage(slugs: readonly string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Same as above — not worth surfacing as an error for a convenience feature.
  }
}
