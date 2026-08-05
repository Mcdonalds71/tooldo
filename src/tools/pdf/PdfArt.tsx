import { FilePdfIcon } from '@phosphor-icons/react/dist/ssr';

/**
 * Two sheets of warm glass drifting behind an ink-bordered mark. Glass is allowed here
 * because none of it is a control — it is drawn, not operated. The drift is CSS, so the
 * global reduced-motion reset settles it on its resting frame without a second path.
 */
export function PdfArt() {
  return (
    <span className="pdf-art">
      <span className="pdf-art__sheet" data-slot="back" />
      <span className="pdf-art__sheet" data-slot="front" />
      <span className="pdf-art__mark">
        <FilePdfIcon size="46%" weight="duotone" />
      </span>
    </span>
  );
}
