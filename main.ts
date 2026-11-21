// main.ts — entrypoint for the make.fun news-image-20261120 entry.
//
// The image itself is a fixed 1024x1024 PNG summing up the world news of
// Friday 20 November 2026. It was composed before submission, so this
// program does not generate anything: it only copies the bytes of
// entry.png into the output directory, after validating them.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR can stand in for
// /output, e.g.:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1024 * 1024;
const EXPECTED_WIDTH = 1024;
const EXPECTED_HEIGHT = 1024;

// PNG signature: 89 50 4E 47 0D 0A 1A 0A
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// JPEG SOI plus marker prefix: FF D8 FF
const JPEG_PREFIX = Buffer.from([0xff, 0xd8, 0xff]);

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const sourcePath = join(here, "entry.png");
  const bytes = readFileSync(sourcePath);

  if (bytes.length > MAX_BYTES) {
    throw new Error(
      `entry.png is ${bytes.length} bytes, over the 1 MiB limit (${MAX_BYTES} bytes)`,
    );
  }

  if (bytes.length < 24) {
    throw new Error(
      `entry.png is only ${bytes.length} bytes, too short to hold a PNG header`,
    );
  }

  const isPng = bytes.subarray(0, 8).equals(PNG_SIGNATURE);
  const isJpeg = bytes.subarray(0, 3).equals(JPEG_PREFIX);
  if (!isPng && !isJpeg) {
    throw new Error(
      "entry.png is neither a PNG nor a JPEG: unrecognized file signature",
    );
  }

  if (isPng) {
    // In a PNG, the 8-byte signature is followed by the IHDR chunk: a
    // 4-byte length, the 4-byte "IHDR" type, then width and height as
    // big-endian uint32s at offsets 16 and 20.
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
      throw new Error(
        `entry.png is ${width}x${height}, expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`,
      );
    }
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.png");
  writeFileSync(outPath, bytes);

  // Read the output back and compare it byte-for-byte with the source, so a
  // broken or truncated write fails loudly instead of shipping a bad image.
  const written = readFileSync(outPath);
  if (!written.equals(bytes)) {
    throw new Error(
      `output ${outPath} differs from ${sourcePath} after writing; refusing to ship a broken image`,
    );
  }

  console.log(`wrote ${outPath} (${bytes.length} bytes)`);
}

main();
