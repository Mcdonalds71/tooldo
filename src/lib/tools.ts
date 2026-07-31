import {
  EraserIcon,
  FilePdfIcon,
  FilmStripIcon,
  FrameCornersIcon,
  GlobeHemisphereWestIcon,
  ImagesIcon,
  QrCodeIcon,
  ReceiptIcon,
  TableIcon,
  TextAaIcon,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react/lib';

/**
 * The registry is the only place a tool is declared. Nav, the landing grid, the
 * sitemap and the routes all read from here, so adding a tool means editing this
 * file and nothing else.
 *
 * Icons come from Phosphor's SSR entry: it renders to static HTML in .astro pages
 * and still works inside a hydrated island, so there is one import path to remember.
 */

export const TOOL_CATEGORIES = [
  'Documents',
  'Images & photo',
  'Media & utilities',
  'Data & text',
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

/**
 * A tool is only linkable once its page exists. Nav and the landing grid read this
 * rather than guessing, so the suite never ships a link to a route that isn't built.
 */
export type ToolStatus = 'live' | 'planned';

export interface Tool {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly category: ToolCategory;
  readonly icon: Icon;
  readonly status: ToolStatus;
}

export const tools = [
  {
    slug: 'pdf',
    name: 'PDF Toolbox',
    description: 'Merge, split, compress, and reorder pages.',
    category: 'Documents',
    icon: FilePdfIcon,
    status: 'planned',
  },
  {
    slug: 'images',
    name: 'Image Converter',
    description: 'Convert and shrink images in bulk.',
    category: 'Images & photo',
    icon: ImagesIcon,
    status: 'planned',
  },
  {
    slug: 'background',
    name: 'Background Remover',
    description: 'Erase any background in one drop.',
    category: 'Images & photo',
    icon: EraserIcon,
    status: 'planned',
  },
  {
    slug: 'video',
    name: 'Video Compressor',
    description: 'Shrink video for chat, email, or GIF.',
    category: 'Media & utilities',
    icon: FilmStripIcon,
    status: 'planned',
  },
  {
    slug: 'invoice',
    name: 'Invoice Generator',
    description: 'Fill a form, get a clean PDF.',
    category: 'Documents',
    icon: ReceiptIcon,
    status: 'planned',
  },
  {
    slug: 'screenshot',
    name: 'Screenshot Beautifier',
    description: 'Turn plain screenshots into share-ready shots.',
    category: 'Images & photo',
    icon: FrameCornersIcon,
    status: 'planned',
  },
  {
    slug: 'csv',
    name: 'CSV / JSON Viewer',
    description: 'Open, read, and convert data cleanly.',
    category: 'Data & text',
    icon: TableIcon,
    status: 'planned',
  },
  {
    slug: 'timezones',
    name: 'Timezone Finder',
    description: 'Find the overlap across cities.',
    category: 'Media & utilities',
    icon: GlobeHemisphereWestIcon,
    status: 'planned',
  },
  {
    slug: 'qr',
    name: 'QR Code Studio',
    description: 'Design QR codes with your brand.',
    category: 'Media & utilities',
    icon: QrCodeIcon,
    status: 'planned',
  },
  {
    slug: 'text',
    name: 'Text Toolbox',
    description: 'Count, clean, convert, and compare text.',
    category: 'Data & text',
    icon: TextAaIcon,
    status: 'planned',
  },
] as const satisfies readonly Tool[];

export type ToolSlug = (typeof tools)[number]['slug'];

export interface ToolGroup {
  readonly category: ToolCategory;
  readonly tools: readonly Tool[];
}

/** The three the nav promotes. Order is the order they appear. */
export const POPULAR_SLUGS = ['pdf', 'images', 'background'] as const;

export function findTool(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function popularTools(): readonly Tool[] {
  return POPULAR_SLUGS.map((slug) => {
    const tool = findTool(slug);
    if (!tool) throw new Error(`POPULAR_SLUGS names ${slug}, which is not in the registry`);
    return tool;
  });
}

/**
 * A tool that has no page yet still deserves somewhere to go, so it points at its own
 * card in the landing grid rather than a route that would 404.
 */
export function toolHref(tool: Tool): string {
  return tool.status === 'live' ? `/${tool.slug}` : `/#tool-${tool.slug}`;
}

export function groupToolsByCategory(): readonly ToolGroup[] {
  return TOOL_CATEGORIES.map((category) => ({
    category,
    tools: tools.filter((tool) => tool.category === category),
  }));
}
