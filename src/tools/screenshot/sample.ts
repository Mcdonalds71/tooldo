import type { BeautifyOptions } from './types';

/** A styled preset, not `DEFAULT_OPTIONS` — the point of a sample is to show what the
 *  panel can do, including the browser frame, which defaults off. */
export const SAMPLE_OPTIONS: BeautifyOptions = {
  background: 'sunset',
  paddingPercent: 10,
  cornerRadius: 20,
  shadow: true,
  browserFrame: true,
};
