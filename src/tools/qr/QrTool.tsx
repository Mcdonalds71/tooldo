import { DownloadSimpleIcon, TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { useRef } from 'react';
import { Button } from '../../design-system/components/Button';
import { ColorField } from '../../design-system/components/ColorField';
import { SelectField } from '../../design-system/components/SelectField';
import { TextAreaField } from '../../design-system/components/TextAreaField';
import { ToastProvider } from '../../design-system/components/Toast';
import { CORNER_STYLES, DOT_STYLES, LOGO_ACCEPT, MAX_CONTENT_LENGTH } from './types';
import { useQrWorkbench } from './useQrWorkbench';

export function QrTool() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  );
}

function Workbench() {
  const { content, style, containerRef, hasContent, isReady, actions } = useQrWorkbench();
  const logoInput = useRef<HTMLInputElement>(null);

  return (
    <div className="qr-tool">
      <div className="qr-tool__form">
        <div className="qr-tool__section">
          <TextAreaField
            label="Content"
            value={content}
            onChange={actions.setContent}
            placeholder="https://example.com"
            hint={`${content.length}/${MAX_CONTENT_LENGTH}`}
            rows={3}
          />
        </div>

        <div className="qr-tool__section">
          <h3 className="qr-tool__section-title">Style</h3>
          <div className="qr-tool__style-grid">
            <ColorField
              label="Foreground"
              value={style.foreground}
              onChange={(foreground) => actions.updateStyle({ foreground })}
            />
            <ColorField
              label="Background"
              value={style.background}
              onChange={(background) => actions.updateStyle({ background })}
            />
            <SelectField
              label="Dot style"
              value={style.dotStyle}
              onChange={(dotStyle) => actions.updateStyle({ dotStyle })}
              options={DOT_STYLES}
            />
            <SelectField
              label="Corner style"
              value={style.cornerStyle}
              onChange={(cornerStyle) => actions.updateStyle({ cornerStyle })}
              options={CORNER_STYLES}
            />
          </div>

          <div className="qr-tool__logo">
            {style.logoDataUrl ? (
              <img className="qr-tool__logo-preview" src={style.logoDataUrl} alt="Your logo" />
            ) : null}
            <input
              ref={logoInput}
              type="file"
              accept={LOGO_ACCEPT.join(',')}
              className="sr-only"
              onChange={(event) => {
                void actions.setLogo(event.target.files?.[0] ?? null);
                event.target.value = '';
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={UploadSimpleIcon}
              onClick={() => logoInput.current?.click()}
            >
              {style.logoDataUrl ? 'Replace logo' : 'Add logo'}
            </Button>
            {style.logoDataUrl ? (
              <Button
                variant="ghost"
                size="sm"
                icon={TrashIcon}
                onClick={() => void actions.setLogo(null)}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={actions.trySample}>
          Try a sample
        </Button>
      </div>

      {/* A hidden label the same height as "Content"'s real one — not decoration,
           it's what lines the preview box up with the content field next to it
           instead of the field's label above it. */}
      <div className="field qr-tool__preview-col">
        <span className="field__label qr-tool__preview-spacer" aria-hidden="true">
          Preview
        </span>
        <div className="qr-tool__preview">
          {hasContent ? (
            <>
              <div className="qr-tool__canvas-wrap">
                <div ref={containerRef} className="qr-tool__canvas" />
              </div>
              <div className="qr-tool__downloads">
                <Button
                  variant="primary"
                  icon={DownloadSimpleIcon}
                  disabled={!isReady}
                  onClick={() => void actions.downloadQr('png')}
                >
                  Download PNG
                </Button>
                <Button
                  variant="secondary"
                  icon={DownloadSimpleIcon}
                  disabled={!isReady}
                  onClick={() => void actions.downloadQr('svg')}
                >
                  Download SVG
                </Button>
              </div>
            </>
          ) : (
            <p className="qr-tool__hint">
              Type a link or message to see your QR code, or try a sample.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
