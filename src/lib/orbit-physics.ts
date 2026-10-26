// Units: distance in AU, time in years. GM_sun = 4π² AU³/yr².
export const GM = 4 * Math.PI * Math.PI;
export const KMS_PER_AUYR = 4.740470463; // 1 AU/yr in km/s
export const EARTH_V_KMS = 29.8;
export const SUN_RADIUS_AU = 0.00465;
/** Visual sun radius in AU used for collision in the (scaled) scene. */
export const SUN_COLLIDE_AU = 0.09;

export type Body = { x: number; y: number; vx: number; vy: number };

export const kmsToAuyr = (v: number) => v / KMS_PER_AUYR;
export const auyrToKms = (v: number) => v * KMS_PER_AUYR;

export function escapeSpeedKms(rAU: number) {
  return auyrToKms(Math.sqrt((2 * GM) / rAU));
}

/** Velocity-Verlet step; gravity can be switched off. */
export function step(b: Body, dt: number, gravity: boolean) {
  const acc = (x: number, y: number): [number, number] => {
    if (!gravity) return [0, 0];
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);
    const k = -GM / (r2 * r);
    return [k * x, k * y];
  };
  const [ax, ay] = acc(b.x, b.y);
  b.vx += 0.5 * ax * dt;
  b.vy += 0.5 * ay * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  const [ax2, ay2] = acc(b.x, b.y);
  b.vx += 0.5 * ax2 * dt;
  b.vy += 0.5 * ay2 * dt;
}

export type OrbitInfo = {
  kind: "circular" | "elliptic" | "parabolic" | "hyperbolic" | "collision" | "free";
  e: number;
  a: number; // AU (Infinity if unbound)
  periAU: number;
  apoAU: number; // Infinity if unbound
  periodYr: number; // Infinity if unbound
  energy: number;
};

export function orbitInfo(b: Body, gravity = true): OrbitInfo {
  const r = Math.hypot(b.x, b.y);
  const v2 = b.vx * b.vx + b.vy * b.vy;
  const h = b.x * b.vy - b.y * b.vx;
  const energy = v2 / 2 - GM / r;
  if (!gravity) return { kind: "free", e: NaN, a: Infinity, periAU: NaN, apoAU: Infinity, periodYr: Infinity, energy };
  const e = Math.sqrt(Math.max(0, 1 + (2 * energy * h * h) / (GM * GM)));
  const p = (h * h) / GM;
  const peri = p / (1 + e);
  if (peri < SUN_COLLIDE_AU) {
    const a = energy < 0 ? -GM / (2 * energy) : Infinity;
    return { kind: "collision", e, a, periAU: peri, apoAU: energy < 0 ? a * (1 + e) : Infinity, periodYr: energy < 0 ? Math.sqrt(a ** 3) : Infinity, energy };
  }
  if (Math.abs(e - 1) < 1e-3) return { kind: "parabolic", e, a: Infinity, periAU: peri, apoAU: Infinity, periodYr: Infinity, energy };
  if (e > 1) return { kind: "hyperbolic", e, a: Infinity, periAU: peri, apoAU: Infinity, periodYr: Infinity, energy };
  const a = -GM / (2 * energy);
  return { kind: e < 0.01 ? "circular" : "elliptic", e, a, periAU: a * (1 - e), apoAU: a * (1 + e), periodYr: Math.sqrt(a ** 3), energy };
}

/** Equilibrium surface temperature (K) scaled from Earth's real mean ≈ 288 K at 1 AU. */
export function surfaceTempK(rAU: number) {
  return 288 / Math.sqrt(Math.max(rAU, 0.05));
}

/** Set speed magnitude (km/s) and flight-path angle (deg, 0 = tangential) at current position. */
export function setVelocity(b: Body, speedKms: number, angleDeg: number) {
  const r = Math.hypot(b.x, b.y);
  const tx = -b.y / r, ty = b.x / r; // prograde tangent
  const rx = b.x / r, ry = b.y / r; // radial outward
  const a = (angleDeg * Math.PI) / 180;
  const v = kmsToAuyr(speedKms);
  b.vx = v * (Math.cos(a) * tx + Math.sin(a) * rx);
  b.vy = v * (Math.cos(a) * ty + Math.sin(a) * ry);
}
