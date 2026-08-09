import { SelectField, type SelectOption } from '../../design-system/components/SelectField';
import { Slider } from '../../design-system/components/Slider';
import { Switch } from '../../design-system/components/Switch';
import {
  BACKGROUND_PRESET_LIST,
  type BackgroundPresetId,
  type BeautifyOptions,
  MAX_CORNER_RADIUS,
  MAX_PADDING_PERCENT,
  MIN_CORNER_RADIUS,
  MIN_PADDING_PERCENT,
} from './types';

const BACKGROUND_OPTIONS: readonly SelectOption<BackgroundPresetId>[] = BACKGROUND_PRESET_LIST.map(
  (preset) => ({ value: preset.id, label: preset.label }),
);

export interface ScreenshotOptionsProps {
  readonly value: BeautifyOptions;
  readonly onChange: (patch: Partial<BeautifyOptions>) => void;
}

export function ScreenshotOptions({ value, onChange }: ScreenshotOptionsProps) {
  return (
    <div className="screenshot-options">
      <SelectField
        label="Background"
        value={value.background}
        onChange={(background) => onChange({ background })}
        options={BACKGROUND_OPTIONS}
      />

      <Slider
        label="Padding"
        value={value.paddingPercent}
        onChange={(paddingPercent) => onChange({ paddingPercent })}
        min={MIN_PADDING_PERCENT}
        max={MAX_PADDING_PERCENT}
        formatValue={(percent) => `${percent}%`}
      />

      <Slider
        label="Corner radius"
        value={value.cornerRadius}
        onChange={(cornerRadius) => onChange({ cornerRadius })}
        min={MIN_CORNER_RADIUS}
        max={MAX_CORNER_RADIUS}
        formatValue={(radius) => `${radius}px`}
      />

      <Switch
        label="Drop shadow"
        checked={value.shadow}
        onChange={(shadow) => onChange({ shadow })}
      />

      <Switch
        label="Browser frame"
        checked={value.browserFrame}
        onChange={(browserFrame) => onChange({ browserFrame })}
      />
    </div>
  );
}
