import Image from "next/image";
import { cn } from "@/lib/utils";
import { HOME, MAP, PLACES, mapPoint } from "./world-map-geometry";

/**
 * The world map in the homepage hero's top-right corner (22 November 2026, the
 * owner's choice of four static designs): pale lavender continents, with
 * dotted routes curving out from India, in butterfly yellow, to the countries
 * in the community section. Static and decorative (aria-hidden); no script.
 *
 * The continents are public/images/brand/world-map-v1.svg (drawn by
 * scripts/make-world-map.ts); the routes are drawn here on the same 1400 x 640
 * frame (world-map-geometry.ts). Placement and fades are in effects.css
 * (.bca-worldmap). Desktop only: phones and tablets keep the globe badge.
 */
export function WorldMap({ className }: { className?: string }) {
  const home = mapPoint(HOME.lat, HOME.lon);
  const routes = PLACES.map((place) => {
    const end = mapPoint(place.lat, place.lon);
    // Each route bows upwards, more for the longer ones.
    const lift = Math.min(180, Math.hypot(end.x - home.x, end.y - home.y) * 0.28);
    const mid = { x: (home.x + end.x) / 2, y: (home.y + end.y) / 2 - lift };
    return { ...place, end, d: `M${home.x.toFixed(1)} ${home.y.toFixed(1)} Q${mid.x.toFixed(1)} ${mid.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}` };
  });
  return (
    <div aria-hidden className={cn("bca-worldmap", className)}>
      <Image
        src="/images/brand/world-map-v1.svg"
        alt=""
        width={MAP.width}
        height={MAP.height}
        unoptimized
        // Lazy, so phones and tablets (where the map is hidden) never download it.
        loading="lazy"
        className="bca-worldmap__land"
      />
      <svg viewBox={`0 0 ${MAP.width} ${MAP.height}`} className="bca-worldmap__routes">
        <defs>
          {routes.map((route) => (
            <linearGradient
              key={route.name}
              id={`bca-route-${route.name}`}
              gradientUnits="userSpaceOnUse"
              x1={home.x}
              y1={home.y}
              x2={route.end.x}
              y2={route.end.y}
            >
              <stop offset="0" stopColor="var(--color-accent)" />
              <stop offset="1" stopColor="#8f7be0" />
            </linearGradient>
          ))}
        </defs>
        {routes.map((route) => (
          <g key={route.name}>
            <path d={route.d} fill="none" stroke={`url(#bca-route-${route.name})`} strokeWidth={2.2} strokeDasharray="1 7" strokeLinecap="round" />
            <circle cx={route.end.x} cy={route.end.y} r={10} className="fill-lav-deep" fillOpacity={0.15} />
            <circle cx={route.end.x} cy={route.end.y} r={5} className="fill-lav-deep" stroke="#fff" strokeWidth={1.5} />
          </g>
        ))}
        <circle cx={home.x} cy={home.y} r={22} className="fill-accent" fillOpacity={0.2} />
        <circle cx={home.x} cy={home.y} r={7.5} className="fill-accent" stroke="#fff" strokeWidth={2.5} />
      </svg>
    </div>
  );
}
