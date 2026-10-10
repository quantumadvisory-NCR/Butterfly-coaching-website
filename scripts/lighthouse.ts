/**
 * Runs Lighthouse against representative pages on a running site and prints
 * the scores. Needs Google Chrome installed.
 *
 *   npm run local:build && npm run local:start        (in one terminal)
 *   npm run lighthouse                                (in another)
 *   npm run lighthouse -- https://www.your-domain.com (against the live site)
 *
 * Results are saved to test-results/lighthouse/.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const PAGES = [
  { name: "home", path: "/" },
  { name: "programmes", path: "/coaching-certifications/" },
  { name: "level-1-acc", path: "/level-1-acc-coach-program/" },
  { name: "article", path: "/the-power-of-habits-cultivating-your-path-to-success/" },
  { name: "contact", path: "/contact-us/" },
];
const MODES = [
  { name: "mobile", flags: [] as string[] },
  { name: "desktop", flags: ["--preset=desktop"] },
];
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"] as const;
const OUT = "test-results/lighthouse";

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter((p): p is string => Boolean(p));
const chrome = chromeCandidates.find((p) => existsSync(p));

mkdirSync(OUT, { recursive: true });
type Row = { page: string; mode: string; scores: Record<string, number>; lcp: string; cls: string; tbt: string };
const rows: Row[] = [];

for (const page of PAGES) {
  for (const mode of MODES) {
    const file = `${OUT}/${page.name}-${mode.name}.json`;
    const args = [
      "--yes",
      "lighthouse",
      `${base}${page.path}`,
      "--quiet",
      "--output=json",
      `--output-path=${file}`,
      `--only-categories=${CATEGORIES.join(",")}`,
      '--chrome-flags="--headless=new --no-first-run"',
      ...mode.flags,
    ];
    const result = spawnSync("npx", args, {
      shell: true,
      stdio: ["ignore", "ignore", "pipe"],
      env: { ...process.env, ...(chrome ? { CHROME_PATH: chrome } : {}) },
    });
    if (result.status !== 0 || !existsSync(file)) {
      console.error(`${page.name} (${mode.name}) failed: ${String(result.stderr ?? "").trim().split("\n").pop()}`);
      continue;
    }
    const report = JSON.parse(readFileSync(file, "utf8"));
    rows.push({
      page: page.name,
      mode: mode.name,
      scores: Object.fromEntries(CATEGORIES.map((c) => [c, Math.round((report.categories[c]?.score ?? 0) * 100)])),
      lcp: report.audits["largest-contentful-paint"]?.displayValue ?? "",
      cls: report.audits["cumulative-layout-shift"]?.displayValue ?? "",
      tbt: report.audits["total-blocking-time"]?.displayValue ?? "",
    });
    const last = rows.at(-1)!;
    console.log(
      `${page.name.padEnd(12)} ${mode.name.padEnd(8)} perf ${String(last.scores.performance).padStart(3)}  a11y ${String(last.scores.accessibility).padStart(3)}  best ${String(last.scores["best-practices"]).padStart(3)}  seo ${String(last.scores.seo).padStart(3)}  LCP ${last.lcp}  CLS ${last.cls}  TBT ${last.tbt}`,
    );
  }
}

writeFileSync(`${OUT}/summary.json`, `${JSON.stringify({ base, measuredAt: new Date().toISOString(), rows }, null, 2)}\n`);
if (rows.length === 0) process.exit(1);
