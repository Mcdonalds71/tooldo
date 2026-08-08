import * as RadixSlider from '@radix-ui/react-slider';
import { useId } from 'react';

export interface SliderProps {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | undefined;
  /** How the current value reads next to the label — "80%", "1920px". Defaults to the bare number. */
  readonly formatValue?: ((value: number) => string) | undefined;
  readonly disabled?: boolean | undefined;
}

/**
 * Label, live value, and the control itself — always together, since a slider with no
 * visible value is a slider nobody trusts. Built on Radix so the drag, the keyboard
 * steps, and the announced value all come free.
 */
export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  formatValue,
  disabled = false,
}: SliderProps) {
  const id = useId();

  return (
    <div className="slider-field">
      <div className="slider-field__head">
        <label className="slider-field__label" htmlFor={id}>
          {label}
        </label>
        <span className="slider-field__value">{formatValue ? formatValue(value) : value}</span>
      </div>

      <RadixSlider.Root
        id={id}
        className="slider"
        value={[value]}
        onValueChange={([next]) => {
          if (next !== undefined) onChange(next);
        }}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      >
        <RadixSlider.Track className="slider__track">
          <RadixSlider.Range className="slider__range" />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="slider__thumb" aria-label={label} />
      </RadixSlider.Root>
    </div>
  );
}
