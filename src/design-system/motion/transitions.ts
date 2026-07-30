import type { Transition } from 'motion/react';

/**
 * The same easing and durations as `--ease-out` and `--dur-*` in tokens.css. A JS
 * animation can't read a CSS variable as a number, so these two files move together —
 * change one and change the other.
 */

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DURATION = {
  press: 0.12,
  fast: 0.15,
  base: 0.25,
  slow: 0.45,
} as const;

export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 400, damping: 30 };
