import { useEffect, useState } from 'react';

export interface PageThumbnails {
  readonly urls: ReadonlyMap<string, string>;
  /** True once the renderer itself failed — the board keeps working without pictures. */
  readonly unavailable: boolean;
}

const NONE: ReadonlyMap<string, string> = new Map();

/**
 * Renders a preview for every page of every file and hands them over as they arrive.
 * Each object URL is revoked when the files change or the tool unmounts, so a long
 * session doesn't quietly hold a few hundred bitmaps.
 */
export function usePageThumbnails(files: readonly File[]): PageThumbnails {
  const [urls, setUrls] = useState<ReadonlyMap<string, string>>(NONE);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    setUrls(NONE);
    setUnavailable(false);

    if (files.length === 0) return;

    const controller = new AbortController();
    const created: string[] = [];

    void (async () => {
      try {
        const { renderThumbnails } = await import('./thumbnails');

        for await (const thumbnail of renderThumbnails(files, controller.signal)) {
          created.push(thumbnail.url);
          if (controller.signal.aborted) return;

          setUrls((current) => new Map(current).set(thumbnail.key, thumbnail.url));
        }
      } catch {
        // The renderer is a separate chunk, so this is a download that never landed.
        if (!controller.signal.aborted) setUnavailable(true);
      }
    })();

    return () => {
      controller.abort();
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [files]);

  return { urls, unavailable };
}
