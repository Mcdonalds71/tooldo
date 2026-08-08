import { type BusinessProfile, EMPTY_BUSINESS_PROFILE } from './types';

/**
 * The one piece of state any tool in the suite remembers between visits — deliberate,
 * not precedent for other tools (see ADR 0010). Browser-only, so it's verified through
 * the e2e spec rather than a Vitest unit test, the same as every other browser-only
 * piece in the suite (canvas, WASM).
 */
const STORAGE_KEY = 'tooldo:invoice:business-profile';

export function loadBusinessProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_BUSINESS_PROFILE;

    const parsed: unknown = JSON.parse(raw);
    return isBusinessProfile(parsed) ? parsed : EMPTY_BUSINESS_PROFILE;
  } catch {
    // Corrupted JSON, or storage unavailable entirely (private browsing, disabled) —
    // either way the form still works this session, just starting blank.
    return EMPTY_BUSINESS_PROFILE;
  }
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Same as above — not worth surfacing as an error for a convenience feature.
  }
}

export function clearBusinessProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Same as above.
  }
}

function isBusinessProfile(value: unknown): value is BusinessProfile {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.name === 'string' &&
    typeof record.address === 'string' &&
    typeof record.email === 'string' &&
    typeof record.phone === 'string' &&
    (record.logoDataUrl === null || typeof record.logoDataUrl === 'string')
  );
}
