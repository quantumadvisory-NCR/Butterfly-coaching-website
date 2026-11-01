/**
 * Draws the turning globe of the "Live online" badge on a canvas: a lit
 * ocean sphere with pale continents from a 1-degree land mask, a gloss, two
 * rims and a yellow marker on Jaipur that pulses while the globe turns.
 * Visitors can drag it to spin. Ported from the owner's globe-badge.html
 * (1 November 2026); the drawing is unchanged.
 *
 * It pauses while off screen and does not turn for anyone who prefers
 * reduced motion. Returns a function that stops it.
 */
export function startGlobe(canvas: HTMLCanvasElement, maskBase64: string, opts: { size?: number; tilt?: number; startLon?: number; speed?: number; marker?: boolean } = {}) {
  const MW = 360;
  const MH = 180;
  const bin = atob(maskBase64);
  const mask = new Uint8Array(MW * MH);
  for (let i = 0; i < MW * MH; i++) mask[i] = (bin.charCodeAt(i >> 2) >> (6 - 2 * (i & 3))) & 3;

  const cssSize = opts.size || canvas.clientWidth || 140;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const S = Math.round(cssSize * dpr);
  canvas.width = S;
  canvas.height = S;
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const C = S / 2;
  const R = S / 2 - 0.5;
  const unit = S / 140;
  const tilt = ((opts.tilt ?? 18) * Math.PI) / 180;
  const st = Math.sin(tilt);
  const ct = Math.cos(tilt);
  let lx = -0.5;
  let ly = 0.55;
  let lz = 0.68;
  const ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
  lx /= ll;
  ly /= ll;
  lz /= ll;
  const DEG = 180 / Math.PI;

  // Pre-compute, for every pixel of the disc, where it lands on the map.
  const shadowOff = 2.4 * unit;
  let list: number[] | null = [];
  const inv = (dx: number, dy: number) => {
    let x = dx / R;
    let y = -dy / R;
    let rr = x * x + y * y;
    if (rr > 1) {
      const k = 1 / Math.sqrt(rr);
      x *= k;
      y *= k;
      rr = 1;
    }
    const z = Math.sqrt(Math.max(0, 1 - rr));
    let s = z * st + y * ct;
    if (s > 1) s = 1;
    if (s < -1) s = -1;
    return [90 - Math.asin(s) * DEG - 0.5, Math.atan2(x, z * ct - y * st) * DEG, x, y, z] as const;
  };
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const dx = px + 0.5 - C;
      const dy = py + 0.5 - C;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > R + 0.5) continue;
      const a = inv(dx, dy);
      const b = inv(dx - shadowOff, dy - shadowOff);
      list.push(py * S + px, Math.min(1, R + 0.5 - dist), a[0], a[1], b[0], b[1], a[2], a[3], a[4]);
    }
  }
  const N = list.length / 9;
  const pix = new Int32Array(N);
  const alpha = new Uint8ClampedArray(N);
  const fy = new Float32Array(N);
  const dl = new Float32Array(N);
  const sfy = new Float32Array(N);
  const sdl = new Float32Array(N);
  const oR = new Float32Array(N);
  const oG = new Float32Array(N);
  const oB = new Float32Array(N);
  const lR = new Float32Array(N);
  const lG = new Float32Array(N);
  const lB = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    const o = n * 9;
    pix[n] = list[o]!;
    alpha[n] = Math.round(list[o + 1]! * 255);
    fy[n] = list[o + 2]!;
    dl[n] = list[o + 3]!;
    sfy[n] = list[o + 4]!;
    sdl[n] = list[o + 5]!;
    const x = list[o + 6]!;
    const y = list[o + 7]!;
    const z = list[o + 8]!;
    const d = Math.max(0, x * lx + y * ly + z * lz);
    let e = Math.min(1, z / 0.45);
    e = e * e * (3 - 2 * e);
    const limb = 0.7 + 0.3 * e;
    const t = Math.pow(d, 1.15);
    oR[n] = (24 + (118 - 24) * t) * limb;
    oG[n] = (74 + (172 - 74) * t) * limb;
    oB[n] = (156 + (240 - 156) * t) * limb;
    const lt = 0.35 + 0.65 * d;
    const lim2 = 0.86 + 0.14 * e;
    lR[n] = (172 + (255 - 172) * lt) * lim2;
    lG[n] = (192 + (255 - 192) * lt) * lim2;
    lB[n] = (226 + (255 - 226) * lt) * lim2;
  }
  list = null;

  const land = (yf: number, xf: number) => {
    let y0 = Math.floor(yf);
    let ty = yf - y0;
    if (y0 < 0) {
      y0 = 0;
      ty = 0;
    }
    if (y0 >= MH - 1) {
      y0 = MH - 1;
      ty = 0;
    }
    const y1 = y0 + 1 < MH ? y0 + 1 : y0;
    let x0 = Math.floor(xf);
    const tx = xf - x0;
    x0 = ((x0 % MW) + MW) % MW;
    const x1 = x0 + 1 === MW ? 0 : x0 + 1;
    const r0 = y0 * MW;
    const r1 = y1 * MW;
    return ((mask[r0 + x0]! * (1 - tx) + mask[r0 + x1]! * tx) * (1 - ty) + (mask[r1 + x0]! * (1 - tx) + mask[r1 + x1]! * tx) * ty) / 3;
  };

  const img = ctx.createImageData(S, S);
  const data = img.data;
  let lon = opts.startLon ?? 78;
  const marker = opts.marker === false ? null : ([26.9, 75.8] as const);

  const draw = (time: number) => {
    const off = lon + 180 - 0.5;
    for (let n = 0; n < N; n++) {
      const f = land(fy[n]!, dl[n]! + off);
      const s = land(sfy[n]!, sdl[n]! + off);
      let k = (f - 0.38) / 0.24;
      k = k < 0 ? 0 : k > 1 ? 1 : k;
      k = k * k * (3 - 2 * k);
      const shade = 1 - 0.3 * s;
      const p = pix[n]! * 4;
      data[p] = oR[n]! * shade + (lR[n]! - oR[n]! * shade) * k;
      data[p + 1] = oG[n]! * shade + (lG[n]! - oG[n]! * shade) * k;
      data[p + 2] = oB[n]! * shade + (lB[n]! - oB[n]! * shade) * k;
      data[p + 3] = alpha[n]!;
    }
    ctx.putImageData(img, 0, 0);

    // Gloss.
    ctx.save();
    ctx.beginPath();
    ctx.arc(C, C, R, 0, Math.PI * 2);
    ctx.clip();
    const g = ctx.createRadialGradient(C - 0.4 * R, C - 0.45 * R, 0, C - 0.4 * R, C - 0.45 * R, 0.85 * R);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(0.45, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();

    // Rims.
    ctx.lineWidth = 1.6 * unit;
    ctx.strokeStyle = "rgba(175,212,255,0.6)";
    ctx.beginPath();
    ctx.arc(C, C, R - 3.6 * unit, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3.4 * unit;
    ctx.strokeStyle = "#1D4C9A";
    ctx.beginPath();
    ctx.arc(C, C, R - 1.7 * unit, 0, Math.PI * 2);
    ctx.stroke();

    // The marker on Jaipur, India.
    if (marker) {
      const phi = marker[0] / DEG;
      const dlam = (marker[1] - lon) / DEG;
      const cp = Math.cos(phi);
      const sp = Math.sin(phi);
      const cd = Math.cos(dlam);
      const mz = st * sp + ct * cp * cd;
      if (mz > 0.08) {
        const mx = C + (R - 4 * unit) * cp * Math.sin(dlam);
        const my = C - (R - 4 * unit) * (ct * sp - st * cp * cd);
        const fade = Math.min(1, (mz - 0.08) / 0.25);
        if (time) {
          const q = (time % 1800) / 1800;
          ctx.globalAlpha = (1 - q) * 0.9 * fade;
          ctx.lineWidth = 1.8 * unit;
          ctx.strokeStyle = "#F6C31C";
          ctx.beginPath();
          ctx.arc(mx, my, (4 + 10 * q) * unit, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = fade;
        ctx.fillStyle = "#F6C31C";
        ctx.strokeStyle = "#16131D";
        ctx.lineWidth = 1.3 * unit;
        ctx.beginPath();
        ctx.arc(mx, my, 4 * unit, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  };

  let reduce = false;
  try {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    reduce = false;
  }
  const speed = opts.speed ?? 10; // degrees per second
  let raf = 0;
  let last = 0;
  let lastDraw = 0;
  let visible = true;
  let dragging: { x: number; lon: number } | null = null;
  let alive = true;

  const loop = (t: number) => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (!visible) {
      last = t;
      return;
    }
    if (last && !dragging && !reduce) lon -= (Math.min(t - last, 100) / 1000) * speed;
    last = t;
    if (t - lastDraw < 32 && !dragging) return;
    lastDraw = t;
    draw(reduce ? 0 : t);
  };
  draw(0);
  raf = requestAnimationFrame(loop);

  let io: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver((entries) => {
      visible = Boolean(entries[0]?.isIntersecting);
    });
    io.observe(canvas);
  }

  const down = (e: PointerEvent) => {
    dragging = { x: e.clientX, lon };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // The pointer may already be gone.
    }
  };
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    lon = dragging.lon - ((e.clientX - dragging.x) / (cssSize / 2)) * DEG * 0.9;
    if (reduce) draw(0);
  };
  const up = () => {
    dragging = null;
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);

  return function stop() {
    alive = false;
    cancelAnimationFrame(raf);
    io?.disconnect();
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
  };
}
