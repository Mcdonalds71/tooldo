/**
 * The folder that takes the file — the illustration every tool's dropzone opens with.
 *
 * An ink back panel, three ruled sheets fanned above it, and a warm glass front. The
 * front carries the blur, so the sheets go soft exactly where it covers them and stay
 * crisp above the lip. That only works because the layers are siblings: an element with
 * `backdrop-filter` is its own backdrop root and can't blur a parent's children.
 *
 * Idle it breathes; on drag-over the sheets rise and fan out to meet what's coming. Both
 * are CSS, so the global reduced-motion reset settles them without a second code path.
 *
 * It is deliberately the same drawing in all three tools rather than a per-tool variant.
 * Which tool you are in is already said by the heading, the header glyph and the copy —
 * saying it a fourth time in the artwork bought nothing and cost the suite the one image
 * people would otherwise recognise from tool to tool.
 */
export function DropArt() {
  return (
    <span className="drop-art">
      <span className="drop-art__tab" />
      <span className="drop-art__back" />
      <span className="drop-art__sheet" data-slot="left" />
      <span className="drop-art__sheet" data-slot="mid" />
      <span className="drop-art__sheet" data-slot="right" />
      <span className="drop-art__front" />
    </span>
  );
}
