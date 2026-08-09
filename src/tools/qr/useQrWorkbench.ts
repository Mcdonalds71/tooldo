import { useCallback, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import { describeQrError } from './errors';
import { SAMPLE_CONTENT, SAMPLE_STYLE } from './sample';
import {
  DEFAULT_STYLE,
  LOGO_ACCEPT,
  type LogoMimeType,
  MAX_LOGO_BYTES,
  type QrStyle,
} from './types';
import { useQrPreview } from './useQrPreview';

export function useQrWorkbench() {
  const { notify } = useToast();
  const [content, setContent] = useState('');
  const [style, setStyle] = useState<QrStyle>(DEFAULT_STYLE);

  const preview = useQrPreview(content, style);

  const updateStyle = useCallback((patch: Partial<QrStyle>) => {
    setStyle((current) => ({ ...current, ...patch }));
  }, []);

  const setLogo = useCallback(
    async (file: File | null) => {
      if (!file) {
        updateStyle({ logoDataUrl: null });
        return;
      }

      if (!LOGO_ACCEPT.includes(file.type as LogoMimeType)) {
        notify({ title: describeQrError('InvalidLogoError'), tone: 'error' });
        return;
      }
      if (file.size > MAX_LOGO_BYTES) {
        notify({ title: 'That logo is too large — try one under 2 MB', tone: 'error' });
        return;
      }

      try {
        updateStyle({ logoDataUrl: await readAsDataUrl(file) });
      } catch {
        notify({ title: describeQrError('InvalidLogoError'), tone: 'error' });
      }
    },
    [notify, updateStyle],
  );

  const trySample = useCallback(() => {
    setContent(SAMPLE_CONTENT);
    setStyle(SAMPLE_STYLE);
  }, []);

  const actions = { setContent, updateStyle, setLogo, trySample, downloadQr: preview.downloadQr };

  return {
    content,
    style,
    containerRef: preview.containerRef,
    hasContent: preview.hasContent,
    isReady: preview.isReady,
    actions,
  };
}

export type QrActions = ReturnType<typeof useQrWorkbench>['actions'];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
