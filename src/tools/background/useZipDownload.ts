import { useCallback, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import { download } from '../../lib/download';
import type { ZipEntry } from './types';
import { zipRemoved } from './utilityClient';

const ZIP_FILENAME = 'tooldo-cutouts.zip';

type State =
  | { readonly status: 'idle' }
  | { readonly status: 'working' }
  | { readonly status: 'ready'; readonly blob: Blob };

/**
 * A browser only honours a programmatic download click while the user's own gesture is
 * still "fresh" — once you `await` a worker round trip first, that window can close
 * before `download()` ever runs, and the click silently does nothing. So this is two
 * clicks, not one: the first prepares the zip, the second is a genuine, fresh click that
 * fires the save. Same fix as the Image Converter's, confirmed against a real browser
 * there rather than assumed here.
 *
 * Every cutout is still downloadable one at a time from its own row, so a failed zip is
 * a lost convenience, not a lost file.
 */
export function useZipDownload() {
  const { notify } = useToast();
  const [state, setState] = useState<State>({ status: 'idle' });

  const prepare = useCallback(
    async (entries: readonly ZipEntry[]) => {
      setState({ status: 'working' });

      try {
        const bytes = await zipRemoved(entries, new AbortController().signal);
        setState({ status: 'ready', blob: new Blob([bytes], { type: 'application/zip' }) });
      } catch {
        notify({
          title: "Couldn't build the zip — try downloading cutouts one at a time",
          tone: 'error',
        });
        setState({ status: 'idle' });
      }
    },
    [notify],
  );

  const save = useCallback(() => {
    if (state.status !== 'ready') return;

    download(state.blob, ZIP_FILENAME);
    setState({ status: 'idle' });
  }, [state]);

  return { state, prepare, save };
}
