import type { QrStyle } from './types';

export const SAMPLE_CONTENT = 'https://tooldo.online';

/** A styled preset, not `DEFAULT_STYLE` — the point of a sample is to show what the
 *  styling panel can do, not just that content renders. */
export const SAMPLE_STYLE: QrStyle = {
  foreground: '#ff3b14',
  background: '#f4f0e7',
  dotStyle: 'rounded',
  cornerStyle: 'extra-rounded',
  logoDataUrl: null,
};
