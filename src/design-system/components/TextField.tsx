import { useId } from 'react';

export type TextFieldType = 'text' | 'email' | 'tel' | 'number' | 'date';

export interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly type?: TextFieldType;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly autoComplete?: string;
  readonly min?: string;
  readonly max?: string;
  readonly step?: string;
  readonly className?: string;
}

/**
 * The calm register from `tokens.css`'s `--field-*` set: a thin line, not a hard
 * shadow, because a form with a dozen of these needs to stay comfortable, not shout —
 * the same reasoning `Card`'s `calm` tone documents for dense working UI.
 */
export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  error,
  required,
  autoComplete,
  min,
  max,
  step,
  className,
}: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="field__required" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <input
        id={id}
        className="field__control"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        min={min}
        max={max}
        step={step}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
      />
      {hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
