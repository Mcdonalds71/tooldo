import { createSample } from './sample';
import type { BackgroundUtilityResult, BackgroundUtilityTask, ZipEntry } from './types';

/**
 * The half of the tool that has nothing to do with the model: generating the sample
 * image and zipping results. Stateless and cheap either way, so it travels through the
 * shared ephemeral worker (`utilityWorker.ts`, `runInWorker`) like every other tool,
 * rather than the persistent one `engine.ts` owns.
 */
export async function runUtilityTask(
  task: BackgroundUtilityTask,
): Promise<BackgroundUtilityResult> {
  if (task.kind === 'sample') {
    return { kind: 'sample', file: await createSample() };
  }

  return { kind: 'zip', bytes: await zipEntries(task.entries) };
}

async function zipEntries(entries: readonly ZipEntry[]): Promise<Uint8Array<ArrayBuffer>> {
  const { zip } = await import('fflate');
  const files = Object.fromEntries(entries.map((entry) => [entry.name, entry.bytes]));

  return new Promise((resolve, reject) => {
    // A fixed mtime keeps the zip from carrying the exact moment you ran the tool. The
    // ZIP format's DOS date field only encodes 1980–2099, so this is the earliest valid
    // date rather than the epoch.
    zip(files, { mtime: new Date('1980-01-01T00:00:00Z') }, (error, bytes) => {
      if (error) reject(error);
      else resolve(bytes as Uint8Array<ArrayBuffer>);
    });
  });
}
