import type { HTMLAttributes } from 'react';

/**
 * `brut` is the hero register — chunky border, hard shadow. `calm` is for the dense
 * working UI the restraint rule asks to keep quiet: option panels, tables, long forms.
 */
export type CardTone = 'brut' | 'calm';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly tone?: CardTone | undefined;
}

export function Card({ tone = 'brut', className, children, ...rest }: CardProps) {
  const classes = ['card-surface', `card-surface--${tone}`];
  if (className) classes.push(className);

  return (
    <div {...rest} className={classes.join(' ')}>
      {children}
    </div>
  );
}
