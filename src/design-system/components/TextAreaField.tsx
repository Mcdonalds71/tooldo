import { useId } from 'react';

export interface TextAreaFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly rows?: number;
  readonly className?: string;
}

/** `TextField`'s multi-line sibling — same calm register, same label/hint shape. */
export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 3,
  className,
}: TextAreaFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="field__control field__control--textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-describedby={hintId}
      />
      {hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
