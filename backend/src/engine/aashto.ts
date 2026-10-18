/**
 * AASHTO 1993 flexible pavement equations — pure functions, no I/O.
 *
 * Line-by-line port of the tested Python engine (pavement_design/aashto.py).
 * engine.spec.ts checks this file against 63 designs computed by Python.
 */

/** AASHTO 1993 standard normal deviate ZR for common reliability levels (%). */
export const ZR_TABLE = new Map<number, number>([
  [50, 0.0], [60, -0.253], [70, -0.524], [75, -0.674], [80, -0.841],
  [85, -1.037], [90, -1.282], [91, -1.34], [92, -1.405], [93, -1.476],
  [94, -1.555], [95, -1.645], [96, -1.751], [97, -1.881], [98, -2.045],
  [99, -2.327], [99.9, -3.09], [99.99, -3.75],
]);

/** AASHTO 1993 minimum thickness (inches) of AC and aggregate base by traffic:
 *  [upper W18 limit in millions of ESALs, AC, aggregate base]. */
export const AASHTO_MIN_THICKNESS_IN: ReadonlyArray<[number, number, number]> = [
  [0.05, 1.0, 4.0], [0.15, 2.0, 4.0], [0.5, 2.5, 4.0],
  [2.0, 3.0, 6.0], [7.0, 3.5, 6.0], [Infinity, 4.0, 6.0],
];

/**
 * Inverse of the standard normal CDF (Wichura 1988, algorithm AS241) —
 * the same algorithm and coefficients as Python's statistics.NormalDist.inv_cdf.
 */
export function normalInvCdf(p: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError(`p must be in (0, 1), got ${p}`);
  const q = p - 0.5;
  if (Math.abs(q) <= 0.425) {
    const r = 0.180625 - q * q;
    const num = (((((((2.5090809287301226727e3 * r + 3.3430575583588128105e4) * r
      + 6.7265770927008700853e4) * r + 4.5921953931549871457e4) * r
      + 1.3731693765509461125e4) * r + 1.9715909503065514427e3) * r
      + 1.3314166789178437745e2) * r + 3.387132872796366608) * q;
    const den = (((((((5.226495278852854561e3 * r + 2.8729085735721942674e4) * r
      + 3.930789580009271061e4) * r + 2.1213794301586595867e4) * r
      + 5.3941960214247511077e3) * r + 6.871870074920579083e2) * r
      + 4.2313330701600911252e1) * r + 1.0);
    return num / den;
  }
  let r = q <= 0 ? p : 1 - p;
  r = Math.sqrt(-Math.log(r));
  let num: number;
  let den: number;
  if (r <= 5.0) {
    r -= 1.6;
    num = (((((((7.7454501427834140764e-4 * r + 2.27238449892691845833e-2) * r
      + 2.4178072517745061177e-1) * r + 1.27045825245236838258) * r
      + 3.64784832476320460504) * r + 5.7694972214606914055) * r
      + 4.6303378461565452959) * r + 1.42343711074968357734);
    den = (((((((1.05075007164441684324e-9 * r + 5.475938084995344946e-4) * r
      + 1.51986665636164571966e-2) * r + 1.4810397642748007459e-1) * r
      + 6.8976733498510000455e-1) * r + 1.6763848301838038494) * r
      + 2.05319162663775882187) * r + 1.0);
  } else {
    r -= 5.0;
    num = (((((((2.01033439929228813265e-7 * r + 2.71155556874348757815e-5) * r
      + 1.2426609473880784386e-3) * r + 2.6532189526576123093e-2) * r
      + 2.9656057182850489123e-1) * r + 1.7848265399172913358) * r
      + 5.4637849111641143699) * r + 6.6579046435011037772);
    den = (((((((2.04426310338993978564e-15 * r + 1.4215117583164458887e-7) * r
      + 1.8463183175100546818e-5) * r + 7.868691311456132591e-4) * r
      + 1.48753612908506148525e-2) * r + 1.3692988092273580531e-1) * r
      + 5.9983220655588793769e-1) * r + 1.0);
  }
  const x = num / den;
  return q < 0 ? -x : x;
}

/** Standard normal deviate ZR: AASHTO table value if tabulated, else exact (50–99.99 %). */
export function zR(reliability: number): number {
  if (!(reliability >= 50 && reliability <= 99.99)) {
    throw new RangeError(`Reliability must be between 50 and 99.99 %, got ${reliability}`);
  }
  const tabulated = ZR_TABLE.get(reliability);
  return tabulated !== undefined ? tabulated : normalInvCdf(1 - reliability / 100);
}

/** MR (psi) = lowCbrFactor·CBR if CBR <= thresholdCbr, else mpaToPsi·coefMpa·CBR^exponent. */
export interface MRCorrelation {
  thresholdCbr: number;
  lowCbrFactor: number;
  mpaToPsi: number;
  coefMpa: number;
  exponent: number;
}

export const DEFAULT_CORRELATION: MRCorrelation = {
  thresholdCbr: 5, lowCbrFactor: 1500, mpaToPsi: 145, coefMpa: 17.6, exponent: 0.64,
};

/** Resilient modulus MR (psi) from CBR (%) — for soils and unbound granular layers. */
export function mrFromCbr(cbr: number, c: MRCorrelation = DEFAULT_CORRELATION): number {
  if (cbr > c.thresholdCbr) return c.mpaToPsi * c.coefMpa * cbr ** c.exponent;
  return c.lowCbrFactor * cbr;
}

/** Approximate CBR (%) from MR (psi); inverse of mrFromCbr, for display only. */
export function cbrFromMr(mr: number, c: MRCorrelation = DEFAULT_CORRELATION): number {
  if (mr <= c.lowCbrFactor * c.thresholdCbr) return mr / c.lowCbrFactor;
  return (mr / (c.mpaToPsi * c.coefMpa)) ** (1 / c.exponent);
}

/**
 * AASHTO 1993 design equation as (left side − log10 W18); zero at the required SN.
 * W18 in millions of 18-kip ESALs, MR in psi.
 */
export function designEquation(sn: number, w18: number, mr: number, zr: number, so: number, dpsi: number): number {
  const left = zr * so + 9.36 * Math.log10(sn + 1) - 0.2
    + Math.log10(dpsi / (4.2 - 1.5)) / (0.4 + 1094 / (sn + 1) ** 5.19)
    + 2.32 * Math.log10(mr) - 8.07;
  return left - Math.log10(w18 * 1e6);
}

/**
 * Structural number required on top of a layer with modulus `mr`.
 * The equation increases monotonically with SN, so bisection on [0, snMax]
 * finds the unique root. Returns 0 when SN = 0 already satisfies the design.
 */
export function requiredSn(w18: number, mr: number, zr: number, so: number, dpsi: number, snMax = 50): number {
  for (const [name, value] of [['W18', w18], ['MR', mr], ['dPSI', dpsi]] as const) {
    if (!(value > 0)) throw new RangeError(`${name} must be positive, got ${value}`);
  }
  if (designEquation(0, w18, mr, zr, so, dpsi) >= 0) return 0;
  if (designEquation(snMax, w18, mr, zr, so, dpsi) < 0) {
    throw new RangeError(`Required SN exceeds ${snMax}; check the design inputs`);
  }
  let low = 0;
  let high = snMax;
  while (high - low > 1e-13) {
    const mid = (low + high) / 2;
    if (designEquation(mid, w18, mr, zr, so, dpsi) < 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** AASHTO 1993 practical minimum thickness (mm) for the AC course and aggregate base; 0 otherwise. */
export function aashtoMinimumThicknessMm(layerName: string, w18: number): number {
  for (const [limit, acIn, baseIn] of AASHTO_MIN_THICKNESS_IN) {
    if (w18 <= limit) {
      if (layerName === 'AC Course') return acIn * 25.4;
      if (layerName === 'Base Course') return baseIn * 25.4;
      return 0;
    }
  }
  return 0;
}
