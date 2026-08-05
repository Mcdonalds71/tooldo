import { describe, expect, it } from 'vitest';
import {
  appendPages,
  type BoardPage,
  displayRatio,
  movePage,
  removePage,
  reversePages,
  rotateAll,
  rotatePage,
  shiftPage,
  sortByName,
  toPlan,
} from './board';
import type { InspectResult } from './types';

function board(count: number, source = 0): BoardPage[] {
  return Array.from({ length: count }, (_unused, page) => ({
    id: `${source}:${page}`,
    source,
    page,
    rotation: 0 as const,
    width: 200,
    height: 400,
  }));
}

const order = (pages: readonly BoardPage[]) => pages.map((page) => page.id);

describe('appendPages', () => {
  it('numbers a later batch on from the files already held', () => {
    const inspected: InspectResult = {
      sources: [{ name: 'extra.pdf', bytes: 10, pages: 2 }],
      pages: [
        { source: 0, page: 0, width: 200, height: 400 },
        { source: 0, page: 1, width: 200, height: 400 },
      ],
    };

    const pages = appendPages(board(1), inspected, 1);

    expect(order(pages)).toEqual(['0:0', '1:0', '1:1']);
    expect(pages.every((page) => page.rotation === 0)).toBe(true);
  });
});

describe('movePage', () => {
  it('drops a page in front of the one that was at the target', () => {
    expect(order(movePage(board(4), '0:3', 1))).toEqual(['0:0', '0:3', '0:1', '0:2']);
  });

  it('moves a page later without leaving a hole behind it', () => {
    expect(order(movePage(board(4), '0:0', 2))).toEqual(['0:1', '0:2', '0:0', '0:3']);
  });

  it.each([
    ['past the end', 9, ['0:1', '0:2', '0:0']],
    ['before the start', -4, ['0:0', '0:1', '0:2']],
  ])('clamps a target %s', (_case, to, expected) => {
    expect(order(movePage(board(3), '0:0', to))).toEqual(expected);
  });

  it('leaves the board alone when the id is not on it', () => {
    expect(order(movePage(board(3), 'nope', 0))).toEqual(['0:0', '0:1', '0:2']);
  });
});

describe('shiftPage', () => {
  it('steps a page one place either way', () => {
    expect(order(shiftPage(board(3), '0:1', 1))).toEqual(['0:0', '0:2', '0:1']);
    expect(order(shiftPage(board(3), '0:1', -1))).toEqual(['0:1', '0:0', '0:2']);
  });

  it('does nothing at the ends', () => {
    expect(order(shiftPage(board(3), '0:0', -1))).toEqual(['0:0', '0:1', '0:2']);
    expect(order(shiftPage(board(3), '0:2', 1))).toEqual(['0:0', '0:1', '0:2']);
  });
});

describe('rotating', () => {
  it('turns one page a quarter at a time and comes back round', () => {
    let pages: readonly BoardPage[] = board(2);
    const angles: number[] = [];

    for (let turn = 0; turn < 5; turn += 1) {
      pages = rotatePage(pages, '0:0');
      angles.push(pages[0]?.rotation ?? -1);
    }

    expect(angles).toEqual([90, 180, 270, 0, 90]);
    expect(pages[1]?.rotation).toBe(0);
  });

  it('turns every page together', () => {
    const pages = rotateAll(rotatePage(board(3), '0:1'));

    expect(pages.map((page) => page.rotation)).toEqual([90, 180, 90]);
  });
});

describe('removePage', () => {
  it('takes a page off the board and leaves the rest in order', () => {
    expect(order(removePage(board(3), '0:1'))).toEqual(['0:0', '0:2']);
  });
});

describe('sortByName', () => {
  const mixed = () => [...board(2, 1), ...board(1, 0), ...board(1, 2)];
  const names = ['minutes.pdf', 'agenda.pdf', 'notes.pdf'];

  it('puts the files in name order and their pages back in file order', () => {
    const shuffled = movePage(mixed(), '1:0', 3);

    expect(order(sortByName(shuffled, names, 'asc'))).toEqual(['1:0', '1:1', '0:0', '2:0']);
  });

  it('reverses the file order without reversing the pages inside a file', () => {
    expect(order(sortByName(mixed(), names, 'desc'))).toEqual(['2:0', '0:0', '1:0', '1:1']);
  });

  it('reads a number in a name as a number, so part 2 comes before part 10', () => {
    const pages = [...board(1, 0), ...board(1, 1)];

    expect(order(sortByName(pages, ['part-10.pdf', 'part-2.pdf'], 'asc'))).toEqual(['1:0', '0:0']);
  });

  it('keeps the turn a page was given', () => {
    const turned = rotatePage(mixed(), '0:0');

    expect(sortByName(turned, names, 'asc').find((page) => page.id === '0:0')?.rotation).toBe(90);
  });

  it('leaves a file with no name where the comparison puts it, rather than dropping it', () => {
    expect(sortByName(mixed(), [], 'asc')).toHaveLength(4);
  });
});

describe('reversePages', () => {
  it('flips the whole board and leaves the original alone', () => {
    const pages = board(3);

    expect(order(reversePages(pages))).toEqual(['0:2', '0:1', '0:0']);
    expect(order(pages)).toEqual(['0:0', '0:1', '0:2']);
  });
});

describe('toPlan', () => {
  it('hands the engine only what it needs to build the document', () => {
    const pages = rotatePage(movePage(board(2), '0:1', 0), '0:1');

    expect(toPlan(pages)).toEqual([
      { source: 0, page: 1, rotation: 90 },
      { source: 0, page: 0, rotation: 0 },
    ]);
  });
});

describe('displayRatio', () => {
  it('swaps the sides for a quarter turn and leaves a half turn alone', () => {
    const [page] = board(1);
    if (!page) throw new Error('the fixture is empty');

    expect(displayRatio(page)).toBeCloseTo(0.5);
    expect(displayRatio({ ...page, rotation: 90 })).toBeCloseTo(2);
    expect(displayRatio({ ...page, rotation: 180 })).toBeCloseTo(0.5);
  });
});
