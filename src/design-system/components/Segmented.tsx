import * as RadioGroup from '@radix-ui/react-radio-group';

export interface SegmentedOption<Value extends string> {
  readonly value: Value;
  readonly label: string;
}

export interface SegmentedProps<Value extends string> {
  /** The group's accessible name — there's no visible label of its own. */
  readonly label: string;
  readonly options: readonly SegmentedOption<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  readonly disabled?: boolean | undefined;
}

/**
 * A pill-shaped exclusive choice — the calm register's answer to radio buttons, built on
 * Radix's actual RadioGroup rather than a toggle group standing in for one. That choice
 * is deliberate: a toggle group can expose `role="radio"` without it, but only RadioGroup
 * moves the *selection* with the arrow keys, not just focus — confirmed against a real
 * keyboard, not assumed, after the toggle-group version shipped that gap.
 */
export function Segmented<Value extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedProps<Value>) {
  return (
    <RadioGroup.Root
      className="segmented"
      aria-label={label}
      value={value}
      onValueChange={(next) => onChange(next as Value)}
      disabled={disabled}
    >
      {options.map((option) => (
        <RadioGroup.Item key={option.value} className="segmented__item" value={option.value}>
          {option.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
