import { Card } from '../../design-system/components/Card';
import { Segmented } from '../../design-system/components/Segmented';
import { Slider } from '../../design-system/components/Slider';
import { Switch } from '../../design-system/components/Switch';
import { DEFAULT_QUALITY_BY_FORMAT } from './options';
import type { CompressionMode, UiOptions } from './optionTypes';
import type { OutputFormat } from './types';

const FORMAT_OPTIONS: ReadonlyArray<{ value: OutputFormat; label: string }> = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
];

const COMPRESSION_OPTIONS: ReadonlyArray<{ value: CompressionMode; label: string }> = [
  { value: 'quality', label: 'Quality' },
  { value: 'targetSize', label: 'Target size' },
];

export interface ImageOptionsProps {
  readonly value: UiOptions;
  readonly onChange: (value: UiOptions) => void;
}

/**
 * The calm register: a hairline card, no hard shadow, sitting under the loud dropzone —
 * the restraint rule's "dense working UI" surface. PNG hides compression outright rather
 * than showing a slider that would do nothing, since it's lossless.
 */
export function ImageOptions({ value, onChange }: ImageOptionsProps) {
  const set = <Key extends keyof UiOptions>(key: Key, next: UiOptions[Key]) =>
    onChange({ ...value, [key]: next });

  return (
    <Card tone="calm" className="image-options">
      <div className="image-options__field">
        <span className="image-options__label">Convert to</span>
        <Segmented
          label="Output format"
          options={FORMAT_OPTIONS}
          value={value.format}
          onChange={(format) =>
            onChange({ ...value, format, quality: DEFAULT_QUALITY_BY_FORMAT[format] })
          }
        />
      </div>

      <div className="image-options__field">
        <Switch
          label="Resize"
          checked={value.resize}
          onChange={(resize) => set('resize', resize)}
        />
        {value.resize ? (
          <Slider
            label="Longest side"
            value={value.maxDimension}
            onChange={(maxDimension) => set('maxDimension', maxDimension)}
            min={200}
            max={4000}
            step={20}
            formatValue={(dimension) => `${dimension}px`}
          />
        ) : null}
      </div>

      {value.format === 'png' ? null : (
        <div className="image-options__field">
          <span className="image-options__label">Compress by</span>
          <Segmented
            label="Compression mode"
            options={COMPRESSION_OPTIONS}
            value={value.compressionMode}
            onChange={(compressionMode) => set('compressionMode', compressionMode)}
          />

          {value.compressionMode === 'quality' ? (
            <Slider
              label="Quality"
              value={value.quality}
              onChange={(quality) => set('quality', quality)}
              min={1}
              max={100}
              formatValue={(quality) => `${quality}%`}
            />
          ) : (
            <Slider
              label="Target size"
              value={value.targetSizeKb}
              onChange={(targetSizeKb) => set('targetSizeKb', targetSizeKb)}
              min={10}
              max={2000}
              step={10}
              formatValue={(kb) => `${kb} KB`}
            />
          )}
        </div>
      )}
    </Card>
  );
}
