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
    if (!isBusinessProfile(parsed)) return EMPTY_BUSINESS_PROFILE;

    /* `paymentDetails` was added after this key had already been shipping, so a profile
       saved before then is valid and simply lacks the field. Filling it in here rather
       than rejecting the record is the difference between an older visitor keeping the
       details they saved and silently losing all of them on their next visit. */
    return { ...EMPTY_BUSINESS_PROFILE, ...parsed };
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

/** Deliberately checks only the fields that have always been there, so adding one later
 *  never invalidates a record someone already has saved. `loadBusinessProfile` fills any
 *  newer field in from the empty profile. */
function isBusinessProfile(value: unknown): value is Partial<BusinessProfile> {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.name === 'string' &&
    typeof record.address === 'string' &&
    typeof record.email === 'string' &&
    typeof record.phone === 'string' &&
    (record.paymentDetails === undefined || typeof record.paymentDetails === 'string') &&
    (record.logoDataUrl === null || typeof record.logoDataUrl === 'string')
  );
}
