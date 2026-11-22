/**
 * Draws the continents of the homepage hero's world map as one vector shape
 * (public/images/brand/world-map-v1.svg) from the 1-degree land mask in
 * src/components/site/globe-mask.ts.
 *
 *   npx tsx scripts/make-world-map.ts
 *
 * The coastline is traced where the smoothly interpolated land share crosses
 * one half (marching squares on a half-degree grid), simplified, and filled in
 * the site's pale lavender with a slightly deeper edge. The frame comes from
 * src/components/site/world-map-geometry.ts, so the routes drawn on top by
 * world-map.tsx line up.
 *
 * Files under /images/ are cached for a year: if the drawing changes, write it
 * to a new name (world-map-v2.svg) and update world-map.tsx.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { MAP } from "../src/components/site/world-map-geometry";
import { GLOBE_MASK as WORLD_MASK } from "../src/components/site/globe-mask";

const FILE = "public/images/brand/world-map-v1.svg";
const STEP = 0.5; // degrees between samples
const TOLERANCE = 0.55; // map units: how far simplification may move the coast
const FILL = "#eae6fb"; // lav-100
const EDGE = "#d8cff7"; // lav-200

// ---- the land share, interpolated between the 1-degree cells --------------------------
const bin = Buffer.from(WORLD_MASK, "base64");
const cell = (x: number, y: number) => {
  const cx = ((x % 360) + 360) % 360;
  const cy = Math.max(0, Math.min(179, y));
  const i = cy * 360 + cx;
  return ((bin[i >> 2]! >> (6 - 2 * (i & 3))) & 3) / 3;
};
function land(lat: number, lon: number) {
  const fx = lon + 180 - 0.5;
  const fy = 90 - lat - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  return (cell(x0, y0) * (1 - tx) + cell(x0 + 1, y0) * tx) * (1 - ty) + (cell(x0, y0 + 1) * (1 - tx) + cell(x0 + 1, y0 + 1) * tx) * ty;
}

// ---- sample the frame, with a ring of sea around it so every coast closes ----------
const cols = Math.round((MAP.east - MAP.west) / STEP) + 1;
const rows = Math.round((MAP.north - MAP.south) / STEP) + 1;
const W = cols + 2;
const H = rows + 2;
const value = new Float64Array(W * H);
for (let j = 1; j <= rows; j++) {
  for (let i = 1; i <= cols; i++) value[j * W + i] = land(MAP.north - (j - 1) * STEP, MAP.west + (i - 1) * STEP);
}
const v = (i: number, j: number) => value[j * W + i]!;
// Grid point (i, j) in map units; the sea ring sits just outside the frame.
const px = (i: number) => ((i - 1) / (cols - 1)) * MAP.width;
const py = (j: number) => ((j - 1) / (rows - 1)) * MAP.height;

// ---- marching squares: crossing points live on grid edges, keyed by edge ---------------
type P = { x: number; y: number };
const points = new Map<string, P>();
const level = 0.5;
const cross = (a: number, b: number) => (level - a) / (b - a);
function edgePoint(key: string): P {
  let p = points.get(key);
  if (p) return p;
  const [kind, si, sj] = key.split(":");
  const i = Number(si);
  const j = Number(sj);
  if (kind === "h") {
    const t = cross(v(i, j), v(i + 1, j));
    p = { x: px(i) + (px(i + 1) - px(i)) * t, y: py(j) };
  } else {
    const t = cross(v(i, j), v(i, j + 1));
    p = { x: px(i), y: py(j) + (py(j + 1) - py(j)) * t };
  }
  points.set(key, p);
  return p;
}
const links = new Map<string, string[]>();
const link = (a: string, b: string) => {
  (links.get(a) ?? links.set(a, []).get(a)!).push(b);
  (links.get(b) ?? links.set(b, []).get(b)!).push(a);
};
for (let j = 0; j < H - 1; j++) {
  for (let i = 0; i < W - 1; i++) {
    const tl = v(i, j) > level ? 8 : 0;
    const tr = v(i + 1, j) > level ? 4 : 0;
    const br = v(i + 1, j + 1) > level ? 2 : 0;
    const bl = v(i, j + 1) > level ? 1 : 0;
    const code = tl | tr | br | bl;
    if (code === 0 || code === 15) continue;
    const top = `h:${i}:${j}`;
    const bottom = `h:${i}:${j + 1}`;
    const left = `v:${i}:${j}`;
    const right = `v:${i + 1}:${j}`;
    const centre = (v(i, j) + v(i + 1, j) + v(i + 1, j + 1) + v(i, j + 1)) / 4 > level;
    switch (code) {
      case 1: case 14: link(left, bottom); break;
      case 2: case 13: link(bottom, right); break;
      case 3: case 12: link(left, right); break;
      case 4: case 11: link(top, right); break;
      case 6: case 9: link(top, bottom); break;
      case 7: case 8: link(left, top); break;
      case 5: // tr and bl on land
        if (centre) { link(left, top); link(bottom, right); } else { link(left, bottom); link(top, right); }
        break;
      case 10: // tl and br on land
        if (centre) { link(left, bottom); link(top, right); } else { link(left, top); link(bottom, right); }
        break;
    }
  }
}

// ---- join the pieces into closed coastlines -----------------------------------------
const used = new Set<string>();
const rings: P[][] = [];
for (const start of links.keys()) {
  if (used.has(start)) continue;
  const ring: P[] = [];
  let prev = "";
  let at = start;
  while (!used.has(at)) {
    used.add(at);
    ring.push(edgePoint(at));
    const next = (links.get(at) ?? []).find((k) => k !== prev && !used.has(k));
    if (!next) break;
    prev = at;
    at = next;
  }
  if (ring.length > 3) rings.push(ring);
}

// ---- simplify (Ramer-Douglas-Peucker) and drop specks ---------------------------------
function simplify(pts: P[], tol: number): P[] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const A = pts[a]!;
    const B = pts[b]!;
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const len = Math.hypot(dx, dy) || 1;
    let far = -1;
    let dist = 0;
    for (let k = a + 1; k < b; k++) {
      const d = Math.abs(dy * pts[k]!.x - dx * pts[k]!.y + B.x * A.y - B.y * A.x) / len;
      if (d > dist) {
        dist = d;
        far = k;
      }
    }
    if (dist > tol && far > 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return pts.filter((_, k) => keep[k]);
}
const area = (pts: P[]) => Math.abs(pts.reduce((s, p, k) => s + p.x * pts[(k + 1) % pts.length]!.y - pts[(k + 1) % pts.length]!.x * p.y, 0)) / 2;

/** Simplifies a closed coastline: split at the point farthest from the start, simplify both halves. */
function simplifyRing(ring: P[]): P[] {
  let far = 0;
  let best = 0;
  ring.forEach((p, k) => {
    const d = Math.hypot(p.x - ring[0]!.x, p.y - ring[0]!.y);
    if (d > best) {
      best = d;
      far = k;
    }
  });
  const a = simplify(ring.slice(0, far + 1), TOLERANCE);
  const b = simplify([...ring.slice(far), ring[0]!], TOLERANCE);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

const shapes = rings.map(simplifyRing).filter((ring) => ring.length > 3 && area(ring) > 6);
const d = shapes
  .map((ring) => `M${ring.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L")}Z`)
  .join("")
  .replace(/\.0(?=[ LZM])/g, "");

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP.width} ${MAP.height}" width="${MAP.width}" height="${MAP.height}">` +
  `<path d="${d}" fill="${FILL}" fill-rule="evenodd" stroke="${EDGE}" stroke-width="1.4" stroke-linejoin="round"/></svg>\n`;
writeFileSync(path.join(process.cwd(), FILE), svg);
console.log(`${shapes.length} shapes, ${(svg.length / 1024).toFixed(1)} KB -> ${FILE}`);
