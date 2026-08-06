import { ImageIcon } from '@phosphor-icons/react/dist/ssr';

/**
 * A photo mid-swap: the old frame behind, the new one arriving glassy and warm in front —
 * the same "drawn, not operated" glass the folder in the PDF tool uses, so illustrations
 * agree with each other across tools even though the controls around them don't need to.
 */
export function ImageArt() {
  return (
    <span className="image-art">
      <span className="image-art__back" />
      <span className="image-art__front">
        <ImageIcon size="42%" weight="duotone" />
      </span>
    </span>
  );
}
