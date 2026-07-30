// Control characters, path separators, and the characters Windows or macOS reject.
const UNSAFE_CHARACTERS = /[\p{Cc}"*/:<>?\\|]/gu;
const RESERVED_DEVICE_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const MAX_FILENAME_LENGTH = 200;

/**
 * Filenames reach us from user files and tool options, so they are untrusted input:
 * path separators, control characters and Windows device names all get neutralised
 * before the string is handed to a download attribute.
 */
export function sanitizeFilename(name: string, fallback = 'download'): string {
  const flattened = name
    .normalize('NFC')
    .replace(UNSAFE_CHARACTERS, '-')
    .replace(/\.{2,}/g, '.');
  const trimmed = flattened.replace(/^[.\s]+/, '').replace(/[.\s]+$/, '');

  if (trimmed.length === 0) return fallback;

  const dot = trimmed.lastIndexOf('.');
  const stem = dot > 0 ? trimmed.slice(0, dot) : trimmed;
  const guarded = RESERVED_DEVICE_NAMES.test(stem) ? `${fallback}-${trimmed}` : trimmed;

  return truncate(guarded, MAX_FILENAME_LENGTH);
}

export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = sanitizeFilename(filename);
  link.rel = 'noopener';
  link.hidden = true;

  document.body.append(link);
  link.click();
  link.remove();

  // Safari cancels the transfer if the object URL is revoked in the same tick.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function truncate(name: string, limit: number): string {
  if (name.length <= limit) return name;

  const dot = name.lastIndexOf('.');
  const extension = dot > 0 ? name.slice(dot) : '';

  return `${name.slice(0, Math.max(1, limit - extension.length))}${extension}`;
}
