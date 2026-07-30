export interface ProgressProps {
  /** How far along, 0 to 1. For work that can't report a figure, show a Spinner instead. */
  readonly value: number;
  readonly label: string;
  readonly className?: string | undefined;
}

/**
 * A native `<progress>`: it announces itself to screen readers without any ARIA, and
 * it needs no inline width — which is what keeps `style-src 'self'` free of unsafe-inline.
 */
export function Progress({ value, label, className }: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), 1);

  return (
    <progress
      className={className ? `progress ${className}` : 'progress'}
      value={clamped}
      max={1}
      aria-label={label}
    >
      {Math.round(clamped * 100)}%
    </progress>
  );
}
