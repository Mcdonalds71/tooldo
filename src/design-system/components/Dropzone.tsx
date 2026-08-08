import { UploadSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { describeRejection, partitionFiles } from '../../lib/files';
import { buttonClass } from './Button';
import { EmptyState } from './EmptyState';

/** `lg` is the tool's opening moment; `sm` is the strip that takes the next file. */
export type DropzoneSize = 'lg' | 'sm';

export interface DropzoneProps {
  readonly headline: string;
  readonly hint: string;
  readonly onFiles: (files: readonly File[]) => void;
  /** Receives finished sentences, so every tool rejects a file in the same words. */
  readonly onReject?: ((messages: readonly string[]) => void) | undefined;
  readonly accept?: readonly string[] | undefined;
  readonly maxBytes?: number | undefined;
  readonly maxFiles?: number | undefined;
  readonly multiple?: boolean | undefined;
  readonly sample?: { readonly label: string; readonly onTry: () => void } | undefined;
  readonly illustration?: ReactNode | undefined;
  readonly disabled?: boolean | undefined;
  readonly size?: DropzoneSize | undefined;
}

export function Dropzone({
  headline,
  hint,
  onFiles,
  onReject,
  accept,
  maxBytes,
  maxFiles,
  multiple = true,
  sample,
  illustration,
  disabled = false,
  size = 'lg',
}: DropzoneProps) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  // dragenter/dragleave also fire for children, so depth tracks the real boundary.
  const depth = useRef(0);

  const rule = useMemo(() => ({ accept, maxBytes, maxFiles }), [accept, maxBytes, maxFiles]);

  const take = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;

      const { accepted, rejected } = partitionFiles([...list], rule);

      if (accepted.length > 0) onFiles(accepted);
      if (rejected.length > 0) {
        onReject?.(rejected.map((rejection) => describeRejection(rejection, rule)));
      }
    },
    [onFiles, onReject, rule],
  );

  useEffect(() => {
    if (disabled) return;

    const onPaste = (event: ClipboardEvent) => take(event.clipboardData?.files ?? null);

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [disabled, take]);

  const endDrag = () => {
    depth.current = 0;
    setDragging(false);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the file input covering it owns the keyboard path.
    <div
      className="dropzone"
      data-size={size}
      data-dragging={dragging || undefined}
      onDragEnter={(event) => {
        event.preventDefault();
        depth.current += 1;
        if (!disabled) setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) endDrag();
      }}
      onDrop={(event) => {
        // Stops the input underneath from taking the drop a second time.
        event.preventDefault();
        endDrag();
        if (!disabled) take(event.dataTransfer.files);
      }}
    >
      <input
        id={inputId}
        className="dropzone__input"
        type="file"
        multiple={multiple}
        disabled={disabled}
        aria-label={headline}
        {...(accept ? { accept: accept.join(',') } : {})}
        onChange={(event) => {
          take(event.target.files);
          // Lets the same file be picked twice in a row.
          event.target.value = '';
        }}
      />

      <span className="dropzone__halo" aria-hidden />

      {size === 'lg'
        ? accept?.slice(0, 2).map((pattern, index) => (
            <span key={pattern} className="dropzone__tag" data-slot={index} aria-hidden>
              {pattern}
            </span>
          ))
        : null}

      <EmptyState
        illustration={
          illustration ?? (
            <span className="dropzone__glyph">
              {/* Duotone paints a filled shape behind the strokes, which at the compact
                  size reads as a grey box rather than an accent. Regular is the right
                  register down there anyway: expressive is for the opening moment. */}
              <UploadSimpleIcon
                size="45%"
                weight={size === 'lg' ? 'duotone' : 'regular'}
                aria-hidden
              />
            </span>
          )
        }
        headline={headline}
        subtext={hint}
        primaryAction={
          // The compact zone never carries the vermilion: a view that already holds work
          // has its own primary action, and two of them is one too many.
          <label
            className={buttonClass({ variant: size === 'lg' ? 'primary' : 'secondary' })}
            htmlFor={inputId}
          >
            Choose files
          </label>
        }
        sampleAction={sample}
      />
    </div>
  );
}
