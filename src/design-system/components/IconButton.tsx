import type { Icon } from '@phosphor-icons/react/lib';
import type { ButtonHTMLAttributes } from 'react';
import { type ButtonSize, type ButtonVariant, buttonClass } from './Button';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  readonly icon: Icon;
  /** Required: an icon alone tells a screen reader nothing. */
  readonly label: string;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
}

export function IconButton({
  icon: Glyph,
  label,
  variant,
  size,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      className={buttonClass({ variant, size, iconOnly: true, className })}
    >
      <Glyph size="1.25em" weight="regular" aria-hidden />
    </button>
  );
}
