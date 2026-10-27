// Decorative solar-system planets: visual only, no physics.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { S } from "./sim-state";

type P = { name: string; au: number; r: number; colors: string[]; bands?: boolean; ring?: [number, number, string]; tilt?: number; phase: number };

// Radii exaggerated so every planet is clearly visible on a phone screen.
const PLANETS: P[] = [
  { name: "mercury", au: 0.39, r: 0.62, colors: ["#8c8379", "#b5aa9c", "#6e665e"], phase: 1.2 },
  { name: "venus", au: 0.72, r: 1.15, colors: ["#e8c98a", "#d9b06a", "#f3dcaa"], phase: 3.9 },
  { name: "mars", au: 1.52, r: 0.85, colors: ["#c1440e", "#a0380f", "#d9693a"], phase: 0.6 },
  { name: "jupiter", au: 5.2, r: 3.4, colors: ["#d8b48a", "#a8754e", "#efe0c8", "#b98a62"], bands: true, phase: 2.4 },
  { name: "saturn", au: 9.58, r: 2.9, colors: ["#e3cf9c", "#c9ae74", "#f1e3bd"], bands: true, ring: [1.45, 2.5, "#e0cba0"], tilt: 0.47, phase: 5.1 },
  { name: "uranus", au: 19.2, r: 2.1, colors: ["#9fe3ea", "#86d0da", "#b8eef2"], ring: [1.4, 1.75, "#c7eff4"], tilt: 1.7, phase: 4.2 },
  { name: "neptune", au: 30.05, r: 2.0, colors: ["#3f66d8", "#2c4fb8", "#5a80e6"], bands: true, phase: 0.2 },
];

// Orbit distances compressed (power ~0.45) so the outer planets sit near enough to see,
// while Earth (au = 1) still lands exactly on its physics orbit at S units.
export const orbitR = (au: number) => S * Math.pow(au, 0.45);
// Distance from the Sun that frames the whole planetary system (Neptune + margin).
export const PLANET_SPAN = orbitR(30.05) * 1.15;

function makeTex(colors: string[], bands?: boolean) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = colors[0]!; g.fillRect(0, 0, 512, 256);
  if (bands) {
    for (let y = 0; y < 256; y += 4 + Math.random() * 10) {
      g.fillStyle = colors[Math.floor(Math.random() * colors.length)]!;
      g.globalAlpha = 0.5 + Math.random() * 0.5;
      g.fillRect(0, y, 512, 3 + Math.random() * 12);
    }
  } else {
    for (let i = 0; i < 900; i++) {
      g.fillStyle = colors[Math.floor(Math.random() * colors.length)]!;
      g.globalAlpha = 0.25 + Math.random() * 0.4;
      g.beginPath();
      g.arc(Math.random() * 512, Math.random() * 256, 2 + Math.random() * 14, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Planet({ p }: { p: P }) {
  const grp = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => makeTex(p.colors, p.bands), [p]);
  const R = orbitR(p.au);
  const line = Math.max(0.04, R * 0.0025);
  const speed = 0.6 / Math.pow(p.au, 1.5); // Kepler-ish, visual
  const ang = useRef(p.phase);
  useFrame((_, d) => {
    const dt = Math.min(d, 0.05);
    ang.current += speed * dt;
    if (grp.current) grp.current.position.set(Math.cos(ang.current) * R, 0, -Math.sin(ang.current) * R);
    if (body.current) body.current.rotation.y += dt * 0.6;
  });
  return (
    <>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[R - line, R + line, 512]} />
        <meshBasicMaterial color="#9db6d8" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <group ref={grp}>
        <group rotation-z={p.tilt ?? 0.1}>
          <mesh ref={body}>
            <sphereGeometry args={[p.r, 64, 48]} />
            <meshStandardMaterial
              map={tex}
              roughness={0.85}
              metalness={0}
              emissive={new THREE.Color(p.colors[0]!)}
              emissiveIntensity={0.22}
              emissiveMap={tex}
            />
          </mesh>
          {p.ring && (
            <mesh rotation-x={-Math.PI / 2}>
              <ringGeometry args={[p.r * p.ring[0], p.r * p.ring[1], 128]} />
              <meshStandardMaterial color={p.ring[2]} transparent opacity={0.85} side={THREE.DoubleSide} roughness={1} emissive={p.ring[2]} emissiveIntensity={0.15} />
            </mesh>
          )}
        </group>
      </group>
    </>
  );
}

export function Planets() {
  return (
    <>
      {PLANETS.map((p) => <Planet key={p.name} p={p} />)}
    </>
  );
}
