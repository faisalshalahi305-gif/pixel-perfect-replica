// @ts-nocheck
import * as THREE from "three";
import { setVelocity, step, SUN_COLLIDE_AU, EARTH_V_KMS, orbitInfo, type Body } from "@/lib/orbit-physics";

export const S = 20; // scene units per AU
export const EARTH_R = 0.42; // exaggerated visual radius
export const SUN_R = SUN_COLLIDE_AU * S;

export const toScene = (b: Body, out = new THREE.Vector3()) => out.set(b.x * S, 0, -b.y * S);

export class Trail {
  max = 9000;
  arr = new Float32Array(this.max * 3);
  n = 0;
  geom = new THREE.BufferGeometry();
  attr = new THREE.BufferAttribute(this.arr, 3);
  constructor() {
    this.attr.setUsage(THREE.DynamicDrawUsage);
    this.geom.setAttribute("position", this.attr);
    this.geom.setDrawRange(0, 0);
  }
  push(v: THREE.Vector3) {
    if (this.n > 0) {
      const i = (this.n - 1) * 3;
      const dx = this.arr[i] - v.x, dz = this.arr[i + 2] - v.z;
      if (dx * dx + dz * dz < 0.0225) return;
    }
    if (this.n >= this.max) {
      this.arr.copyWithin(0, 3);
      this.n = this.max - 1;
    }
    this.arr[this.n * 3] = v.x;
    this.arr[this.n * 3 + 1] = v.y;
    this.arr[this.n * 3 + 2] = v.z;
    this.n++;
    this.attr.needsUpdate = true;
    this.geom.setDrawRange(0, this.n);
  }
  clear() {
    this.n = 0;
    this.geom.setDrawRange(0, 0);
  }
  snapshot() {
    return this.arr.slice(0, this.n * 3);
  }
}

export type SimEvent = { x: number; z: number; kind: "speed" | "gravity-off" | "gravity-on"; t: number };

export class Sim {
  earth: Body = { x: 1, y: 0, vx: 0, vy: 0 };
  twin: Body = { x: 1, y: 0, vx: 0, vy: 0 };
  gravity = true;
  twinOn = false;
  twinDv = 0.3;
  running = true;
  timeScale = 0.12; // years per real second
  t = 0;
  collided = { earth: false, twin: false };
  trail = new Trail();
  twinTrail = new Trail();
  prev: Float32Array[] = [];
  events: SimEvent[] = [];
  predict: Float32Array = new Float32Array(0);
  predictTwin: Float32Array = new Float32Array(0);
  predictVersion = 0;
  explosion: { pos: THREE.Vector3; t0: number } | null = null;
  clock = 0;
  changeVersion = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.earth = { x: 1, y: 0, vx: 0, vy: 0 };
    setVelocity(this.earth, EARTH_V_KMS, 0);
    this.gravity = true;
    this.twinOn = false;
    this.t = 0;
    this.collided = { earth: false, twin: false };
    this.trail.clear();
    this.twinTrail.clear();
    this.prev = [];
    this.events = [];
    this.explosion = null;
    this.recompute();
  }

  snapshotPrev() {
    if (this.trail.n > 3) {
      this.prev.push(this.trail.snapshot());
      if (this.prev.length > 3) this.prev.shift();
    }
    this.trail.clear();
  }

  mark(kind: SimEvent["kind"]) {
    const p = toScene(this.earth);
    this.events.push({ x: p.x, z: p.z, kind, t: this.clock });
    if (this.events.length > 6) this.events.shift();
  }

  applyVelocity(speedKms: number, angleDeg: number) {
    if (this.collided.earth) return;
    this.snapshotPrev();
    this.mark("speed");
    setVelocity(this.earth, speedKms, angleDeg);
    this.changeVersion++;
    this.recompute();
  }

  setGravity(on: boolean) {
    if (on === this.gravity) return;
    this.snapshotPrev();
    this.mark(on ? "gravity-on" : "gravity-off");
    this.gravity = on;
    this.changeVersion++;
    this.recompute();
  }

  startTwin(dvKms: number) {
    this.twinDv = dvKms;
    this.twinOn = true;
    this.collided.twin = false;
    const r = Math.hypot(this.earth.x, this.earth.y);
    const sp = Math.hypot(this.earth.vx, this.earth.vy);
    const k = (r + 0.0008) / r;
    this.twin = { x: this.earth.x * k, y: this.earth.y * k, vx: this.earth.vx, vy: this.earth.vy };
    const f = (sp + dvKms / 4.740470463) / sp;
    this.twin.vx *= f;
    this.twin.vy *= f;
    this.twinTrail.clear();
    this.trail.clear();
    this.recompute();
  }

  stopTwin() {
    this.twinOn = false;
    this.twinTrail.clear();
    this.recompute();
  }

  static forecast(b0: Body, gravity: boolean) {
    const b = { ...b0 };
    const o = orbitInfo(b, gravity);
    const pts: number[] = [];
    const h = 0.0015;
    const maxT = gravity && isFinite(o.periodYr) ? Math.min(o.periodYr * 1.002, 12) : 6;
    let t = 0, i = 0;
    while (t < maxT && i < 40000) {
      step(b, h, gravity);
      t += h;
      i++;
      const r = Math.hypot(b.x, b.y);
      if (i % 3 === 0) pts.push(b.x * S, 0, -b.y * S);
      if (gravity && r < SUN_COLLIDE_AU) break;
      if (r > 60) break;
    }
    return new Float32Array(pts);
  }

  recompute() {
    this.predict = this.collided.earth ? new Float32Array(0) : Sim.forecast(this.earth, this.gravity);
    this.predictTwin = this.twinOn && !this.collided.twin ? Sim.forecast(this.twin, this.gravity) : new Float32Array(0);
    this.predictVersion++;
  }

  advance(realDt: number) {
    this.clock += realDt;
    if (!this.running) return;
    const dt = realDt * this.timeScale;
    const h = 0.0004;
    const n = Math.min(4000, Math.ceil(dt / h));
    const sub = dt / n;
    const bodies: ["earth" | "twin", Body][] = [["earth", this.earth]];
    if (this.twinOn) bodies.push(["twin", this.twin]);
    for (const [key, b] of bodies) {
      if (this.collided[key]) continue;
      for (let i = 0; i < n; i++) {
        step(b, sub, this.gravity);
        if (this.gravity && Math.hypot(b.x, b.y) < SUN_COLLIDE_AU) {
          this.collided[key] = true;
          if (key === "earth") this.explosion = { pos: toScene(b), t0: this.clock };
          this.recompute();
          break;
        }
      }
    }
    this.t += dt;
  }
}
