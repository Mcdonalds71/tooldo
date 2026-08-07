import { UserIcon } from '@phosphor-icons/react/dist/ssr';

/**
 * The same "drawn, not operated" glass every tool's illustration shares, but the back
 * layer is the one shape everyone already reads as "no background": the transparency
 * checkerboard, warmed to the palette instead of the usual stark grey and white. The
 * subject in front is what the checkerboard is showing through.
 */
export function BackgroundArt() {
  return (
    <span className="background-art">
      <span className="background-art__checker" />
      <span className="background-art__front">
        <UserIcon size="42%" weight="duotone" />
      </span>
    </span>
  );
}
