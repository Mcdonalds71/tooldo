import { Card } from '../../design-system/components/Card';
import { Segmented } from '../../design-system/components/Segmented';
import { Slider } from '../../design-system/components/Slider';
import type { UiOptions } from './optionTypes';
import type { CompressionMode, GifMotion, OutputFormat, QualityTier, ResolutionCap } from './types';

const FORMAT_OPTIONS: ReadonlyArray<{ value: OutputFormat; label: string }> = [
  { value: 'mp4', label: 'Video (MP4)' },
  { value: 'gif', label: 'GIF' },
];

const RESOLUTION_OPTIONS: ReadonlyArray<{ value: ResolutionCap; label: string }> = [
  { value: 'original', label: 'Original' },
  { value: '1080', label: '1080p' },
  { value: '720', label: '720p' },
  { value: '480', label: '480p' },
];

const COMPRESSION_OPTIONS: ReadonlyArray<{ value: CompressionMode; label: string }> = [
  { value: 'quality', label: 'Quality' },
  { value: 'targetSize', label: 'Target size' },
];

const QUALITY_OPTIONS: ReadonlyArray<{ value: QualityTier; label: string }> = [
  { value: 'low', label: 'Smaller file' },
  { value: 'medium', label: 'Balanced' },
  { value: 'high', label: 'Sharper' },
];

const GIF_MOTION_OPTIONS: ReadonlyArray<{ value: GifMotion; label: string }> = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'small', label: 'Smallest' },
];

export interface VideoOptionsProps {
  readonly value: UiOptions;
  readonly onChange: (value: UiOptions) => void;
}

/**
 * The calm register: a hairline card, no hard shadow, under the loud dropzone — the
 * restraint rule's "dense working UI" surface, the same one Image Converter's own panel
 * uses. Resolution caps the longest side either way, so it sits above the format split
 * rather than being duplicated inside both branches.
 */
export function VideoOptions({ value, onChange }: VideoOptionsProps) {
  const set = <Key extends keyof UiOptions>(key: Key, next: UiOptions[Key]) =>
    onChange({ ...value, [key]: next });

  return (
    <Card tone="calm" className="video-options">
      <div className="video-options__field">
        <span className="video-options__label">Convert to</span>
        <Segmented
          label="Output format"
          options={FORMAT_OPTIONS}
          value={value.format}
          onChange={(format) => set('format', format)}
        />
      </div>

      <div className="video-options__field">
        <span className="video-options__label">Longest side</span>
        <Segmented
          label="Resolution"
          options={RESOLUTION_OPTIONS}
          value={value.resolution}
          onChange={(resolution) => set('resolution', resolution)}
        />
      </div>

      {value.format === 'mp4' ? (
        <div className="video-options__field">
          <span className="video-options__label">Compress by</span>
          <Segmented
            label="Compression mode"
            options={COMPRESSION_OPTIONS}
            value={value.compressionMode}
            onChange={(compressionMode) => set('compressionMode', compressionMode)}
          />

          {value.compressionMode === 'quality' ? (
            <Segmented
              label="Quality"
              options={QUALITY_OPTIONS}
              value={value.quality}
              onChange={(quality) => set('quality', quality)}
            />
          ) : (
            <Slider
              label="Target size"
              value={value.targetSizeMb}
              onChange={(targetSizeMb) => set('targetSizeMb', targetSizeMb)}
              min={1}
              max={100}
              formatValue={(mb) => `${mb} MB`}
            />
          )}
        </div>
      ) : (
        <div className="video-options__field">
          <span className="video-options__label">Motion</span>
          <Segmented
            label="GIF frame rate"
            options={GIF_MOTION_OPTIONS}
            value={value.gifMotion}
            onChange={(gifMotion) => set('gifMotion', gifMotion)}
          />
        </div>
      )}
    </Card>
  );
}
