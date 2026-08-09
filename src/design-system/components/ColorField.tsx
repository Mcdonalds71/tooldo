import { useId } from 'react';

export interface ColorFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly hint?: string;
  readonly className?: string;
}

/** `TextField`'s color-picking sibling — same calm register and label/hint shape, a
 *  native `<input type="color">` underneath so the OS's own picker (which already
 *  offers precise hex entry) does the hard part. The hex value next to it is a
 *  read-only label, not a second input, so there's one source of truth for the color
 *  rather than two fields that could drift out of sync. */
export function ColorField({ label, value, onChange, hint, className }: ColorFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__color-wrap">
        <input
          id={id}
          className="field__color-swatch"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={hintId}
        />
        <span className="field__color-value">{value.toUpperCase()}</span>
      </div>
      {hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
