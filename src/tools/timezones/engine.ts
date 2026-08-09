import { DateTime } from 'luxon';
import type { CityEntry } from './cities';
import type { CityTimeline, DayPhase, HourCell, SelectedCity } from './types';

const MINUTES_PER_DAY = 24 * 60;

/**
 * No Worker anywhere in this tool — the suite's first. Every other tool routes its
 * real work through one because the work is heavy: parsing a PDF, re-encoding an
 * image, generating a document. This tool's only work is date arithmetic, sub-
 * millisecond regardless of how many cities are on screen, so there is nothing here
 * that would ever justify leaving the main thread. See ADR 0011.
 */

export function dayPhase(hour: number): DayPhase {
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'day';
  if (hour < 22) return 'evening';
  return 'night';
}

/**
 * `referenceDate` anchors the viewer's calendar day; `selectedMinute` (0–1439) is
 * minutes since that day's midnight, in the viewer's own zone. Every cell and the
 * selected time are derived from real `DateTime` instants crossing into `entry.zone`,
 * so DST on either side is handled by the same code path as everything else — there
 * is no separate "DST-adjusted" branch to get out of sync with the normal one.
 */
export function buildCityTimeline(
  entry: SelectedCity,
  viewerZone: string,
  referenceDate: DateTime,
  selectedMinute: number,
): CityTimeline {
  const viewerMidnight = referenceDate.setZone(viewerZone).startOf('day');

  const cells: HourCell[] = [];
  for (let viewerHour = 0; viewerHour < 24; viewerHour++) {
    const instant = viewerMidnight.plus({ hours: viewerHour });
    const local = instant.setZone(entry.zone);

    cells.push({
      viewerHour,
      localHour: local.hour,
      phase: dayPhase(local.hour),
      dayOffset: dayOffsetFrom(local, viewerMidnight),
    });
  }

  const selectedInstant = viewerMidnight.plus({ minutes: clampMinute(selectedMinute) });
  const selectedLocal = selectedInstant.setZone(entry.zone);
  const selectedDayOffset = dayOffsetFrom(selectedLocal, viewerMidnight);

  return {
    ...entry,
    offsetLabel: formatOffset(selectedLocal.offset - selectedInstant.setZone(viewerZone).offset),
    cells,
    selected: {
      hour: selectedLocal.hour,
      minute: selectedLocal.minute,
      label: selectedLocal.toFormat('h:mm a'),
      dayOffset: selectedDayOffset,
      dateLabel: dateLabelForOffset(selectedDayOffset),
    },
  };
}

export function searchCities(query: string, cities: readonly CityEntry[]): readonly CityEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === '') return cities;

  return cities.filter(
    (entry) =>
      entry.city.toLowerCase().includes(trimmed) || entry.country.toLowerCase().includes(trimmed),
  );
}

/**
 * How many calendar days `local`'s date sits from `viewerMidnight`'s date — always
 * -1, 0, or 1 in practice, since no two real zones are more than 26 hours apart.
 *
 * Compares calendar dates directly, not absolute elapsed time between the two
 * zones' midnights — those aren't the same question. Two zones far enough apart can
 * have midnights only a few hours apart in absolute time while still landing on
 * dates a full calendar day apart (a Tokyo viewer at their own midnight sees Los
 * Angeles reading the previous afternoon: seven hours away, but yesterday's date).
 * `DateTime.utc(y, m, d)` strips the zone entirely so the diff is pure calendar
 * arithmetic; `|| 0` folds in `Math.round`'s `-0` for a same-day comparison.
 */
function dayOffsetFrom(local: DateTime, viewerMidnight: DateTime): number {
  const localDateOnly = DateTime.utc(local.year, local.month, local.day);
  const viewerDateOnly = DateTime.utc(
    viewerMidnight.year,
    viewerMidnight.month,
    viewerMidnight.day,
  );

  return Math.round(localDateOnly.diff(viewerDateOnly, 'days').days) || 0;
}

function dateLabelForOffset(dayOffset: number): string {
  if (dayOffset < 0) return 'Yesterday';
  if (dayOffset > 0) return 'Tomorrow';
  return 'Today';
}

/** `minutesDiff` is a difference of UTC offsets, so it's always a whole number of
 *  minutes, but rarely a whole number of hours — India and a handful of others sit on
 *  a half-hour offset, Nepal on a quarter-hour, so "+5h30" has to be sayable. */
function formatOffset(minutesDiff: number): string {
  const sign = minutesDiff < 0 ? '-' : '+';
  const abs = Math.abs(minutesDiff);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;

  return minutes === 0 ? `${sign}${hours}h` : `${sign}${hours}h${minutes}`;
}

function clampMinute(minute: number): number {
  if (!Number.isFinite(minute)) return 0;
  return Math.min(Math.max(Math.round(minute), 0), MINUTES_PER_DAY - 1);
}
