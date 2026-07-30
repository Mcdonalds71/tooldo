import type { ReactNode } from 'react';
import { buttonClass } from './Button';

/**
 * Every "nothing here yet" moment in the suite, in one shape: name the win, say what
 * happens in a line, and put the action right there. Never a shrug.
 */
export type EmptyStateVariant = 'initial' | 'no-results' | 'error' | 'offline';

export interface EmptyStateProps {
  /** Animated, on-brand, and decorative — it carries no information of its own. */
  readonly illustration: ReactNode;
  readonly headline: string;
  readonly subtext: string;
  readonly primaryAction: ReactNode;
  readonly sampleAction?: { readonly label: string; readonly onTry: () => void } | undefined;
  readonly variant?: EmptyStateVariant | undefined;
}

export function EmptyState({
  illustration,
  headline,
  subtext,
  primaryAction,
  sampleAction,
  variant = 'initial',
}: EmptyStateProps) {
  return (
    <div className={`empty empty--${variant}`} {...(variant === 'error' ? { role: 'alert' } : {})}>
      <span className="empty__art" aria-hidden>
        {illustration}
      </span>

      <h2 className="empty__headline">{headline}</h2>
      <p className="empty__subtext">{subtext}</p>

      <div className="empty__actions">
        {primaryAction}
        {sampleAction ? (
          <button
            type="button"
            className={buttonClass({ variant: 'ghost', size: 'sm' })}
            onClick={sampleAction.onTry}
          >
            {sampleAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
