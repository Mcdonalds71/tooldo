export interface SpinnerProps {
  readonly className?: string | undefined;
}

/** Decorative — whatever contains it owns announcing the busy state. */
export function Spinner({ className }: SpinnerProps) {
  return <span className={className ? `spinner ${className}` : 'spinner'} aria-hidden />;
}
