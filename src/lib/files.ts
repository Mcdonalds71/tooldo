import { formatBytes } from './formatBytes';

/**
 * Dropped files are untrusted input, and deciding what to do with them is logic, not
 * UI — so it lives here where it can be tested, and the Dropzone stays a thin shell.
 */

export type RejectionReason = 'type' | 'size' | 'count';

export interface FileRule {
  /** MIME types, wildcards (`image/*`), or extensions (`.pdf`). Empty accepts anything. */
  readonly accept?: readonly string[] | undefined;
  readonly maxBytes?: number | undefined;
  readonly maxFiles?: number | undefined;
}

export interface RejectedFile {
  readonly file: File;
  readonly reason: RejectionReason;
}

export interface FilePartition {
  readonly accepted: readonly File[];
  readonly rejected: readonly RejectedFile[];
}

export function matchesAccept(file: File, accept: readonly string[]): boolean {
  if (accept.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return accept.some((pattern) => {
    const candidate = pattern.trim().toLowerCase();

    if (candidate.startsWith('.')) return name.endsWith(candidate);
    if (candidate.endsWith('/*')) return type.startsWith(candidate.slice(0, -1));

    return type === candidate;
  });
}

export function partitionFiles(files: readonly File[], rule: FileRule = {}): FilePartition {
  const { accept = [], maxBytes, maxFiles } = rule;
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];

  for (const file of files) {
    if (!matchesAccept(file, accept)) {
      rejected.push({ file, reason: 'type' });
    } else if (maxBytes !== undefined && file.size > maxBytes) {
      rejected.push({ file, reason: 'size' });
    } else if (maxFiles !== undefined && accepted.length >= maxFiles) {
      rejected.push({ file, reason: 'count' });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, rejected };
}

/** One sentence: what happened, then what to do. Written once so every tool agrees. */
export function describeRejection(rejection: RejectedFile, rule: FileRule = {}): string {
  const { file, reason } = rejection;

  if (reason === 'size') {
    const limit = rule.maxBytes === undefined ? 'the limit' : formatBytes(rule.maxBytes);
    return `${file.name} is bigger than ${limit} — try a smaller one`;
  }

  if (reason === 'count') {
    const limit = rule.maxFiles ?? 0;
    return `You can add ${limit} ${limit === 1 ? 'file' : 'files'} at a time`;
  }

  return `${file.name} isn't ${describeAccept(rule.accept ?? [])} — try another`;
}

function describeAccept(accept: readonly string[]): string {
  // A family like `image/*` says everything the extensions alongside it would, and
  // "a PNG, JPG, WEBP, or image" is nobody's idea of a helpful sentence.
  const wildcards = accept.filter((pattern) => pattern.trim().endsWith('/*'));
  const named = wildcards.length > 0 ? wildcards : accept;

  const labels = named.map((pattern) => {
    const value = pattern.trim();

    if (value.startsWith('.')) return value.slice(1).toUpperCase();
    if (value.endsWith('/*')) return value.slice(0, -2).toLowerCase();

    return (value.split('/').at(-1) ?? value).toUpperCase();
  });

  const [first, second] = labels;

  if (first === undefined) return 'a file this tool reads';
  if (second === undefined) return `${article(first)} ${first}`;
  if (labels.length === 2) return `${article(first)} ${first} or ${second}`;

  return `${article(first)} ${labels.slice(0, -1).join(', ')}, or ${labels.at(-1)}`;
}

function article(label: string): string {
  return /^[AEIOU]/i.test(label) ? 'an' : 'a';
}
