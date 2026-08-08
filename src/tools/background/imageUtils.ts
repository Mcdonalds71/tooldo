/** The download is always a PNG — the whole point is the alpha channel a JPEG can't hold. */
export function outputName(name: string): string {
  const stem = name.replace(/\.[^./]+$/, '');

  return `${stem}.png`;
}
