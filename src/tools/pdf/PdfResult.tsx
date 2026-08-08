import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { motion } from 'motion/react';
import { Button } from '../../design-system/components/Button';
import { ResultPanel } from '../../design-system/components/ResultPanel';
import { instant, scaleIn, useReducedMotion } from '../../design-system/motion';
import { download } from '../../lib/download';
import { formatBytes } from '../../lib/formatBytes';

export interface PdfResultProps {
  readonly blob: Blob;
  readonly filename: string;
  readonly pages: number;
  /** The first page of the new document, borrowed from the board that built it. */
  readonly preview?: string | undefined;
  readonly onKeepEditing: () => void;
  readonly onReset: () => void;
}

export function PdfResult({
  blob,
  filename,
  pages,
  preview,
  onKeepEditing,
  onReset,
}: PdfResultProps) {
  const reduced = useReducedMotion();

  return (
    <ResultPanel
      headline="Your PDF is ready"
      stat={{ value: `${pages} ${pages === 1 ? 'page' : 'pages'}`, label: formatBytes(blob.size) }}
      {...(preview
        ? {
            preview: (
              <motion.img
                className="pdf-result__page"
                src={preview}
                alt="The first page of the PDF you just built"
                variants={reduced ? instant : scaleIn}
                initial="hidden"
                animate="visible"
              />
            ),
          }
        : {})}
      actions={
        <>
          <Button
            variant="primary"
            icon={DownloadSimpleIcon}
            onClick={() => download(blob, filename)}
          >
            Download PDF
          </Button>
          <Button variant="secondary" onClick={onKeepEditing}>
            Keep editing
          </Button>
          <Button variant="ghost" onClick={onReset}>
            Start over
          </Button>
        </>
      }
    />
  );
}
