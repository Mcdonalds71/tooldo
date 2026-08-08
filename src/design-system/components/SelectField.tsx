import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr';
import { useId } from 'react';

export interface SelectOption<Value extends string> {
  readonly value: Value;
  readonly label: string;
}

export interface SelectFieldProps<Value extends string> {
  readonly label: string;
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  readonly options: readonly SelectOption<Value>[];
  readonly hint?: string;
  readonly className?: string;
}

/** `TextField`'s single-choice sibling — same calm register, same label/hint shape,
 *  a native `<select>` underneath rather than a custom listbox: full keyboard and
 *  screen-reader behaviour for free, which a hand-built popup would have to earn. */
export function SelectField<Value extends string>({
  label,
  value,
  onChange,
  options,
  hint,
  className,
}: SelectFieldProps<Value>) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__select-wrap">
        <select
          id={id}
          className="field__control field__control--select"
          value={value}
          onChange={(event) => onChange(event.target.value as Value)}
          aria-describedby={hintId}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="field__select-caret" aria-hidden>
          <CaretDownIcon size="1rem" weight="bold" />
        </span>
      </div>
      {hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
