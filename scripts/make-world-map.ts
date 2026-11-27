/**
 * Draws the continents of the homepage hero's world map as one vector shape
 * (public/images/brand/world-map-v2.svg) from Natural Earth's 1:50m land
 * polygons (public domain), as published in the npm package world-atlas 2.0.2.
 *
 *   npx tsx scripts/make-world-map.ts [path/to/land-50m.json]
 *
 * Without a path it downloads https://unpkg.com/world-atlas@2.0.2/land-50m.json
 * (about 0.5 MB) for this run only; nothing is kept. The coastline is decoded
 * from the TopoJSON, clipped to the map's frame, simplified and filled in the
 * owner's chosen style ("B. Defined", 22 November 2026): light gray land
 * with a clear gray coastline (colours from the owner's brief, 25 November 2026). The frame comes from
 * src/components/site/world-map-geometry.ts, so the routes drawn on top by
 * world-map.tsx line up.
 *
 * Files under /images/ are cached for a year: if the drawing changes, write it
 * to a new name (world-map-v3.svg) and update world-map.tsx.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MAP } from "../src/components/site/world-map-geometry";

const SOURCE = "https://unpkg.com/world-atlas@2.0.2/land-50m.json";
const FILE = "public/images/brand/world-map-v2.svg";
const FILL = "#ecece9";
const EDGE = "#d6d5d0";
const EDGE_WIDTH = 1.5;
const TOLERANCE = 0.35; // map units: how far simplification may move the coast
const MIN_AREA = 2; // map units squared: smaller islands are left out
const MARGIN = 6; // map units of coast kept beyond the frame, so clipped edges stay outside the picture

type Topology = {
  transform: { scale: [number, number]; translate: [number, number] };
  arcs: [number, number][][];
  objects: { land: { type: string; geometries?: Geometry[]; arcs?: number[][][] } };
};
type Geometry = { type: string; arcs: number[][] | number[][][] };
type P = { x: number; y: number };

async function load(): Promise<Topology> {
  const file = process.argv[2];
  if (file) return JSON.parse(readFileSync(file, "utf8")) as Topology;
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`Could not download ${SOURCE}: ${response.status}`);
  return (await response.json()) as Topology;
}

/** Decodes the quantised, delta-encoded arcs into longitude/latitude points. */
function decodeArcs(topology: Topology): [number, number][][] {
  const [sx, sy] = topology.transform.scale;
  const [tx, ty] = topology.transform.translate;
  return topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * sx + tx, y * sy + ty] as [number, number];
    });
  });
}

/**
 * Builds a ring from arc indices (a negative index ~i means arc i reversed).
 * Longitudes are unwrapped along the ring, so land that crosses the 180th
 * meridian (eastern Russia) runs on past it instead of jumping back across the
 * whole map; whatever then lies beyond the frame is clipped away.
 */
function ring(indices: number[], arcs: [number, number][][]): [number, number][] {
  const points: [number, number][] = [];
  for (const index of indices) {
    const arc = index >= 0 ? arcs[index]! : [...arcs[~index]!].reverse();
    points.push(...(points.length ? arc.slice(1) : arc));
  }
  for (let i = 1; i < points.length; i++) {
    const step = points[i]![0] - points[i - 1]![0];
    if (step > 180) points[i]![0] -= 360 * Math.round(step / 360);
    else if (step < -180) points[i]![0] += 360 * Math.round(-step / 360);
  }
  // Bring the whole ring back so its middle lies between -180 and 180.
  const mean = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const shift = 360 * Math.round(mean / 360);
  if (shift) for (const p of points) p[0] -= shift;
  return points;
}

function polygons(topology: Topology, arcs: [number, number][][]): [number, number][][] {
  const land = topology.objects.land;
  const geometries: Geometry[] = land.geometries ?? [{ type: land.type, arcs: land.arcs ?? [] }];
  const rings: [number, number][][] = [];
  for (const g of geometries) {
    if (g.type === "Polygon") for (const r of g.arcs as number[][]) rings.push(ring(r, arcs));
    if (g.type === "MultiPolygon") for (const poly of g.arcs as number[][][]) for (const r of poly) rings.push(ring(r, arcs));
  }
  return rings;
}

const project = ([lon, lat]: [number, number]): P => ({
  x: ((lon - MAP.west) / (MAP.east - MAP.west)) * MAP.width,
  y: ((MAP.north - lat) / (MAP.north - MAP.south)) * MAP.height,
});

/** Sutherland-Hodgman: clips a closed ring to the frame (plus a margin). */
function clip(points: P[]): P[] {
  const edges: [(p: P) => boolean, (a: P, b: P) => P][] = [
    [(p) => p.x >= -MARGIN, (a, b) => cut(a, b, "x", -MARGIN)],
    [(p) => p.x <= MAP.width + MARGIN, (a, b) => cut(a, b, "x", MAP.width + MARGIN)],
    [(p) => p.y >= -MARGIN, (a, b) => cut(a, b, "y", -MARGIN)],
    [(p) => p.y <= MAP.height + MARGIN, (a, b) => cut(a, b, "y", MAP.height + MARGIN)],
  ];
  let out = points;
  for (const [inside, intersect] of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i]!;
      const prev = input[(i + input.length - 1) % input.length]!;
      if (inside(cur)) {
        if (!inside(prev)) out.push(intersect(prev, cur));
        out.push(cur);
      } else if (inside(prev)) {
        out.push(intersect(prev, cur));
      }
    }
    if (!out.length) break;
  }
  return out;
}
function cut(a: P, b: P, axis: "x" | "y", value: number): P {
  const t = (value - a[axis]) / (b[axis] - a[axis]);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Ramer-Douglas-Peucker on an open line. */
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
/** Simplifies a closed ring: split at the point farthest from the start, simplify both halves. */
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
const area = (pts: P[]) =>
  Math.abs(pts.reduce((s, p, k) => s + p.x * pts[(k + 1) % pts.length]!.y - pts[(k + 1) % pts.length]!.x * p.y, 0)) / 2;

const topology = await load();
const arcs = decodeArcs(topology);
const shapes = polygons(topology, arcs)
  .map((r) => clip(r.map(project)))
  .filter((r) => r.length > 3)
  .map(simplifyRing)
  .filter((r) => r.length > 3 && area(r) > MIN_AREA);

const d = shapes
  .map((r) => `M${r.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L")}Z`)
  .join("")
  .replace(/\.0(?=[ LZM])/g, "");
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP.width} ${MAP.height}" width="${MAP.width}" height="${MAP.height}">` +
  `<path d="${d}" fill="${FILL}" fill-rule="evenodd" stroke="${EDGE}" stroke-width="${EDGE_WIDTH}" stroke-linejoin="round"/></svg>\n`;
writeFileSync(path.join(process.cwd(), FILE), svg);
console.log(`${shapes.length} shapes, ${(svg.length / 1024).toFixed(1)} KB -> ${FILE}`);
