import { describe, it, expect } from "vitest";
import { orbitInfo, setVelocity, escapeSpeedKms, step, type Body } from "@/lib/orbit-physics";

const at = (v: number, ang = 0): Body => { const b = { x: 1, y: 0, vx: 0, vy: 0 }; setVelocity(b, v, ang); return b; };

describe("orbit physics", () => {
  it("29.8 km/s at 1 AU is a near-circular closed orbit", () => {
    const o = orbitInfo(at(29.8));
    expect(["circular", "elliptic"]).toContain(o.kind);
    expect(o.e).toBeLessThan(0.01);
    expect(o.periodYr).toBeGreaterThan(0.98);
    expect(o.periodYr).toBeLessThan(1.02);
  });
  it("escape speed at 1 AU is about 42.1 km/s", () => {
    expect(escapeSpeedKms(1)).toBeGreaterThan(41.9);
    expect(escapeSpeedKms(1)).toBeLessThan(42.3);
  });
  it("a small speed increase does not escape", () => {
    expect(orbitInfo(at(33)).kind).toBe("elliptic");
  });
  it("above escape speed the path is open", () => {
    expect(orbitInfo(at(43)).kind).toBe("hyperbolic");
  });
  it("a moderate decrease gives a smaller orbit, not a collision", () => {
    const o = orbitInfo(at(20));
    expect(o.kind).toBe("elliptic");
    expect(o.periAU).toBeLessThan(1);
  });
  it("near-zero speed collides with the sun", () => {
    expect(orbitInfo(at(1)).kind).toBe("collision");
  });
  it("without gravity the earth moves in a straight line", () => {
    const b = at(29.8);
    step(b, 0.1, false);
    expect(b.x).toBeCloseTo(1);
  });
});
