export type TextMode = 'edit' | 'compare';

export interface TextStats {
  readonly characters: number;
  readonly charactersNoSpaces: number;
  readonly words: number;
  readonly lines: number;
  readonly sentences: number;
  readonly readingMinutes: number;
}

export interface CleanupOptions {
  readonly trimLines: boolean;
  readonly collapseSpaces: boolean;
  readonly collapseBlankLines: boolean;
  readonly trimEdges: boolean;
}

export const DEFAULT_CLEANUP: CleanupOptions = {
  trimLines: false,
  collapseSpaces: false,
  collapseBlankLines: false,
  trimEdges: false,
};

/**
 * The first four read the text as prose and keep its line breaks; the last three read
 * it as one identifier-like token and collapse it to a single line — that's inherent to
 * what those conventions mean, not a limitation to work around.
 */
export type CaseMode =
  | 'none'
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'snake'
  | 'kebab';

export interface CaseOption {
  readonly value: CaseMode;
  readonly label: string;
}

export const CASE_OPTIONS: readonly CaseOption[] = [
  { value: 'none', label: 'No change' },
  { value: 'upper', label: 'UPPERCASE' },
  { value: 'lower', label: 'lowercase' },
  { value: 'title', label: 'Title Case' },
  { value: 'sentence', label: 'Sentence case' },
  { value: 'camel', label: 'camelCase' },
  { value: 'snake', label: 'snake_case' },
  { value: 'kebab', label: 'kebab-case' },
];

export type DiffLineType = 'same' | 'added' | 'removed';

export interface DiffLine {
  readonly type: DiffLineType;
  readonly text: string;
}

export interface DiffSummary {
  readonly added: number;
  readonly removed: number;
}

export const MAX_TEXT_LENGTH = 200_000;
/** LCS is O(lines_a × lines_b) in both time and table memory — 2,000 × 2,000 is a
 *  four-million-cell table, still well under a second, and a bigger cap buys little:
 *  past this many lines a line-level diff is no longer something a person reads. */
export const MAX_DIFF_LINES = 2000;
