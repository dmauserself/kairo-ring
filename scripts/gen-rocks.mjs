// Generates the monochrome cliff textures used at the edges of the hero.
// Pure Node (no deps): faceted Voronoi stone + strata + grain → heightmap,
// then lit with diffuse, specular and cavity occlusion, cut out with a jagged
// silhouette and a soft cast shadow. Output: grey+alpha PNG.
// Usage: node scripts/gen-rocks.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const W = 1300;
const H = 2300;

/* ---------- noise ---------- */
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePerlin(seed) {
  const r = rng(seed);
  const p = new Uint8Array(512);
  const base = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h, x, y) => {
    const g = h & 7;
    const u = g < 4 ? x : y;
    const v = g < 4 ? y : x;
    return (g & 1 ? -u : u) + (g & 2 ? -2 * v : 2 * v);
  };
  return (x, y) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const a = p[X] + Y;
    const b = p[X + 1] + Y;
    const l1 = grad(p[a], x, y) + u * (grad(p[b], x - 1, y) - grad(p[a], x, y));
    const l2 = grad(p[a + 1], x, y - 1) + u * (grad(p[b + 1], x - 1, y - 1) - grad(p[a + 1], x, y - 1));
    return (l1 + v * (l2 - l1)) * 0.35;
  };
}

const fbm = (f, x, y, oct, lac = 2.03, gain = 0.5) => {
  let a = 1;
  let s = 0;
  for (let o = 0; o < oct; o++) {
    s += a * f(x, y);
    x *= lac;
    y *= lac;
    a *= gain;
  }
  return s;
};

// integer hash → [0,1)
function hash2(ix, iy, s) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(s, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Faceted stone: every Voronoi cell is a flat, randomly tilted plane, so the
 * surface breaks into chiselled faces with sharp ridges; cell borders become cracks.
 */
function facets(x, y, seed, tilt, crack) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  let f1 = 1e9;
  let f2 = 1e9;
  let bx = 0;
  let by = 0;
  let cx = 0;
  let cy = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const gx = ix + i;
      const gy = iy + j;
      const px = gx + hash2(gx, gy, seed);
      const py = gy + hash2(gx, gy, seed + 17);
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d < f1) {
        f2 = f1;
        f1 = d;
        bx = gx;
        by = gy;
        cx = px;
        cy = py;
      } else if (d < f2) f2 = d;
    }
  }
  const gxv = (hash2(bx, by, seed + 31) - 0.5) * 2 * tilt;
  const gyv = (hash2(bx, by, seed + 47) - 0.35) * 2 * tilt; // faces lean downward like a cliff
  const off = hash2(bx, by, seed + 59) * 0.5;
  let h = gxv * (x - cx) + gyv * (y - cy) + off;
  const edge = Math.sqrt(f2) - Math.sqrt(f1);
  h -= crack * Math.max(0, 1 - edge / 0.07) ** 2;
  return h;
}

/* ---------- image helpers ---------- */
function blur(src, w, h, r, passes = 3) {
  const a = Float32Array.from(src);
  const b = new Float32Array(a.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      let acc = 0;
      const row = y * w;
      for (let x = -r; x <= r; x++) acc += a[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        b[row + x] = acc / (2 * r + 1);
        acc += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += b[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc / (2 * r + 1);
        acc += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x];
      }
    }
  }
  return a;
}

function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function png(width, height, ga) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 4; // grey + alpha
  const stride = width * 2 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < width * 2; x++) raw[y * stride + 1 + x] = ga[y * width * 2 + x];
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- the cliff ---------- */
function cliff(seed, file, base = 0, from = 0.6, to = 0.8) {
  const n = makePerlin(seed);
  const n2 = makePerlin(seed + 101);
  const n3 = makePerlin(seed + 707);
  const S = 1 / 330; // pixels → world units
  const N = W * H;

  // 1. heightmap: big sculpted masses + ridges + chipped planes + grain
  const hm = new Float32Array(N);
  const albedo = new Float32Array(N);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x * S;
      const py = y * S * 0.72; // slight vertical stretch: cliffs are taller than wide
      const wx = px + 0.5 * fbm(n2, px * 0.5, py * 0.5, 4);
      const wy = py + 0.5 * fbm(n2, px * 0.5 + 7.1, py * 0.5 + 2.3, 4);
      let h = 1.0 * fbm(n, wx * 0.55, wy * 0.55, 5);
      let r = 0;
      let a = 0.5;
      let f = 1.4;
      let prev = 1;
      for (let o = 0; o < 6; o++) {
        let v = 1 - Math.abs(n3(wx * f + o * 3.1, wy * f));
        v = v * v * prev;
        prev = Math.min(1, v * 1.8);
        r += a * v;
        f *= 2.07;
        a *= 0.5;
      }
      h += 0.55 * r;
      h += 0.06 * facets(wx * 1.6, wy * 1.6, seed, 0.9, 0.0); // a few broad chipped planes
      h += 0.035 * fbm(n2, px * 22, py * 22, 3);
      hm[y * W + x] = h;
      albedo[y * W + x] = 0.8 + 0.2 * fbm(n3, px * 0.8 + 3, py * 0.8, 4);
    }
  }

  // soften facet seams by a pixel so normals don't alias into dotted lines
  hm.set(blur(hm, W, H, 1, 1));

  // 2. occlusion: cavities (fine) and large-scale recesses
  const fine = blur(hm, W, H, 6, 2);
  const coarse = blur(hm, W, H, 40, 3);
  const macro = blur(hm, W, H, 10, 3); // for large-form lighting

  // 3. silhouette field (jagged, follows the big facets)
  const mask = new Float32Array(N);
  for (let y = 0; y < H; y++) {
    const ty = y / H;
    for (let x = 0; x < W; x++) {
      const px = x * S;
      const py = y * S;
      mask[y * W + x] =
        (1 - x / W) * 1.2 +
        0.34 * fbm(n3, px * 0.45 + 11, py * 0.35, 6) +
        0.06 * hm[y * W + x] +
        0.1 * Math.sin(py * 1.1 + seed) +
        base * Math.sin(Math.PI * Math.min(1, Math.max(0, (ty - from) / (to - from)))) ** 0.6 * (ty > to ? (to >= 1 ? 1 : 0) : 1) -
        0.68;
    }
  }
  // self-shadow: march from each pixel toward the light; blocked → in shadow
  const HS = 150; // height units → pixels
  const lx = 0.72;
  const ly = -0.69;
  const rise = 0.55; // tan of the light's elevation
  const occl = new Float32Array(N);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const h0 = hm[i] * HS;
      let lit = 1;
      for (let st = 1; st <= 28; st++) {
        const d = st * st * 0.9 + st * 2;
        const sx = Math.round(x + lx * d);
        const sy = Math.round(y + ly * d);
        if (sx < 0 || sy < 0 || sx >= W || sy >= H) break;
        const over = hm[sy * W + sx] * HS - (h0 + d * rise);
        if (over > 0) {
          lit = Math.min(lit, Math.max(0, 1 - over / 18));
          if (lit === 0) break;
        }
      }
      occl[i] = lit;
    }
  }
  const soft = blur(occl, W, H, 2, 2);

  const shadowSrc = new Float32Array(N);
  for (let i = 0; i < N; i++) shadowSrc[i] = mask[i] > 0 ? 1 : 0;
  const shadow = blur(shadowSrc, W, H, 22, 3);

  // 4. light it
  const L = [0.62, -0.6, 0.5];
  const ll = Math.hypot(...L);
  for (let k = 0; k < 3; k++) L[k] /= ll;
  const Hh = [L[0], L[1], L[2] + 1];
  const hl = Math.hypot(...Hh);
  for (let k = 0; k < 3; k++) Hh[k] /= hl;
  const strength = (1 / (2 * S)) * 0.085;

  const out = new Uint8ClampedArray(N * 2);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const m = mask[i];
      // soft cast shadow on the paper, offset away from the light
      const sx = Math.max(0, x - 26);
      const sy = Math.min(H - 1, y + 18);
      const sh = shadow[sy * W + sx] * 0.32;
      if (m <= 0) {
        out[i * 2] = 0;
        out[i * 2 + 1] = Math.round(sh * 255);
        continue;
      }
      const xl = hm[i - (x > 0 ? 1 : 0)];
      const xr = hm[i + (x < W - 1 ? 1 : 0)];
      const yu = hm[i - (y > 0 ? W : 0)];
      const yd = hm[i + (y < H - 1 ? W : 0)];
      const nx = -(xr - xl) * strength;
      const ny = -(yd - yu) * strength;
      const nl = Math.hypot(nx, ny, 1);
      const Nx = nx / nl;
      const Ny = ny / nl;
      const Nz = 1 / nl;
      const diff = Math.max(0, Nx * L[0] + Ny * L[1] + Nz * L[2]);
      // big sculptural volumes, lit separately and multiplied in
      const mxl = macro[i - (x > 1 ? 2 : 0)];
      const mxr = macro[i + (x < W - 2 ? 2 : 0)];
      const myu = macro[i - (y > 1 ? 2 * W : 0)];
      const myd = macro[i + (y < H - 2 ? 2 * W : 0)];
      const mnx = -(mxr - mxl) * strength * 3.2;
      const mny = -(myd - myu) * strength * 3.2;
      const mnl = Math.hypot(mnx, mny, 1);
      const macroDiff = Math.max(0, (mnx * L[0] + mny * L[1] + L[2]) / mnl);
      const spec = Math.pow(Math.max(0, Nx * Hh[0] + Ny * Hh[1] + Nz * Hh[2]), 38) * 0.35;
      const cavity = Math.min(1, Math.max(0.2, 1 - (fine[i] - hm[i]) * 4));
      const recess = Math.min(1, Math.max(0.3, 0.8 + (hm[i] - coarse[i]) * 1.1));
      const depth = Math.min(1, Math.max(0, m) * 2.2); // deeper into the rock → darker
      let c = (0.25 + 1.0 * Math.pow(macroDiff, 1.4)) * albedo[i] * (0.04 + 0.96 * Math.pow(diff, 1.7) * (0.12 + 0.88 * soft[i])) * cavity * recess + spec * cavity * soft[i];
      c *= 1 - 0.72 * depth;
      c = Math.max(0, c * 1.95);
      c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14); // filmic curve
      let g = Math.min(1, c);
      g = g + 0.35 * (g * g * (3 - 2 * g) - g); // photographic S-curve
      const a = Math.min(1, m / 0.004);
      out[i * 2] = Math.round(g * 245);
      out[i * 2 + 1] = Math.round((a + (1 - a) * sh) * 255);
    }
  }
  writeFileSync(file, png(W, H, out));
  if (process.env.PREVIEW) {
    // composite over the hero's paper colour for a quick look
    const prev = new Uint8ClampedArray(N * 2);
    for (let i = 0; i < N; i++) {
      const a = out[i * 2 + 1] / 255;
      prev[i * 2] = out[i * 2] * a + 236 * (1 - a);
      prev[i * 2 + 1] = 255;
    }
    writeFileSync(process.env.PREVIEW + '/' + file.split('/').pop(), png(W, H, prev));
  }
  console.log('wrote', file);
}

mkdirSync('public/img', { recursive: true });
cliff(7, 'public/img/stone-l.png', 0.42, 0.4, 1.6);
cliff(23, 'public/img/stone-r.png', 0.28, 0.3, 0.62);
