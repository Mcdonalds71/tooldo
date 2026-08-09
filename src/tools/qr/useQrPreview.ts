import type QRCodeStyling from 'qr-code-styling';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import { download } from '../../lib/download';
import { buildQrConfig, qrFilename, validateContentLength } from './engine';
import { describeQrError, QrError } from './errors';
import type { DownloadFormat, QrStyle } from './types';

/**
 * No Worker, and no way to get one: `qr-code-styling` draws into a real `<canvas>` or
 * `SVGElement` it creates itself, which means it needs `document` — a dedicated Worker
 * has no DOM at all, and this library isn't written against `OffscreenCanvas`. So the
 * render step runs on the main thread the same way a chart or a `<canvas>` game would,
 * which is fine: even the largest QR codes this tool allows draw in a few milliseconds,
 * nowhere near enough to be felt as jank. See the ADR for the full reasoning — this is
 * a different justification for "no Worker" than Timezone Finder's ADR 0011, not the
 * same one repeated.
 *
 * The library is dynamically imported inside the effect, never at module scope, so a
 * visitor who never types anything never pays for it — and everything here runs inside
 * `useEffect`, never during the render body itself, because this is a `client:load`
 * island: the initial render is also what the static build's server pass produces, and
 * that pass has no `document` at all.
 */
export function useQrPreview(content: string, style: QrStyle) {
  const { notify } = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const [isReady, setIsReady] = useState(false);

  const trimmed = content.trim();

  useEffect(() => {
    if (trimmed.length === 0) {
      qrRef.current = null;
      setIsReady(false);
      containerRef.current?.replaceChildren();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        validateContentLength(trimmed);
        const config = buildQrConfig(trimmed, style);
        const { default: QRCodeStylingCtor } = await import('qr-code-styling');
        if (cancelled) return;

        if (qrRef.current) {
          qrRef.current.update(config);
        } else {
          qrRef.current = new QRCodeStylingCtor(config);
          if (containerRef.current) qrRef.current.append(containerRef.current);
        }
        setIsReady(true);
      } catch (error) {
        setIsReady(false);
        notify({ title: describeQrError(error instanceof Error ? error.name : ''), tone: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trimmed, style, notify]);

  const downloadQr = useCallback(
    async (format: DownloadFormat) => {
      if (!qrRef.current) return;

      try {
        const data = await qrRef.current.getRawData(format);
        if (!(data instanceof Blob)) {
          throw new QrError('RenderFailedError', 'QR renderer returned no browser Blob');
        }
        download(data, qrFilename(trimmed, format));
      } catch (error) {
        notify({ title: describeQrError(error instanceof Error ? error.name : ''), tone: 'error' });
      }
    },
    [trimmed, notify],
  );

  return { containerRef, hasContent: trimmed.length > 0, isReady, downloadQr };
}
