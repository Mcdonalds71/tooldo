import { expect, type Page, test } from '@playwright/test';
import { tools } from '../src/lib/tools';

test('the story sections are all present and in order', async ({ page }) => {
  await page.goto('/');

  const sections = ['#tools', '#different', '.proof', '.install', '#price', '#trust', '.closing'];
  const tops = await Promise.all(
    sections.map(async (selector) => {
      const box = await page.locator(selector).first().boundingBox();
      return box ? box.y : Number.NaN;
    }),
  );

  expect(tops.every((top) => Number.isFinite(top))).toBe(true);
  expect([...tops].sort((a, b) => a - b)).toEqual(tops);
});

/**
 * Every gap around every divider has to be the same, above and below, at whatever
 * viewport. Asserting the gaps are equal *to each other* rather than to a hardcoded
 * number is deliberate: desktop and mobile use different values on purpose, and the
 * invariant that matters is evenness, not a specific pixel count.
 *
 * The two traps this test exists to catch, both of which shipped before it did:
 *   - a section with a min-height and centred content, whose *box* sits the correct
 *     distance from the divider while its visible content sits hundreds of pixels away;
 *   - a GSAP `pin`, whose `pin-spacer` is by construction as tall as the pin's scroll
 *     range, leaving a spacer-sized hole once the pin releases.
 * Both are invisible to a measurement of section boxes, so this walks the DOM for the
 * lowest and highest actually-painted element instead.
 *
 * `#trust -> .closing` is checked on its own, separately, below: that boundary has no
 * divider at all by design (the closing card runs straight on from the last reason),
 * so it can't be folded into "every divider has an equal gap" — it asserts the
 * opposite, that there is no gap.
 */
test('every section boundary has the same gap above and below', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    // Finished state for every reveal, so this measures layout rather than whatever
    // happened to be mid-animation at this scroll position.
    const settled = document.createElement('style');
    settled.textContent =
      '.reveal{animation:none!important;opacity:1!important;transform:none!important;clip-path:none!important}';
    document.head.appendChild(settled);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 300)));

    // Every boundary that still carries a divider — #trust -> .closing deliberately
    // does not, and is asserted separately.
    const order = ['.tools', '#different', '.proof', '.install', '#price', '#trust'];
    const dividers = [...document.querySelectorAll('.divider')];
    const sections = order.map((sel) => document.querySelector(sel));

    function paintedBounds(root: Element) {
      let top = Number.POSITIVE_INFINITY;
      let bottom = Number.NEGATIVE_INFINITY;
      const walk = (el: Element) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;
        const r = el.getBoundingClientRect();
        const paints =
          el.childElementCount === 0 ||
          cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
          cs.borderTopWidth !== '0px' ||
          cs.borderBottomWidth !== '0px';
        if (paints && r.height > 0 && r.width > 0) {
          top = Math.min(top, r.top);
          bottom = Math.max(bottom, r.bottom);
        }
        for (const c of el.children) walk(c);
      };
      walk(root);
      return { top, bottom };
    }

    return dividers.map((d, i) => {
      const dRect = d.getBoundingClientRect();
      const a = paintedBounds(sections[i] as Element);
      const b = paintedBounds(sections[i + 1] as Element);
      return {
        between: `${order[i]} -> ${order[i + 1]}`,
        above: Math.round(dRect.top - a.bottom),
        below: Math.round(b.top - dRect.bottom),
      };
    });
  });

  expect(result).toHaveLength(5);

  const first = result[0]?.above ?? 0;
  expect(first).toBeGreaterThan(0);

  for (const gap of result) {
    // Symmetric around its own divider, and identical to every other boundary.
    expect(gap, `${gap.between} is asymmetric`).toMatchObject({ above: first, below: first });
  }
});

/**
 * There is deliberately no `.divider` element on this one boundary — the closing card
 * follows the last reason with nothing between them but paper — but the *gap* still
 * has to match every other section boundary on the page, just without the line and
 * mark. A card whose own `margin-top` happens to equal the shared spacing value only
 * proves the number is right; it doesn't prove nothing else nudged the layout since,
 * so this compares it against a real divider's gap on the same page load rather than
 * asserting a literal pixel count.
 */
test('the closing card has no divider but the same gap as every other boundary', async ({
  page,
}) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const settled = document.createElement('style');
    settled.textContent =
      '.reveal{animation:none!important;opacity:1!important;transform:none!important;clip-path:none!important}';
    document.head.appendChild(settled);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 300)));

    const trust = document.querySelector('#trust') as Element;
    const closing = document.querySelector('.closing') as Element;
    const dividerBetween = [...document.querySelectorAll('.divider')].find((d) => {
      const p = d.getBoundingClientRect().top;
      return p > trust.getBoundingClientRect().top && p < closing.getBoundingClientRect().bottom;
    });

    const referenceDivider = document.querySelector('.divider') as Element;
    const referenceSection = referenceDivider.previousElementSibling as Element;

    return {
      hasDivider: !!dividerBetween,
      trustToClosingGap: Math.round(
        closing.getBoundingClientRect().top - trust.getBoundingClientRect().bottom,
      ),
      referenceGap: Math.round(
        referenceDivider.getBoundingClientRect().top -
          referenceSection.getBoundingClientRect().bottom,
      ),
    };
  });

  expect(result.hasDivider).toBe(false);
  expect(result.trustToClosingGap).toBe(result.referenceGap);
});

test('the closing block runs full-bleed and meets the footer with no seam', async ({ page }) => {
  await page.goto('/');

  const seam = await page.evaluate(() => {
    const card = document.querySelector('.closing__card') as Element;
    const footer = document.querySelector('.footer') as Element;
    return {
      cardWidth: Math.round(card.getBoundingClientRect().width),
      viewportWidth: document.documentElement.clientWidth,
      gap: Math.round(footer.getBoundingClientRect().top - card.getBoundingClientRect().bottom),
      cardPaddingBottom: getComputedStyle(card).paddingBottom,
      footerPaddingTop: getComputedStyle(footer).paddingTop,
    };
  });

  expect(seam.cardWidth).toBe(seam.viewportWidth);
  expect(seam.gap).toBe(0);
  // Both halves of the seam are written from the same token, so they must agree.
  expect(seam.cardPaddingBottom).toBe(seam.footerPaddingTop);
});

test('the offline section does not overpromise', async ({ page }) => {
  await page.goto('/');
  const install = page.locator('.install');

  /* ADR 0017: a tool that has never been opened still needs a connection the first
     time, so the honest claim is scoped to the tools you have used. This assertion
     exists to fail if that ever gets "improved" into a flat everything-works-offline. */
  await expect(install).toContainText("the tools you've opened keep working");
});

test('the closing call sends you back to the suite', async ({ page }) => {
  await page.goto('/');

  const cta = page.locator('.closing__cta');
  await expect(cta).toHaveText(/Open the tools/);
  await cta.click();

  await expect(page.locator('#tools')).toBeInViewport();
});

/** Scrubbed motion is driven by rAF, so a frame has to actually be painted between
 *  the scroll and the sample or every read comes back on the start value.
 *
 *  `behavior: 'instant'` overrides the site's global `scroll-behavior: smooth`, which
 *  would otherwise animate the jump and leave the sample reading a position the page
 *  is still travelling through rather than the one this asked for. */
async function scrollAndSettle(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.waitForTimeout(700);
}

function scaleX(transform: string): number {
  const match = transform.match(/matrix\(([^,]+)/);
  return match?.[1] ? Number.parseFloat(match[1]) : Number.NaN;
}

test('the proof plays its beats as you scroll through it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'reduced-motion', 'motion is off there by design');
  test.skip(testInfo.project.name === 'mobile', 'the cord is not on screen below 56rem');

  await page.goto('/');

  /* The trigger runs `top bottom` -> `bottom top`: progress 0 when the section's top
     edge reaches the viewport's bottom edge, progress 1 when its bottom edge reaches
     the viewport's top. So the whole scrub spans (sectionHeight + viewportHeight) of
     scrolling, and a given progress maps to a scroll position directly — no guessing
     at multiples of the viewport, which is what broke when this section stopped being
     pinned and its scroll range stopped being `+=180%`. */
  const geometry = await page.evaluate(() => {
    const section = document.querySelector('.proof') as HTMLElement;
    const rect = section.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      height: rect.height,
      viewportHeight: window.innerHeight,
    };
  });

  const atProgress = (p: number) =>
    geometry.top - geometry.viewportHeight + p * (geometry.height + geometry.viewportHeight);

  // The cord retracts between timeline 0.42 and 0.64, the stamp lands from 0.64.
  await scrollAndSettle(page, atProgress(0.3));
  const wireAtStart = await page
    .locator('.proof__wire')
    .evaluate((el) => getComputedStyle(el).transform);
  const stampAtStart = await page
    .locator('.proof__stamp')
    .evaluate((el) => getComputedStyle(el).opacity);

  await scrollAndSettle(page, atProgress(0.95));
  const wireAtEnd = await page
    .locator('.proof__wire')
    .evaluate((el) => getComputedStyle(el).transform);
  const stampAtEnd = await page
    .locator('.proof__stamp')
    .evaluate((el) => getComputedStyle(el).opacity);

  // The cord retracts toward the device and the stamp lands.
  expect(scaleX(wireAtEnd)).toBeLessThan(scaleX(wireAtStart));
  expect(Number(stampAtEnd)).toBeGreaterThan(Number(stampAtStart));
});

test('the proof rests on its finished frame without motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'reduced-motion', 'this is the reduced-motion contract');

  await page.goto('/');
  await page.locator('.proof').scrollIntoViewIfNeeded();

  /* Nothing is pinned and nothing tweens, so the argument has to already be made in
     the resting CSS — the stamp visible and the run complete, not a half-told story. */
  await expect(page.locator('.proof__stamp')).toBeVisible();
  await expect(page.locator('.proof__done')).toBeVisible();
  expect(await page.locator('.pin-spacer').count()).toBe(0);
});

/**
 * Absolute scroll positions computed from the element's own page geometry, the same
 * pattern the GSAP proof test above uses — `scrollIntoViewIfNeeded` plus a guessed
 * pixel offset was landing inconsistently inside or outside the animation's `entry`
 * range depending on the element's height, which is exactly the flake that pattern
 * exists to avoid.
 */
async function elementTop(locator: import('@playwright/test').Locator): Promise<number> {
  const box = await locator.boundingBox();
  const scrollY = await locator.page().evaluate(() => window.scrollY);
  return (box?.y ?? 0) + scrollY;
}

test('section headings wipe into view rather than just appearing', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'reduced-motion', 'motion is off there by design');

  await page.goto('/');
  const heading = page.locator('#different .reveal--mask').first();
  const top = await elementTop(heading);
  const viewportHeight = page.viewportSize()?.height ?? 800;

  /** The right-hand inset of `inset(0px R% 0px 0px)` — how much of the element is
   *  still hidden behind the wipe. 100 means untouched, 0 means fully revealed. */
  function clipRightPercent(clipPath: string): number {
    const match = clipPath.match(/inset\([^ ]+ ([\d.]+)%/);
    return match?.[1] ? Number.parseFloat(match[1]) : 0;
  }

  // 0% entry: the element's top edge sits exactly at the viewport's bottom edge, so
  // it has only just begun to enter and the wipe has barely started.
  await scrollAndSettle(page, top - viewportHeight);
  const before = await heading.evaluate((el) => getComputedStyle(el).clipPath);

  // Scrolled well past the 32% completion point.
  await scrollAndSettle(page, top - viewportHeight * 0.4);
  const after = await heading.evaluate((el) => getComputedStyle(el).clipPath);

  expect(before).not.toBe(after);
  // Started almost fully hidden, ends almost fully revealed.
  expect(clipRightPercent(before)).toBeGreaterThan(80);
  expect(clipRightPercent(after)).toBeLessThan(5);
});

test('feature row text and artwork travel in from opposite sides', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'reduced-motion', 'motion is off there by design');
  test.skip(testInfo.project.name === 'mobile', 'directional reveals collapse to up on mobile');

  await page.goto('/');
  const row = page.locator('.row').first();
  const text = row.locator('.row__text .reveal');
  const visual = row.locator('.row__visual .reveal');

  await expect(text).toHaveClass(/reveal--left/);
  await expect(visual).toHaveClass(/reveal--right/);

  const top = await elementTop(row);
  const viewportHeight = page.viewportSize()?.height ?? 800;

  /** translateX distance from a `matrix(a, b, c, d, tx, ty)` string — 'none' reads
   *  as 0, matching the settled state without requiring the exact string. */
  function translateXMagnitude(transform: string): number {
    const match = transform.match(/matrix\(([^)]+)\)/);
    if (!match?.[1]) return 0;
    const parts = match[1].split(',').map((n) => Number.parseFloat(n.trim()));
    return Math.abs(parts[4] ?? 0);
  }

  await scrollAndSettle(page, top - viewportHeight);
  const textBefore = await text.evaluate((el) => getComputedStyle(el).transform);
  const visualBefore = await visual.evaluate((el) => getComputedStyle(el).transform);

  await scrollAndSettle(page, top - viewportHeight * 0.4);
  const textAfter = await text.evaluate((el) => getComputedStyle(el).transform);
  const visualAfter = await visual.evaluate((el) => getComputedStyle(el).transform);

  expect(textAfter).not.toBe(textBefore);
  expect(visualAfter).not.toBe(visualBefore);
  // Both started meaningfully off-position and travelled back toward their resting
  // place — text arrived from the left (negative tx), artwork from the right.
  expect(translateXMagnitude(textBefore)).toBeGreaterThan(20);
  expect(translateXMagnitude(visualBefore)).toBeGreaterThan(20);
  expect(translateXMagnitude(textAfter)).toBeLessThan(5);
  expect(translateXMagnitude(visualAfter)).toBeLessThan(5);
});

test('the trust grid names every promise once', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.reason')).toHaveCount(6);
  await expect(page.locator('.term')).toHaveCount(3);
  await expect(page.locator('.row')).toHaveCount(3);

  // The suite count in the copy is derived, so it cannot drift from the registry.
  await expect(page.locator('#different')).toContainText(`One look across all ${tools.length}`);
});

test('each reason’s icon sits centred beside its text, not pinned to the top', async ({ page }) => {
  await page.goto('/');

  const reason = page.locator('.reason').first();
  await expect(reason).toHaveCSS('align-items', 'center');

  const icon = reason.locator('.reason__icon');
  // The direct-child div wrapping the heading and body together — comparing against
  // this rather than the heading alone, since flex centres the icon against the
  // *whole* sibling (heading + body stacked), not against the first line of it.
  const textBlock = reason.locator(':scope > div');
  const [iconBox, textBox] = await Promise.all([icon.boundingBox(), textBlock.boundingBox()]);
  if (!iconBox || !textBox) throw new Error('missing icon or text-block box');

  // Centred means the two midpoints coincide; 'start' would leave the icon's top
  // pinned to the text block's top instead, offsetting the centres by roughly half
  // the height difference between them.
  const iconCenter = iconBox.y + iconBox.height / 2;
  const textCenter = textBox.y + textBox.height / 2;
  expect(Math.abs(iconCenter - textCenter)).toBeLessThan(2);
});
