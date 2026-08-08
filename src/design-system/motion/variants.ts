import type { Variants } from 'motion/react';
import { DURATION, EASE_OUT, SPRING_SNAPPY } from './transitions';

/**
 * Shared so components never re-declare a transition. Both animate transform and
 * opacity only; under reduced motion callers swap in `instant`, which keeps the fade
 * and drops the movement.
 */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.fast, ease: EASE_OUT } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION.fast, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: DURATION.fast, ease: EASE_OUT } },
};

/**
 * A file arriving in the container that took it: down from above, with the spring's
 * small overshoot standing in for the weight of it landing.
 */
export const dropIn: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: SPRING_SNAPPY },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE_OUT } },
};

/** For the container above `dropIn` children, so a batch lands one after another. */
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

export const instant: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.fast } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};
