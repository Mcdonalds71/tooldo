import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import { CITIES, type CityEntry, citySlug, findCityBySlug } from './cities';
import {
  loadSlugsFromStorage,
  readSlugsFromUrl,
  saveSlugsToStorage,
  writeSlugsToUrl,
} from './citySelectionStorage';
import { buildCityTimeline, searchCities } from './engine';
import { sampleCities } from './sample';
import type { CityTimeline, SelectedCity } from './types';

const MAX_CITIES = 10;
const MAX_RESULTS = 8;

function detectViewerZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/** Prefers a curated entry for the detected zone (a real city name, a real country);
 *  falls back to reading one off the IANA identifier itself for a zone the curated
 *  list doesn't happen to cover — every visitor gets a labelled starting city, not a
 *  blank tool waiting for their first search. */
function cityForZone(zone: string): CityEntry {
  const curated = CITIES.find((entry) => entry.zone === zone);
  if (curated) return curated;

  const last = zone.split('/').pop() ?? zone;
  return { city: last.replace(/_/g, ' '), country: '', zone };
}

function toSelected(entry: CityEntry): SelectedCity {
  return { ...entry, id: citySlug(entry) };
}

function initialCities(zone: string): readonly SelectedCity[] {
  const urlSlugs = readSlugsFromUrl();
  const slugs = urlSlugs.length > 0 ? urlSlugs : loadSlugsFromStorage();

  const resolved = slugs
    .map((slug) => findCityBySlug(slug))
    .filter((entry): entry is CityEntry => entry !== undefined)
    .map(toSelected);

  return resolved.length > 0 ? resolved : [toSelected(cityForZone(zone))];
}

/**
 * No Worker, no async operation anywhere in this hook — every action here is
 * synchronous date arithmetic. See `engine.ts` and ADR 0011 for why that's a
 * deliberate reading of the rest of the suite's pattern, not a shortcut around it.
 */
export function useTimezoneWorkbench() {
  const { notify } = useToast();

  const [cities, setCities] = useState<readonly SelectedCity[]>([]);
  const [viewerZone, setViewerZone] = useState('UTC');
  const [referenceDate, setReferenceDate] = useState(() => DateTime.utc());
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [query, setQuery] = useState('');

  // Neither the server nor the client's first render can know the visitor's real zone
  // or the exact instant they load the page, so both start from the same deterministic
  // empty state — the tool's existing "no cities yet" state — and this effect fills in
  // the real, personal answer once it's actually running in their browser. Doing that
  // detection any earlier is what caused a hydration mismatch: a static build frozen
  // at build time, shown against a visit that could load minutes, hours, or days
  // later, rendering a different clock for identical markup.
  useEffect(() => {
    const zone = detectViewerZone();
    const now = DateTime.now();
    const local = now.setZone(zone);

    setViewerZone(zone);
    setReferenceDate(now);
    setCities(initialCities(zone));
    setSelectedMinute(local.hour * 60 + local.minute);
  }, []);

  const sync = useCallback((next: readonly SelectedCity[]) => {
    const slugs = next.map((city) => city.id);
    writeSlugsToUrl(slugs);
    saveSlugsToStorage(slugs);
  }, []);

  const addCity = useCallback(
    (entry: CityEntry) => {
      setCities((current) => {
        const id = citySlug(entry);
        if (current.some((city) => city.id === id)) {
          notify({ title: `${entry.city} is already on the list`, tone: 'info' });
          return current;
        }
        if (current.length >= MAX_CITIES) {
          notify({ title: `Compare up to ${MAX_CITIES} cities at once`, tone: 'error' });
          return current;
        }

        const next = [...current, toSelected(entry)];
        sync(next);
        return next;
      });
      setQuery('');
    },
    [notify, sync],
  );

  const removeCity = useCallback(
    (id: string) => {
      setCities((current) => {
        const next = current.filter((city) => city.id !== id);
        sync(next);
        return next;
      });
    },
    [sync],
  );

  const trySample = useCallback(() => {
    const next = sampleCities().map(toSelected);
    setCities(next);
    sync(next);
  }, [sync]);

  const results = useMemo(() => searchCities(query, CITIES).slice(0, MAX_RESULTS), [query]);

  const timelines: readonly CityTimeline[] = useMemo(
    () => cities.map((city) => buildCityTimeline(city, viewerZone, referenceDate, selectedMinute)),
    [cities, viewerZone, referenceDate, selectedMinute],
  );

  const actions = useMemo(
    () => ({ addCity, removeCity, trySample, setSelectedMinute, setQuery }),
    [addCity, removeCity, trySample],
  );

  return { cities, timelines, selectedMinute, query, results, viewerZone, actions };
}

export type TimezoneActions = ReturnType<typeof useTimezoneWorkbench>['actions'];
