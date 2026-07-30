import type { Icon } from '@phosphor-icons/react/lib';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ink' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** `| undefined` throughout: callers forward optional props straight through. */
export interface ButtonStyleOptions {
  readonly variant?: ButtonVariant | undefined;
  readonly size?: ButtonSize | undefined;
  readonly loading?: boolean | undefined;
  readonly iconOnly?: boolean | undefined;
  readonly className?: string | undefined;
}

/** Exported so a real `<a>` can wear the button styling without forking the component. */
export function buttonClass(options: ButtonStyleOptions = {}): string {
  const { variant = 'secondary', size = 'md', loading, iconOnly, className } = options;
  const classes = ['btn', `btn--${variant}`, `btn--${size}`];

  if (iconOnly) classes.push('btn--icon');
  if (loading) classes.push('btn--loading');
  if (className) classes.push(className);

  return classes.join(' ');
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<ButtonStyleOptions, 'className' | 'iconOnly'> {
  /** Announced while loading, since the visible label is hidden. */
  readonly loadingLabel?: string;
  readonly icon?: Icon;
  readonly badge?: ReactNode;
}

export function Button({
  variant,
  size,
  loading = false,
  loadingLabel = 'Working',
  icon: LeadingIcon,
  badge,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, loading, className })}
    >
      <span className="btn__label">
        {LeadingIcon ? <LeadingIcon size="1.25em" weight="regular" aria-hidden /> : null}
        {children}
        {badge ? <span className="btn__badge">{badge}</span> : null}
      </span>
      {loading ? (
        <span className="btn__spinner">
          <span className="btn__spinner-ring" />
          <span className="sr-only">{loadingLabel}</span>
        </span>
      ) : null}
    </button>
  );
}
