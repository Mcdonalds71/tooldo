/**
 * The folder that takes the file. An ink back panel, three ruled sheets fanned above it,
 * and a warm glass front — the front carries the blur, so the sheets go soft exactly
 * where it covers them and stay crisp above the lip. That is the whole trick from the
 * reference, and it only works because the layers are siblings: an element with
 * `backdrop-filter` is its own backdrop root and can't blur a parent's children.
 *
 * Idle it breathes; on drag-over the sheets rise and fan out to meet what's coming. Both
 * are CSS, so the global reduced-motion reset settles them without a second code path.
 */
export function PdfArt() {
  return (
    <span className="pdf-art">
      <span className="pdf-art__tab" />
      <span className="pdf-art__back" />
      <span className="pdf-art__sheet" data-slot="left" />
      <span className="pdf-art__sheet" data-slot="mid" />
      <span className="pdf-art__sheet" data-slot="right" />
      <span className="pdf-art__front" />
    </span>
  );
}
