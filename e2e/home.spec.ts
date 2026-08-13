import { expect, test } from '@playwright/test';
import { tools } from '../src/lib/tools';

test('the home page shows every registered tool', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const cards = page.locator('#tools li');
  await expect(cards).toHaveCount(tools.length);

  for (const tool of tools) {
    await expect(page.getByRole('heading', { name: tool.name, exact: true })).toBeVisible();
  }
});

/**
 * Runs under the reduced-motion project too, which is the point: the bento has to
 * reach its resting state from CSS alone, without waiting on GSAP.
 */
test('the hero bento shows the preview, the badge, and the promise', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.preview__saved')).toHaveText(/86%/);
  await expect(page.getByRole('link', { name: 'Explore', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read the privacy promise' })).toBeVisible();
});

test('the keyboard path starts with a skip link', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
});

test('the privacy promise is reachable and states the promise', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Read the privacy promise' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Your files never leave your device.',
  );
});

/**
 * The bento is a hand-solved tessellation: nine cards filling a 12x4 grid with no
 * holes. Every card has to fill its own cell for that to hold, which is exactly what
 * broke when a wrapper element was once introduced between the grid item and the card
 * — `height: 100%` then resolved against the wrapper instead of the cell, and every
 * card shrank to its content. This asserts the cards actually fill their cells.
 */
test('the desktop bento tessellates with every card filling its cell', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the bento only applies from 64rem up');

  await page.goto('/');

  const bento = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.tools__item')];
    return {
      gridDisplay: getComputedStyle(document.querySelector('.tools__grid') as Element).display,
      positions: [...new Set(items.map((i) => getComputedStyle(i).position))],
      cells: items.map((item) => {
        const card = item.querySelector('.card');
        return {
          itemHeight: Math.round(item.getBoundingClientRect().height),
          cardHeight: card ? Math.round(card.getBoundingClientRect().height) : 0,
        };
      }),
    };
  });

  expect(bento.cells).toHaveLength(9);
  // The phone stack must not leak upward: this stays a grid of static items.
  expect(bento.gridDisplay).toBe('grid');
  expect(bento.positions).toEqual(['static']);
  for (const { itemHeight, cardHeight } of bento.cells) {
    expect(Math.abs(itemHeight - cardHeight)).toBeLessThanOrEqual(1);
  }
});

/**
 * On a phone the nine cards become a deck: each pins under the nav and the next rides
 * up over it, reversing on the way back because that is what `sticky` does on its own.
 *
 * Two things make or break it, and both are asserted here. The cards must be sticky
 * *themselves* rather than wrapped in a sticky helper — a wrapper becomes the new
 * reference for `ToolCard`'s `height: 100%` and collapses the desktop bento. And no
 * ancestor may be a scroll container, since `overflow-x: hidden` anywhere above a
 * sticky element silently disables it.
 */
test('the phone card stack pins each card under the nav', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'the deck only replaces the grid below 48rem');

  await page.goto('/');

  const stack = await page.evaluate(async () => {
    const items = [...document.querySelectorAll('.tools__item')].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    const grid = document.querySelector('.tools__grid');
    const [first, second, third] = items;
    if (!grid || !first || !second || !third) throw new Error('tools grid not found');

    const settle = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 250)));

    const scrollContainerAncestors: string[] = [];
    let node: HTMLElement | null = first;
    while (node && node !== document.documentElement) {
      const overflowX = getComputedStyle(node).overflowX;
      if (overflowX === 'hidden' || overflowX === 'scroll' || overflowX === 'auto') {
        scrollContainerAncestors.push(`${node.tagName}.${node.className}`);
      }
      node = node.parentElement;
    }

    const gridTop = grid.getBoundingClientRect().top + window.scrollY;

    /* `behavior: 'instant'` is load-bearing: the site sets `scroll-behavior: smooth`
       globally, so a plain `scrollTo` *animates* and a sample taken a moment later
       reads a position the page is still travelling through rather than the one asked
       for. That is a test artefact, not a layout bug, and it looked exactly like a
       pinned card sliding when it was not. */
    const jumpTo = async (top: number) => {
      window.scrollTo({ top, behavior: 'instant' });
      await settle();
    };

    /* Sampled early on purpose. The first card pins almost immediately — it sits at
       the very top of the list — while the second is still travelling up toward its
       own resting place, which is the one moment where "pinned" and "climbing" are
       both observable. A few hundred pixels further in, every early card has pinned
       and there is no climb left to catch. */
    await jumpTo(gridTop);
    const firstAtA = first.getBoundingClientRect().top;
    const secondAtA = second.getBoundingClientRect().top;

    await jumpTo(gridTop + 60);
    const firstAtB = first.getBoundingClientRect().top;
    const secondAtB = second.getBoundingClientRect().top;

    // Deeper in, where the first card has been fully buried and has finished receding.
    await jumpTo(gridTop + 500);

    /** Rendered scale and brightness of a card, which is how far it has receded.
     *  Brightness rather than opacity: the dim is a `filter`, deliberately, so a
     *  buried card's ink border and hard shadow darken instead of turning
     *  translucent and letting the next card show straight through them. */
    const receded = (el: HTMLElement) => {
      const card = el.querySelector('.card');
      if (!card) return { scale: 1, brightness: 1 };
      const cs = getComputedStyle(card);
      const matrix = cs.transform.match(/matrix\(([^)]+)\)/);
      const scale = matrix?.[1] ? Number.parseFloat(matrix[1].split(',')[0] ?? '1') : 1;
      const brightnessMatch = cs.filter.match(/brightness\(([^)]+)\)/);
      const brightness = brightnessMatch?.[1] ? Number.parseFloat(brightnessMatch[1]) : 1;
      return { scale, brightness };
    };

    return {
      gridDisplay: getComputedStyle(grid).display,
      firstPosition: getComputedStyle(first).position,
      zOrder: [first, second, third].map((el) => Number(getComputedStyle(el).zIndex)),
      scrollContainerAncestors,
      firstAtA: Math.round(firstAtA),
      firstAtB: Math.round(firstAtB),
      secondAtA: Math.round(secondAtA),
      secondAtB: Math.round(secondAtB),
      firstReceded: receded(first),
      lastReceded: receded(items[items.length - 1] as HTMLElement),
    };
  });

  expect(stack.gridDisplay).toBe('block');
  expect(stack.firstPosition).toBe('sticky');
  expect(stack.scrollContainerAncestors).toEqual([]);
  // Later cards paint over earlier ones.
  expect(stack.zOrder).toEqual([1, 2, 3]);
  // The first card is pinned near the top and holds there across both samples, while
  // the second is still travelling up toward its own resting place.
  expect(Math.abs(stack.firstAtA - stack.firstAtB)).toBeLessThan(2);
  expect(stack.firstAtB).toBeLessThan(200);
  expect(stack.secondAtB).toBeLessThan(stack.secondAtA);
  /* The buried card has visibly shrunk and dimmed — the half of the effect that reads
     as movement, and the half a `view()` timeline could not drive because a stuck
     element stops moving exactly when this needs to run. Brightness, not opacity, so
     the border and shadow darken rather than turning see-through. */
  expect(stack.firstReceded.scale).toBeLessThan(0.95);
  expect(stack.firstReceded.brightness).toBeLessThan(0.9);
  // Nothing ever covers the last card, so it never recedes.
  expect(stack.lastReceded.scale).toBe(1);
  expect(stack.lastReceded.brightness).toBe(1);
});

/**
 * The 'reduced-motion' project runs at desktop width, so it never sees the phone deck
 * at all — this asserts the gate directly instead, by forcing the preference on a
 * mobile-width page. `sticky` and the climb it produces are motion regardless of
 * whether anything is separately animated on top, so this has to disable the deck
 * entirely rather than merely skip the shrink-and-dim tween.
 */
test('the phone deck turns itself off under reduced motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'only meaningful at phone width');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const first = page.locator('.tools__item').first();
  await expect(first).toHaveCSS('position', 'static');
});
