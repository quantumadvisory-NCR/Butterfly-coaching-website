/**
 * The homepage world map's frame and places, shared by the component that
 * draws the routes (world-map.tsx) and the script that draws the continents
 * (scripts/make-world-map.ts), so the two always line up.
 *
 * The map is a flat (equirectangular) view from 110°W to 160°E and from 72°N
 * to 45°S: the Americas' east coast, Europe, Africa, the Middle East, India,
 * South-East Asia and Australia. It is drawn 1400 x 640 units.
 */
export const MAP = { west: -110, east: 160, north: 72, south: -45, width: 1400, height: 640 } as const;

/** Where a latitude and longitude fall on the map, in its own units. */
export function mapPoint(lat: number, lon: number) {
  return {
    x: ((lon - MAP.west) / (MAP.east - MAP.west)) * MAP.width,
    y: ((MAP.north - lat) / (MAP.north - MAP.south)) * MAP.height,
  };
}

/** Jaipur, India: where every route starts. */
export const HOME = { lat: 26.9, lon: 75.8 };

/** The countries in the homepage's community section. */
export const PLACES = [
  { name: "UAE", lat: 25.2, lon: 55.3 },
  { name: "Singapore", lat: 1.35, lon: 103.8 },
  { name: "Indonesia", lat: -6.2, lon: 106.8 },
  { name: "UK", lat: 51.5, lon: -0.1 },
  { name: "USA", lat: 40.7, lon: -74 },
] as const;
