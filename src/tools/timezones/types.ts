import type { CityEntry } from './cities';

export type DayPhase = 'night' | 'morning' | 'day' | 'evening';

/** One hour of the viewer's own day, and what that same instant looks like in a
 *  city's local time — the pair is what lets a single strip represent both clocks. */
export interface HourCell {
  readonly viewerHour: number;
  readonly localHour: number;
  readonly phase: DayPhase;
  /** -1, 0, or 1 relative to the viewer's reference date — a city far enough away
   *  shows a different calendar day for the same viewer-day hour. */
  readonly dayOffset: number;
}

export interface SelectedTime {
  readonly hour: number;
  readonly minute: number;
  readonly label: string;
  readonly dayOffset: number;
  readonly dateLabel: string;
}

export interface SelectedCity extends CityEntry {
  readonly id: string;
}

export interface CityTimeline extends SelectedCity {
  /** Relative to the viewer, at the reference date — e.g. "+5h30" or "-3h". Not a
   *  fixed fact about the zone: it moves whenever either side crosses a DST change. */
  readonly offsetLabel: string;
  readonly cells: readonly HourCell[];
  readonly selected: SelectedTime;
}
