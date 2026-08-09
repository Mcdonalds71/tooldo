import { type CityEntry, findCityBySlug } from './cities';

/** Five cities spread wide enough to show real day/night contrast in one strip,
 *  rather than a random handful that might all read as afternoon. Looked up by slug
 *  instead of duplicating the literal entries, so `cities.ts` stays the one place the
 *  actual data lives. */
const SAMPLE_SLUGS = [
  'lagos-nigeria',
  'london-united-kingdom',
  'new-york-united-states',
  'tokyo-japan',
  'sydney-australia',
];

export function sampleCities(): readonly CityEntry[] {
  return SAMPLE_SLUGS.map((slug) => findCityBySlug(slug)).filter(
    (entry): entry is CityEntry => entry !== undefined,
  );
}
