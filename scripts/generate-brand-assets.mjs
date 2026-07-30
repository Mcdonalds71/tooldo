import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

/**
 * Regenerates every raster that derives from the two source SVGs, so the icon set and
 * the share card can never drift from the logo. Run with `pnpm brand` after editing
 * public/favicon.svg or public/icon.svg.
 *
 * The share card renders in a real browser rather than through sharp: sharp draws text
 * with system fonts only, so a Clash Display wordmark would quietly fall back to
 * whatever Windows offered and ship off-brand. Chrome loads the project's own woff2.
 */

const PUBLIC = 'public';
const PAPER = '#f4f0e7';

const RASTERS = [
  { file: 'favicon-32.png', size: 32, background: 'transparent' },
  { file: 'apple-touch-icon.png', size: 180, background: PAPER, padding: 0.1 },
  { file: 'icon-192.png', size: 192, background: PAPER, padding: 0.1 },
  { file: 'icon-512.png', size: 512, background: PAPER, padding: 0.1 },
];

async function renderIcons(source) {
  for (const { file, size, background, padding = 0 } of RASTERS) {
    const inner = Math.round(size * (1 - padding * 2));
    const mark = await sharp(source, { density: 384 })
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: background === 'transparent' ? { r: 0, g: 0, b: 0, alpha: 0 } : background,
      },
    })
      .composite([{ input: mark, gravity: 'centre' }])
      .png()
      .toFile(join(PUBLIC, file));

    console.log(`  ${file} — ${size}x${size}`);
  }
}

/**
 * An .ico is a 22-byte header wrapped around image data, and every browser that still
 * asks for one accepts PNG inside. Writing it by hand beats a dependency for 22 bytes.
 */
async function renderIco(source) {
  const png = await sharp(source, { density: 384 }).resize(32, 32).png().toBuffer();

  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(32, 6); // width
  header.writeUInt8(32, 7); // height
  header.writeUInt8(0, 8); // palette size: not paletted
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18); // offset to the image data

  await writeFile(join(PUBLIC, 'favicon.ico'), Buffer.concat([header, png]));
  console.log('  favicon.ico — 32x32');
}

/** Inlined as data URIs because Chrome refuses cross-origin font loads over file://. */
async function embeddedFont(family, file, weight) {
  try {
    const data = await readFile(join(PUBLIC, 'fonts', file));
    return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${data.toString('base64')}) format('woff2');}`;
  } catch {
    return '';
  }
}

async function renderShareCard(markSvg) {
  const clash = await embeddedFont('Clash Display', 'clash-display-variable.woff2', '400 700');
  const inter = await embeddedFont('Inter', 'inter-latin-variable.woff2', '100 900');

  if (!clash) {
    console.warn('  ! Clash Display is missing — the wordmark will fall back.');
    console.warn('    See public/fonts/README.md, then run this again.');
  }

  const html = `<!doctype html><meta charset="utf-8"><style>
    ${clash}${inter}
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1200px;height:630px;display:flex;align-items:center;justify-content:center;
      gap:44px;background:${PAPER};font-family:'Clash Display','Inter',system-ui,sans-serif}
    svg{width:210px;height:210px;display:block}
    span{font-weight:700;font-size:150px;letter-spacing:-.03em;line-height:1;color:#16130d}
  </style><body>${markSvg}<span>tooldo</span></body>`;

  const page = join(PUBLIC, '__og.html');
  await writeFile(page, html);

  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await tab.goto(`file://${join(process.cwd(), page).replaceAll('\\', '/')}`);
    await tab.evaluate(() => document.fonts.ready);
    await mkdir(join(PUBLIC, 'og'), { recursive: true });
    await tab.screenshot({ path: join(PUBLIC, 'og', 'og.png') });
  } finally {
    await browser.close();
    await rm(page, { force: true });
  }

  console.log('  og/og.png — 1200x630');
}

const favicon = join(PUBLIC, 'favicon.svg');
const markSvg = await readFile(join(PUBLIC, 'icon.svg'), 'utf8');

console.log('icons');
await renderIcons(favicon);
await renderIco(favicon);
console.log('share card');
await renderShareCard(markSvg);
