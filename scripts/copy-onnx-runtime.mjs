import { existsSync } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * onnxruntime-web — the WASM engine the Background Remover runs its model through —
 * fetches its runtime binaries from jsDelivr's CDN by default. Every other WASM codec in
 * the suite ships its own binary rather than reaching out to a third party at runtime
 * (see @jsquash/* and heic-to), so this copies the same files from the already-resolved
 * dependency into public/ort/ instead. One more host to fetch a public model from is
 * honest; one more host the CSP has to trust just to run the engine itself is not.
 *
 * Only the six wasm-simd-threaded variants are needed: plain and asyncify cover the WASM
 * fallback (Safari and everyone else — the same split onnxruntime-web's own default path
 * logic makes), jsep is the WebGPU-capable build. Everything else in the package's dist
 * folder is a JS bundle Vite already resolves through the normal import graph.
 */

const FILES = [
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.asyncify.mjs',
  'ort-wasm-simd-threaded.asyncify.wasm',
  'ort-wasm-simd-threaded.jsep.mjs',
  'ort-wasm-simd-threaded.jsep.wasm',
];

const TARGET_DIR = 'public/ort';

function packageRoot(specifier, fromDir) {
  const require = createRequire(join(fromDir, 'noop.cjs'));
  const entry = require.resolve(specifier);

  // Walk up from the resolved entry file until the package's own package.json turns up —
  // avoids depending on "<pkg>/package.json" being an exposed subpath in `exports`.
  let dir = dirname(entry);
  while (!existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`Couldn't find package.json above ${entry}`);
    dir = parent;
  }
  return dir;
}

const projectRoot = dirname(fileURLToPath(import.meta.url));
const transformersRoot = packageRoot('@huggingface/transformers', projectRoot);
const onnxRuntimeRoot = packageRoot('onnxruntime-web', transformersRoot);
const distDir = join(onnxRuntimeRoot, 'dist');

await mkdir(TARGET_DIR, { recursive: true });

let copied = 0;
for (const file of FILES) {
  const target = join(TARGET_DIR, file);
  if (existsSync(target)) continue;

  await copyFile(join(distDir, file), target);
  copied += 1;
}

console.log(
  copied > 0
    ? `onnx runtime: copied ${copied} of ${FILES.length} files into ${TARGET_DIR}`
    : `onnx runtime: all ${FILES.length} files already present in ${TARGET_DIR}`,
);
