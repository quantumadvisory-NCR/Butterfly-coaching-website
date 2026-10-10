/**
 * Lays a very tall full-page screenshot out as side-by-side columns so the
 * whole page can be reviewed in one image.
 *   tsx scripts/slice-shot.ts <screenshot> <out.jpg> [columnHeight]
 */
import sharp from "sharp";

const [file, out, heightArg] = process.argv.slice(2);
if (!file || !out) {
  console.error("usage: slice-shot <screenshot> <out.jpg> [columnHeight]");
  process.exit(1);
}

const meta = await sharp(file).metadata();
const width = meta.width ?? 0;
const height = meta.height ?? 0;
const columnHeight = Math.min(height, Number(heightArg ?? 2600));
const columns = Math.ceil(height / columnHeight);
const gap = 16;

const slices = await Promise.all(
  Array.from({ length: columns }, async (_, i) => {
    const top = i * columnHeight;
    const sliceHeight = Math.min(columnHeight, height - top);
    return {
      input: await sharp(file).extract({ left: 0, top, width, height: sliceHeight }).toBuffer(),
      left: i * (width + gap),
      top: 0,
    };
  }),
);

await sharp({
  create: { width: columns * width + (columns - 1) * gap, height: columnHeight, channels: 3, background: "#3a3f4b" },
})
  .composite(slices)
  .jpeg({ quality: 80 })
  .toFile(out);
console.log(`${width}x${height} -> ${columns} columns -> ${out}`);
