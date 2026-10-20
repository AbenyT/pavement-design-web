// Material textures for the pavement cross-section, drawn as seamless SVG <pattern>s.
// Shapes come from a seeded random generator, so the server and browser draw identical textures.
import type { ReactElement } from 'react';

export type MaterialKey = 'ac' | 'dbm' | 'base' | 'subbase' | 'capping' | 'subgrade';

export interface Material {
  /** Short material description shown in labels and the legend. */
  material: string;
  /** Representative colour (legend fallback, side faces). */
  color: string;
}

export const MATERIALS: Record<MaterialKey, Material> = {
  ac: { material: 'HMA wearing course', color: '#26262a' },
  dbm: { material: 'DBM binder course', color: '#332f2c' },
  base: { material: 'Crushed stone', color: '#7d7f83' },
  subbase: { material: 'Natural gravel', color: '#9f8d76' },
  capping: { material: 'Selected fill (lateritic)', color: '#9a4a2b' },
  subgrade: { material: 'Natural soil', color: '#5a4230' },
};

/** Small, fast, seeded PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (v: number) => Math.round(v * 100) / 100;

interface Spec {
  w: number;
  h: number;
  bg: string;
  seed: number;
  /** Angular stones (crushed aggregate). */
  angular?: { count: number; r: [number, number]; colors: string[]; stroke?: string };
  /** Rounded / sub-angular stones (gravel, nodules). */
  rounded?: { count: number; r: [number, number]; colors: string[]; stroke?: string; squash?: [number, number] };
  /** Fine particles. */
  fines?: { count: number; r: [number, number]; colors: string[] };
  /** Faint horizontal compaction lines. */
  lines?: { count: number; color: string };
}

const SPECS: Record<MaterialKey, Spec> = {
  ac: {
    w: 48, h: 32, bg: '#252528', seed: 11,
    fines: { count: 130, r: [0.3, 0.85], colors: ['#55555b', '#6e6e75', '#3a3a3f', '#8b8b92', '#19191c', '#4a4a50'] },
    angular: { count: 9, r: [0.9, 1.6], colors: ['#47474d', '#5c5c63', '#3d3d42'] },
  },
  dbm: {
    w: 96, h: 60, bg: '#332f2c', seed: 23,
    angular: { count: 95, r: [1.2, 3.4], colors: ['#4e4844', '#625b56', '#3b3633', '#716964', '#57504b'], stroke: '#1d1a18' },
    fines: { count: 220, r: [0.3, 0.8], colors: ['#5c5652', '#77706b', '#1c1a19'] },
  },
  base: {
    w: 128, h: 84, bg: '#7b7d81', seed: 37,
    angular: { count: 120, r: [2, 6], colors: ['#94969a', '#6a6c70', '#a9abae', '#5c5e62', '#85878b', '#9fa1a4', '#73757a'], stroke: '#4a4c50' },
    fines: { count: 260, r: [0.35, 0.8], colors: ['#66686c', '#a3a5a8', '#55575b'] },
  },
  subbase: {
    w: 128, h: 84, bg: '#9f8d76', seed: 53,
    rounded: { count: 95, r: [1.4, 4.6], colors: ['#8c7b64', '#b3a289', '#77674f', '#a6967e', '#94846c', '#ab9a80', '#857560'], stroke: '#6b5c47', squash: [0.6, 0.95] },
    fines: { count: 300, r: [0.3, 0.75], colors: ['#8f7e67', '#b8a78f', '#7a6a54'] },
  },
  capping: {
    w: 96, h: 64, bg: '#974729', seed: 71,
    rounded: { count: 90, r: [0.8, 2.2], colors: ['#7b3518', '#b45c37', '#5f2812', '#c06a42', '#8c3f20'], squash: [0.75, 1] },
    fines: { count: 180, r: [0.3, 0.7], colors: ['#a9532f', '#7e3619', '#c87650'] },
    lines: { count: 3, color: '#86391b' },
  },
  subgrade: {
    w: 64, h: 44, bg: '#584030', seed: 89,
    fines: { count: 110, r: [0.35, 1], colors: ['#6d5240', '#4a3424', '#7a5e49', '#3d2a1d', '#63493a'] },
    rounded: { count: 7, r: [1, 2.4], colors: ['#7f6a58', '#6a5544'], squash: [0.6, 0.9] },
  },
};

/** Draws `shape(dx, dy)` once per tile copy it overlaps, so shapes cut by an edge reappear on the opposite edge. */
function wrapped(x: number, y: number, r: number, w: number, h: number, shape: (dx: number, dy: number, k: string) => ReactElement) {
  const out: ReactElement[] = [];
  for (const dx of [-w, 0, w]) {
    for (const dy of [-h, 0, h]) {
      if (x + dx + r > 0 && x + dx - r < w && y + dy + r > 0 && y + dy - r < h) out.push(shape(dx, dy, `${dx}:${dy}`));
    }
  }
  return out;
}

function tileContent(spec: Spec): ReactElement[] {
  const rand = rng(spec.seed);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const between = ([a, b]: [number, number]) => a + rand() * (b - a);
  const out: ReactElement[] = [<rect key="bg" width={spec.w} height={spec.h} fill={spec.bg} />];

  if (spec.lines) {
    for (let i = 0; i < spec.lines.count; i++) {
      const y = r2(((i + 0.5) / spec.lines.count) * spec.h + (rand() - 0.5) * 4);
      out.push(<line key={`l${i}`} x1={0} x2={spec.w} y1={y} y2={y} stroke={spec.lines.color} strokeWidth={0.5} opacity={0.35} />);
    }
  }

  if (spec.fines) {
    const f = spec.fines;
    for (let i = 0; i < f.count; i++) {
      const x = rand() * spec.w, y = rand() * spec.h, r = between(f.r), fill = pick(f.colors);
      out.push(...wrapped(x, y, r, spec.w, spec.h, (dx, dy, k) =>
        <circle key={`f${i}${k}`} cx={r2(x + dx)} cy={r2(y + dy)} r={r2(r)} fill={fill} />));
    }
  }

  if (spec.rounded) {
    const s = spec.rounded;
    for (let i = 0; i < s.count; i++) {
      const x = rand() * spec.w, y = rand() * spec.h, rx = between(s.r);
      const ry = rx * (s.squash ? between(s.squash) : 1), angle = Math.round(rand() * 180), fill = pick(s.colors);
      out.push(...wrapped(x, y, rx, spec.w, spec.h, (dx, dy, k) => (
        <ellipse key={`e${i}${k}`} cx={r2(x + dx)} cy={r2(y + dy)} rx={r2(rx)} ry={r2(ry)} fill={fill}
          transform={`rotate(${angle} ${r2(x + dx)} ${r2(y + dy)})`}
          stroke={s.stroke} strokeWidth={s.stroke ? 0.45 : undefined} strokeOpacity={0.7} />
      )));
    }
  }

  if (spec.angular) {
    const s = spec.angular;
    for (let i = 0; i < s.count; i++) {
      const x = rand() * spec.w, y = rand() * spec.h, r = between(s.r), fill = pick(s.colors);
      const sides = 4 + Math.floor(rand() * 3), start = rand() * Math.PI * 2;
      const offsets = Array.from({ length: sides }, (_, j) => {
        const a = start + (j / sides) * Math.PI * 2 + (rand() - 0.5) * 0.6, rr = r * (0.6 + rand() * 0.4);
        return [Math.cos(a) * rr, Math.sin(a) * rr * 0.8];
      });
      out.push(...wrapped(x, y, r, spec.w, spec.h, (dx, dy, k) => (
        <polygon key={`p${i}${k}`} fill={fill} stroke={s.stroke} strokeWidth={s.stroke ? 0.5 : undefined} strokeOpacity={0.65}
          strokeLinejoin="round" points={offsets.map(([px, py]) => `${r2(x + dx + px)},${r2(y + dy + py)}`).join(' ')} />
      )));
    }
  }
  return out;
}

// Built once per module load: identical on server and client.
const TILES = Object.fromEntries(
  (Object.keys(SPECS) as MaterialKey[]).map((key) => [key, tileContent(SPECS[key])]),
) as Record<MaterialKey, ReactElement[]>;

/** Pattern ids must be unique per drawing (several drawings can be on one page). */
export const patternId = (prefix: string, key: MaterialKey) => `${prefix}-tex-${key}`;

/** <defs> with one pattern per material, plus shading gradients used by the cross-section. */
export function PavementDefs({ prefix, scale = 1 }: { prefix: string; scale?: number }) {
  return (
    <defs>
      {(Object.keys(SPECS) as MaterialKey[]).map((key) => (
        <pattern key={key} id={patternId(prefix, key)} patternUnits="userSpaceOnUse"
          width={SPECS[key].w * scale} height={SPECS[key].h * scale}>
          <g transform={scale === 1 ? undefined : `scale(${scale})`}>{TILES[key]}</g>
        </pattern>
      ))}
      {/* Smoother, slightly lit top of the asphalt. */}
      <linearGradient id={`${prefix}-sheen`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.04" />
      </linearGradient>
      {/* Subgrade fades out toward the bottom. */}
      <linearGradient id={`${prefix}-fade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="1" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0.85" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <mask id={`${prefix}-fade-mask`} maskContentUnits="objectBoundingBox">
        <rect width="1" height="1" fill={`url(#${prefix}-fade)`} />
      </mask>
    </defs>
  );
}
