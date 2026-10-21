/**
 * Prepares source images for the site: resizes, re-encodes and writes them to
 * public/images with descriptive filenames, then records their dimensions in
 * seed/data/image-dimensions.json for the media library seed.
 *
 * Sources live in .local/raw (not committed). The masters written here are the
 * largest size ever needed; next/image generates the responsive AVIF/WebP
 * variants per device at request time.
 *
 *   npm run images:optimise
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp, { type Sharp } from "sharp";

const RAW = path.resolve(".local/raw");
const OUT = path.resolve("public/images");

type Job = {
  src: string;
  dest: string;
  /** Longest edge in px. */
  max: number;
  format: "jpg" | "webp" | "png" | "copy";
  quality?: number;
  /** Turn blue tones neutral grey, for the gray and yellow palette (October 2026). */
  neutralBlues?: boolean;
};

const photo = (name: string, max = 2000): Job => ({
  src: `generated/${name}.png`,
  dest: `photography/${name}.jpg`,
  max,
  format: "jpg",
  quality: 82,
});
const person = (src: string, slug: string): Job => ({
  src: `img/${src}`,
  dest: `people/${slug}.webp`,
  max: 860,
  format: "webp",
  quality: 86,
});
const event = (src: string, name: string): Job => ({
  src: `gallery/${src}.jpg`,
  dest: `gallery/${name}.jpg`,
  max: 1600,
  format: "jpg",
  quality: 80,
});

const jobs: Job[] = [
  // AI-generated editorial photography (Higgsfield)
  photo("hero-coaching-conversation", 2200),
  photo("hero-coaching-conversation-portrait", 1500),
  photo("path-become-a-coach", 1500),
  photo("path-grow-as-a-leader", 1500),
  photo("path-develop-your-organisation", 1500),
  photo("programme-acc-learning-lab"),
  photo("programme-pcc-deep-practice"),
  photo("programme-mcc-mastery"),
  photo("mentoring-session-review"),
  photo("corporate-leadership-workshop"),
  photo("executive-coaching-walk"),
  photo("reflection-journal", 1500),
  photo("practice-feedback"),
  photo("cohort-community"),
  // The butterfly's blue wings turned charcoal, so its yellow edges match the palette.
  { ...photo("butterfly-on-leaf", 2200), dest: "photography/butterfly-on-leaf-charcoal.jpg", neutralBlues: true },
  photo("blog-planning-desk", 1600),
  photo("blog-conversation-table", 1600),
  photo("blog-steps-forward", 1600),
  photo("blog-speaking-with-confidence", 1600),
  photo("blog-repotting-plant", 1600),
  photo("blog-window-reflection", 1600),
  photo("blog-morning-routine", 1600),
  photo("blog-founder-at-work", 1600),
  photo("blog-reviewing-progress", 1600),

  // Authentic BCA people
  person("AnupNew.png", "anup-mittal"),
  person("kanikanew.png", "kanika-vijai"),
  person("vijay001.png", "vijay-srinivasan"),
  person("0034.png", "sucheta-kulkarni"),
  person("misk.jpg", "misk-khurana"),
  person("supriya-1.png", "supriya-dhongde"),
  person("SandeepSingh11.png", "sandeep-chugh"),
  person("Naved11.png", "naved-narayan"),
  person("AnupNayar11.png", "anup-nayar"),
  person("Cecillia11.png", "cecilla-fretias"),
  person("Rajendra11.png", "rajendra-pratap-singh"),
  person("Nandkishore-1.png", "nand-kishore"),
  person("AnjuNAyar.png", "anju-nayar"),
  person("Mrinal11.png", "mrinal-bafna"),

  // Authentic BCA event photographs
  event("g01", "bca-community-outdoors"),
  event("g03", "workshop-cohort-celebrating"),
  event("g06", "young-professionals-cohort"),
  event("g08", "leadership-workshop-group"),
  event("g10", "anup-facilitating-leadership-session"),
  event("g11", "anup-facilitating-workshop"),
  event("g13", "anup-engaging-audience"),
  event("g15", "corporate-workshop-in-session"),
  event("g18", "anup-with-table-group"),
  event("g19", "workshop-cohort-group-photo"),

  // ICF accreditation marks supplied to BCA
  { src: "img/ICF_AccreditationLogos_FINAL-Level1-1024x1024.png", dest: "icf/icf-level-1-accredited.webp", max: 512, format: "webp", quality: 92 },
  { src: "img/ICF_AccreditationLogos_FINAL-Level2-1024x1024.png", dest: "icf/icf-level-2-accredited.webp", max: 512, format: "webp", quality: 92 },
  { src: "img/ICF_AccreditationLogos_FINAL-Level3-1024x1024.png", dest: "icf/icf-level-3-accredited.webp", max: 512, format: "webp", quality: 92 },

  // Client logos as published on the existing BCA website
  { src: "img/amazon111.png", dest: "logos/amazon.png", max: 200, format: "copy" },
  { src: "img/upgrad010.png", dest: "logos/upgrad.png", max: 200, format: "copy" },
  { src: "img/vi11.png", dest: "logos/vi.png", max: 200, format: "copy" },
  { src: "img/axisbank11.png", dest: "logos/axis-bank.png", max: 200, format: "copy" },
];

/** Turns blue tones neutral grey (hues 195 to 255 degrees, fading out over 25 degrees either side); other colours are untouched. */
async function neutraliseBlues(image: Sharp): Promise<Sharp> {
  const { data, info } = await image.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const r = data.readUInt8(i) / 255;
    const g = data.readUInt8(i + 1) / 255;
    const b = data.readUInt8(i + 2) / 255;
    const spread = b - Math.min(r, g);
    if (spread < 0.02 || b < r || b < g) continue;
    const hue = 60 * ((r - g) / spread + 4);
    const weight = hue >= 195 && hue <= 255 ? 1 : hue > 170 && hue < 195 ? (hue - 170) / 25 : hue > 255 && hue < 280 ? (280 - hue) / 25 : 0;
    if (weight === 0) continue;
    const grey = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    data[i] = Math.round(255 * (r + (grey - r) * weight));
    data[i + 1] = Math.round(255 * (g + (grey - g) * weight));
    data[i + 2] = Math.round(255 * (b + (grey - b) * weight));
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } });
}

/** Derives the logo variants from the official SVG without redrawing anything. */
function buildLogos() {
  const source = path.join(RAW, "img/footer-logo.svg");
  if (!existsSync(source)) return;
  const svg = readFileSync(source, "utf8");
  const dir = path.join(OUT, "brand");
  mkdirSync(dir, { recursive: true });

  // Files under /images are cached for a year (next.config.ts), so a recoloured
  // variant gets a new filename rather than replacing an old one.
  const midGray = (art: string) => art.replaceAll('fill="white"', 'fill="#5F5F5F"');

  // Original: yellow butterfly, white wordmark and antennae. For dark backgrounds.
  writeFileSync(path.join(dir, "bca-logo-on-dark.svg"), svg);
  // Same artwork with the wordmark and antennae in mid gray, for light backgrounds.
  writeFileSync(path.join(dir, "bca-logo-mid-gray.svg"), midGray(svg));

  // Butterfly mark only: the wings and antennae, which sit left of the wordmark.
  const paths = [...svg.matchAll(/<path d="M\s*([\d.]+)[^>]*\/>/g)].filter((m) => Number(m[1]) < 100).map((m) => m[0]);
  const yellowOnly = paths.filter((p) => !p.includes('fill="white"'));
  const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="98" height="90" viewBox="-1 -0.5 98 89.5" fill="none">\n${paths.join("\n")}\n</svg>\n`;
  writeFileSync(path.join(dir, "bca-mark-on-dark.svg"), mark);
  writeFileSync(path.join(dir, "bca-mark-mid-gray.svg"), midGray(mark));
  // Favicon: the wings on a mid gray rounded square so they read at 16px on any tab colour.
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#5F5F5F"/><g transform="translate(26 22) scale(0.94)">${yellowOnly.join("")}</g></svg>\n`;
  writeFileSync(path.resolve("src/app/icon.svg"), icon);
  console.log(`logos   brand/* (${paths.length} mark paths, ${yellowOnly.length} yellow)`);
  return icon;
}

/** Wraps a PNG in the ICO container, so browsers asking for /favicon.ico get a real file. */
function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt8(0, 2); // no palette
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12); // offset of the image data
  return Buffer.concat([header, entry, png]);
}

async function buildFavicons(iconSvg: string | undefined) {
  if (!iconSvg) return;
  const svg = Buffer.from(iconSvg);
  writeFileSync(path.resolve("src/app/favicon.ico"), pngToIco(await sharp(svg).resize(48, 48).png().toBuffer(), 48));
  await sharp(svg).resize(180, 180).png().toFile(path.resolve("src/app/apple-icon.png"));
  console.log("icons   src/app/favicon.ico, apple-icon.png");
}

async function run() {
  const dimensions: Record<string, { width: number; height: number; bytes: number }> = {};
  let missing = 0;

  for (const job of jobs) {
    const src = path.join(RAW, job.src);
    const dest = path.join(OUT, job.dest);
    if (!existsSync(src)) {
      // Already-optimised output may exist from an earlier run on another machine.
      if (!existsSync(dest)) {
        console.warn(`missing ${job.src}`);
        missing += 1;
        continue;
      }
    } else {
      mkdirSync(path.dirname(dest), { recursive: true });
      if (job.format === "copy") {
        copyFileSync(src, dest);
      } else {
        const resized = sharp(src).rotate().resize({
          width: job.max,
          height: job.max,
          fit: "inside",
          withoutEnlargement: true,
        });
        const pipeline = job.neutralBlues ? await neutraliseBlues(resized.flatten({ background: "#ffffff" })) : resized;
        if (job.format === "jpg") await pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: job.quality, mozjpeg: true }).toFile(dest);
        if (job.format === "webp") await pipeline.webp({ quality: job.quality, alphaQuality: 90 }).toFile(dest);
        if (job.format === "png") await pipeline.png({ compressionLevel: 9 }).toFile(dest);
      }
    }
    const meta = await sharp(dest).metadata();
    const bytes = statSync(dest).size;
    dimensions[`/images/${job.dest}`] = { width: meta.width ?? 0, height: meta.height ?? 0, bytes };
    console.log(`${String(Math.round(bytes / 1024)).padStart(5)} KB  ${meta.width}x${meta.height}  ${job.dest}`);
  }

  await buildFavicons(buildLogos());
  for (const name of ["bca-logo-on-dark.svg", "bca-logo-mid-gray.svg", "bca-mark-on-dark.svg", "bca-mark-mid-gray.svg"]) {
    const file = path.join(OUT, "brand", name);
    if (!existsSync(file)) continue;
    const meta = await sharp(file).metadata();
    dimensions[`/images/brand/${name}`] = { width: meta.width ?? 0, height: meta.height ?? 0, bytes: statSync(file).size };
  }

  mkdirSync("seed/data", { recursive: true });
  writeFileSync("seed/data/image-dimensions.json", `${JSON.stringify(dimensions, null, 2)}\n`);
  console.log(`\n${Object.keys(dimensions).length} images recorded${missing ? `, ${missing} missing` : ""}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
