/**
 * Builds a labelled contact sheet from a folder of images so a batch can be
 * reviewed at a glance.   tsx scripts/contact-sheet.ts <dir> <out.jpg> [cols]
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [dir, out, colsArg] = process.argv.slice(2);
if (!dir || !out) {
  console.error("usage: contact-sheet <dir> <out.jpg> [cols]");
  process.exit(1);
}
const cols = Number(colsArg ?? 5);
const cell = 320;
const label = 22;

const files = readdirSync(dir)
  .filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f))
  .sort();
const rows = Math.ceil(files.length / cols);

const composites = await Promise.all(
  files.map(async (file, i) => {
    const meta = await sharp(path.join(dir, file)).metadata();
    const thumb = await sharp(path.join(dir, file))
      .resize(cell, cell - label, { fit: "contain", background: "#dddddd" })
      .flatten({ background: "#dddddd" })
      .toBuffer();
    const text = `${file.slice(0, 30)} ${meta.width}x${meta.height}`;
    const svg = Buffer.from(
      `<svg width="${cell}" height="${label}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111"/><text x="6" y="15" font-size="12" font-family="Arial" fill="#fff">${text}</text></svg>`,
    );
    const left = (i % cols) * cell;
    const top = Math.floor(i / cols) * cell;
    return [
      { input: thumb, left, top },
      { input: svg, left, top: top + cell - label },
    ];
  }),
);

await sharp({
  create: { width: cols * cell, height: rows * cell, channels: 3, background: "#ffffff" },
})
  .composite(composites.flat())
  .jpeg({ quality: 78 })
  .toFile(out);
console.log(`${files.length} images -> ${out}`);
