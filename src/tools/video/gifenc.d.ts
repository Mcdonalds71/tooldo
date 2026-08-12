/** `gifenc` ships no types of its own and isn't on DefinitelyTyped — this covers only
 *  the surface `engine.ts` actually calls. See node_modules/gifenc/README.md for the
 *  full API. */
declare module 'gifenc' {
  export type RgbColor = readonly [number, number, number];
  export type RgbaColor = readonly [number, number, number, number];

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
  ): (RgbColor | RgbaColor)[];

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: readonly (RgbColor | RgbaColor)[],
  ): Uint8Array;

  export interface GifWriteFrameOptions {
    readonly palette?: readonly (RgbColor | RgbaColor)[];
    readonly delay?: number;
    readonly repeat?: number;
    readonly transparent?: boolean;
    readonly transparentIndex?: number;
    readonly dispose?: number;
    readonly first?: boolean;
  }

  export interface GifEncoder {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: GifWriteFrameOptions,
    ): void;
    finish(): void;
    bytes(): Uint8Array<ArrayBuffer>;
  }

  export function GIFEncoder(options?: { auto?: boolean; initialCapacity?: number }): GifEncoder;
}
