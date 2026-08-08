/** What the dropzone takes, and the ceilings a crafted file has to stay under. */
export const PDF_ACCEPT = ['application/pdf', '.pdf'] as const;
export const MAX_PDF_BYTES = 100_000_000;
export const MAX_PAGES = 500;

/** Quarter turns, clockwise, on top of whatever rotation the page already carries. */
export type Rotation = 0 | 90 | 180 | 270;

export interface SourceSummary {
  readonly name: string;
  readonly bytes: number;
  readonly pages: number;
}

export interface PageInfo {
  /** Index into the files that were inspected. */
  readonly source: number;
  /** Zero-based page index inside that file. */
  readonly page: number;
  /** Points, already turned to match how the page is displayed. */
  readonly width: number;
  readonly height: number;
}

export interface InspectResult {
  readonly sources: readonly SourceSummary[];
  /** Every page of every file, in the order they were dropped. */
  readonly pages: readonly PageInfo[];
}

/** One page of the finished document: where it came from and how far to turn it. */
export interface PagePlan {
  readonly source: number;
  readonly page: number;
  readonly rotation: Rotation;
}

export interface BuildResult {
  /** The plain buffer kind, so the island can hand it straight to a Blob. */
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly pages: number;
}

export type PdfTask =
  | { readonly kind: 'inspect'; readonly files: readonly File[] }
  | { readonly kind: 'build'; readonly files: readonly File[]; readonly plan: readonly PagePlan[] }
  | { readonly kind: 'sample' };

export type PdfTaskResult =
  | { readonly kind: 'inspect'; readonly result: InspectResult }
  | { readonly kind: 'build'; readonly result: BuildResult }
  | { readonly kind: 'sample'; readonly bytes: Uint8Array<ArrayBuffer> };
