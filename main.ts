// News-image entry (Node 22, standard library only). The entry image is a fixed
// 1024x1024 PNG summing up the world news of Friday 20 November 2026; it was
// composed before submission, so this program only copies its bytes. Because the
// output is a byte-for-byte copy of a fixed file, both grader runs produce
// identical output.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ONE_MIB = 1024 * 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

function fail(message) {
  throw new Error(message);
}

function checkPngDimensions(bytes) {
  // A PNG stores its width and height as big-endian uint32 at offsets 16 and
  // 20 (the IHDR chunk). The entry is composed at exactly 1024x1024.
  if (bytes.length < 24) {
    fail('entry.png is too short to hold a PNG header');
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== 1024 || height !== 1024) {
    fail(`entry.png is ${width}x${height}, expected 1024x1024`);
  }
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const source = join(here, 'entry.png');
  const bytes = readFileSync(source);

  // The gate only accepts a PNG or JPEG at most 1 MiB; check both before writing.
  if (bytes.length > ONE_MIB) {
    fail(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
  }
  const isPng = bytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC);
  const isJpeg = bytes.subarray(0, JPEG_MAGIC.length).equals(JPEG_MAGIC);
  if (!isPng && !isJpeg) {
    fail('entry.png is neither a PNG nor a JPEG');
  }
  if (isPng) {
    checkPngDimensions(bytes);
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'entry.png');
  writeFileSync(outPath, bytes);

  // Read it back and compare byte-for-byte: a partial or corrupted write
  // must fail loudly instead of shipping a broken image.
  const written = readFileSync(outPath);
  if (!written.equals(bytes)) {
    fail('entry.png was not written back byte-for-byte');
  }

  console.log(`wrote ${outPath} (${bytes.length} bytes)`);
}

main();
