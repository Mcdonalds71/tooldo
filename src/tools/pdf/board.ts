import type { InspectResult, PagePlan, Rotation } from './types';

/**
 * The board is the document as the user has arranged it so far: every page that will be
 * saved, in order, with the turn they've given it. It is plain data and plain functions
 * so the grid can stay a rendering of state and nothing else.
 */

export interface BoardPage {
  readonly id: string;
  readonly source: number;
  readonly page: number;
  readonly rotation: Rotation;
  /** Points, as the page sits in its own file. */
  readonly width: number;
  readonly height: number;
}

const QUARTER_TURN: Record<Rotation, Rotation> = { 0: 90, 90: 180, 180: 270, 270: 0 };

/** A page keeps its identity from where it came from, which never changes. */
export function pageKey(source: number, page: number): string {
  return `${source}:${page}`;
}

/**
 * Files inspected in one batch are numbered from zero, so a later batch is shifted past
 * the files already on the board.
 */
export function appendPages(
  current: readonly BoardPage[],
  inspected: InspectResult,
  offset: number,
): BoardPage[] {
  const added = inspected.pages.map((info) => ({
    id: pageKey(info.source + offset, info.page),
    source: info.source + offset,
    page: info.page,
    rotation: 0 as Rotation,
    width: info.width,
    height: info.height,
  }));

  return [...current, ...added];
}

export function movePage(pages: readonly BoardPage[], id: string, to: number): BoardPage[] {
  const from = pages.findIndex((page) => page.id === id);
  const moved = pages[from];

  if (moved === undefined) return [...pages];

  const target = Math.min(Math.max(to, 0), pages.length - 1);
  const rest = pages.filter((_, index) => index !== from);

  return [...rest.slice(0, target), moved, ...rest.slice(target)];
}

/** What the arrow buttons do: one step either way, and a no-op at the ends. */
export function shiftPage(pages: readonly BoardPage[], id: string, step: number): BoardPage[] {
  return movePage(pages, id, pages.findIndex((page) => page.id === id) + step);
}

export function rotatePage(pages: readonly BoardPage[], id: string): BoardPage[] {
  return pages.map((page) =>
    page.id === id ? { ...page, rotation: QUARTER_TURN[page.rotation] } : page,
  );
}

export function rotateAll(pages: readonly BoardPage[]): BoardPage[] {
  return pages.map((page) => ({ ...page, rotation: QUARTER_TURN[page.rotation] }));
}

export function removePage(pages: readonly BoardPage[], id: string): BoardPage[] {
  return pages.filter((page) => page.id !== id);
}

export type SortDirection = 'asc' | 'desc';

/**
 * Files in name order, each one's pages back in the order they sit inside it. Reaching
 * for A–Z means "put this back the way the filenames say", so a hand-shuffle inside a
 * file is undone too — anything less is a half-sort.
 *
 * Compared with `numeric`, so part-2 lands before part-10 rather than after it.
 */
export function sortByName(
  pages: readonly BoardPage[],
  names: readonly string[],
  direction: SortDirection,
): BoardPage[] {
  const order = [...new Set(pages.map((page) => page.source))].sort((a, b) => {
    const compared = (names[a] ?? '').localeCompare(names[b] ?? '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });

    return direction === 'asc' ? compared : -compared;
  });

  return order.flatMap((source) =>
    pages.filter((page) => page.source === source).sort((a, b) => a.page - b.page),
  );
}

export function reversePages(pages: readonly BoardPage[]): BoardPage[] {
  return [...pages].reverse();
}

export function toPlan(pages: readonly BoardPage[]): PagePlan[] {
  return pages.map(({ source, page, rotation }) => ({ source, page, rotation }));
}

/** Width over height as the card should draw it, quarter turns included. */
export function displayRatio(page: BoardPage): number {
  const quarterTurned = page.rotation === 90 || page.rotation === 270;

  return quarterTurned ? page.height / page.width : page.width / page.height;
}
