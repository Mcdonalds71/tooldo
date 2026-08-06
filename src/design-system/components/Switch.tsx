import * as RadixSwitch from '@radix-ui/react-switch';
import { useId } from 'react';

export interface SwitchProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean | undefined;
}

/** A labelled on/off toggle. The label sits to the switch's own left and shares its
 *  click target, so there's one control to aim for, not two. */
export function Switch({ label, checked, onChange, disabled = false }: SwitchProps) {
  const id = useId();

  return (
    <div className="switch-field">
      <label className="switch-field__label" htmlFor={id}>
        {label}
      </label>
      <RadixSwitch.Root
        id={id}
        className="switch"
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      >
        <RadixSwitch.Thumb className="switch__thumb" />
      </RadixSwitch.Root>
    </div>
  );
}
