import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { citySlug } from './cities';
import { buildCityTimeline, dayPhase, searchCities } from './engine';
import type { SelectedCity } from './types';

function selected(city: string, country: string, zone: string): SelectedCity {
  return { id: citySlug({ city, country }), city, country, zone };
}

const tokyo = selected('Tokyo', 'Japan', 'Asia/Tokyo');
const losAngeles = selected('Los Angeles', 'United States', 'America/Los_Angeles');
const mumbai = selected('Mumbai', 'India', 'Asia/Kolkata');
const newYork = selected('New York', 'United States', 'America/New_York');

describe('dayPhase', () => {
  it.each([
    [0, 'night'],
    [5, 'night'],
    [6, 'morning'],
    [11, 'morning'],
    [12, 'day'],
    [17, 'day'],
    [18, 'evening'],
    [21, 'evening'],
    [22, 'night'],
    [23, 'night'],
  ] as const)('classifies hour %i as %s', (hour, phase) => {
    expect(dayPhase(hour)).toBe(phase);
  });
});

describe('buildCityTimeline', () => {
  // A fixed winter date, so nobody involved is mid-DST-transition and every offset
  // below is the one each zone actually uses in January.
  const winterDay = DateTime.fromISO('2026-01-15T00:00', { zone: 'UTC' });

  it("reports every hour as itself in the viewer's own zone", () => {
    const timeline = buildCityTimeline(
      selected('London', 'United Kingdom', 'UTC'),
      'UTC',
      winterDay,
      0,
    );

    expect(timeline.cells.map((cell) => cell.localHour)).toEqual(
      timeline.cells.map((cell) => cell.viewerHour),
    );
    expect(timeline.cells.every((cell) => cell.dayOffset === 0)).toBe(true);
    expect(timeline.offsetLabel).toBe('+0h');
  });

  it("rolls a far-ahead city into tomorrow partway through the viewer's day", () => {
    const timeline = buildCityTimeline(tokyo, 'UTC', winterDay, 0);

    // Tokyo is UTC+9 in January (no DST) - the viewer's hour 15 is Tokyo's midnight.
    expect(timeline.cells[0]).toMatchObject({ viewerHour: 0, localHour: 9, dayOffset: 0 });
    expect(timeline.cells[15]).toMatchObject({ viewerHour: 15, localHour: 0, dayOffset: 1 });
    expect(timeline.cells[20]).toMatchObject({ viewerHour: 20, localHour: 5, dayOffset: 1 });
  });

  it('labels a city that reads the day before, not just an offset', () => {
    // A Tokyo viewer at their own midnight watches Los Angeles read yesterday
    // afternoon - seven hours away in absolute time, but a full calendar day back.
    const tokyoMidnight = DateTime.fromISO('2026-01-15T00:00', { zone: 'Asia/Tokyo' });
    const timeline = buildCityTimeline(losAngeles, 'Asia/Tokyo', tokyoMidnight, 0);

    expect(timeline.selected).toMatchObject({
      hour: 7,
      minute: 0,
      dayOffset: -1,
      dateLabel: 'Yesterday',
    });
  });

  it('formats a half-hour offset instead of rounding it away', () => {
    const timeline = buildCityTimeline(mumbai, 'UTC', winterDay, 0);

    expect(timeline.offsetLabel).toBe('+5h30');
  });

  it('reflects daylight saving on each side of the transition, from the same code path', () => {
    const january = buildCityTimeline(
      newYork,
      'UTC',
      DateTime.fromISO('2026-01-15T00:00', { zone: 'UTC' }),
      0,
    );
    const july = buildCityTimeline(
      newYork,
      'UTC',
      DateTime.fromISO('2026-07-15T00:00', { zone: 'UTC' }),
      0,
    );

    expect(january.offsetLabel).toBe('-5h');
    expect(july.offsetLabel).toBe('-4h');
  });

  it("turns a selected minute into that city's exact local clock time", () => {
    // 14:30 UTC in January is 09:30 in New York (UTC-5).
    const timeline = buildCityTimeline(newYork, 'UTC', winterDay, 14 * 60 + 30);

    expect(timeline.selected).toMatchObject({ hour: 9, minute: 30, label: '9:30 AM' });
  });

  it('clamps an out-of-range or non-finite selected minute rather than producing NaN', () => {
    const negative = buildCityTimeline(tokyo, 'UTC', winterDay, -30);
    const tooLarge = buildCityTimeline(tokyo, 'UTC', winterDay, 999_999);
    const notANumber = buildCityTimeline(tokyo, 'UTC', winterDay, Number.NaN);

    for (const timeline of [negative, tooLarge, notANumber]) {
      expect(Number.isFinite(timeline.selected.hour)).toBe(true);
      expect(Number.isFinite(timeline.selected.minute)).toBe(true);
    }
  });
});

describe('searchCities', () => {
  const cities: readonly SelectedCity[] = [tokyo, losAngeles, mumbai, newYork];

  it('returns everything for an empty query', () => {
    expect(searchCities('', cities)).toEqual(cities);
    expect(searchCities('   ', cities)).toEqual(cities);
  });

  it('matches by city name, case-insensitively', () => {
    expect(searchCities('tok', cities)).toEqual([tokyo]);
  });

  it('matches by country name too', () => {
    expect(searchCities('india', cities)).toEqual([mumbai]);
  });

  it("has nothing to say about a city that isn't in the list", () => {
    expect(searchCities('atlantis', cities)).toEqual([]);
  });
});
