// @ts-nocheck
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture, Billboard } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OC } from "three-stdlib";
import { Sim, S, EARTH_R, SUN_R, toScene } from "./sim-state";
import { GM } from "@/lib/orbit-physics";
import dayA from "@/assets/earth_atmos_2048.jpg.asset.json";
import nightA from "@/assets/earth_lights_2048.png.asset.json";
import specA from "@/assets/earth_specular_2048.jpg.asset.json";
import cloudA from "@/assets/earth_clouds_1024.png.asset.json";
import normalA from "@/assets/earth_normal_2048.jpg.asset.json";

export type CamMode = "system" | "follow" | "chase" | "sun" | "free";
export type Show = { trails: boolean; vectors: boolean; predict: boolean; prev: boolean; grid: boolean };

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float fbm(vec3 p){float f=0.,a=.5;for(int i=0;i<5;i++){f+=a*snoise(p);p*=2.03;a*=.5;}return f;}
`;

/* ---------------- Sun ---------------- */
function Sun() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        toneMapped: false,
        vertexShader: `varying vec3 vP;varying vec3 vN;varying vec3 vW;void main(){vP=position;vN=normalize(normalMatrix*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
        fragmentShader: `uniform float uTime;varying vec3 vP;varying vec3 vN;varying vec3 vW;${NOISE}
        void main(){vec3 p=normalize(vP);
          float g=fbm(p*6.+vec3(0.,uTime*.05,0.));
          float c=fbm(p*22.+g*1.6+uTime*.12);
          float spots=smoothstep(.55,.75,fbm(p*2.2+vec3(uTime*.01)));
          float t=clamp(.55+.45*c+.3*g,0.,1.);
          vec3 col=mix(vec3(1.,.28,.02),vec3(1.,.72,.25),t);
          col=mix(col,vec3(1.,.96,.82),pow(t,3.));
          col*=1.-spots*.55;
          float mu=clamp(dot(vN,vec3(0.,0.,1.)),0.,1.);
          col*=.45+.75*pow(mu,.45);
          gl_FragColor=vec4(col*1.55,1.);}`,
      }),
    [],
  );
  const flare = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        vertexShader: `varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `uniform float uTime;varying vec2 vU;${NOISE}
        void main(){vec2 q=vU-.5;float d=length(q)*2.;float a=atan(q.y,q.x);
          float rays=fbm(vec3(cos(a)*3.,sin(a)*3.,uTime*.15))*.5+.5;
          float corona=exp(-(d-.2)*7.)*(.6+.8*rays);
          float halo=exp(-d*2.4)*.55;
          float r=smoothstep(1.,.2,d);
          vec3 col=vec3(1.,.55,.18)*corona+vec3(1.,.8,.5)*halo;
          gl_FragColor=vec4(col*r*.85,1.);}`,
      }),
    [],
  );
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    mat.uniforms.uTime.value += d;
    flare.uniforms.uTime.value += d;
    if (ref.current) ref.current.rotation.y += d * 0.03;
  });
  return (
    <group>
      <mesh ref={ref} material={mat}>
        <sphereGeometry args={[SUN_R, 96, 96]} />
      </mesh>
      <Billboard>
        <mesh material={flare} scale={SUN_R * 7}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      </Billboard>
      <pointLight intensity={4.2} decay={0} distance={0} color="#fff3e0" />
    </group>
  );
}

/* ---------------- Earth ---------------- */
function useEarthMaterial(tint: THREE.Color) {
  const [day, night, spec, nrm] = useTexture([dayA.url, nightA.url, specA.url, normalA.url]);
  day.colorSpace = THREE.SRGBColorSpace;
  night.colorSpace = THREE.SRGBColorSpace;
  for (const t of [day, night, spec, nrm]) { t.anisotropy = 16; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; }
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uDay: { value: day }, uNight: { value: night }, uSpec: { value: spec }, uNrm: { value: nrm },
          uFreeze: { value: 0 }, uHeat: { value: 0 }, uTint: { value: tint }, uTime: { value: 0 },
        },
        vertexShader: `varying vec2 vU;varying vec3 vN;varying vec3 vW;varying vec3 vT;
          void main(){vU=uv;vN=normalize(mat3(modelMatrix)*normal);vT=normalize(mat3(modelMatrix)*vec3(-sin(uv.x*6.2831853),0.,cos(uv.x*6.2831853)));
          vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
        fragmentShader: `uniform sampler2D uDay,uNight,uSpec,uNrm;uniform float uFreeze,uHeat,uTime;uniform vec3 uTint;
          varying vec2 vU;varying vec3 vN;varying vec3 vW;varying vec3 vT;${NOISE}
          void main(){
            vec3 N=normalize(vN);vec3 T=normalize(vT-N*dot(vT,N));vec3 B=cross(N,T);
            vec3 nm=texture2D(uNrm,vU).xyz*2.-1.;vec3 Np=normalize(T*nm.x*.6+B*nm.y*.6+N*nm.z);
            vec3 L=normalize(-vW);vec3 V=normalize(cameraPosition-vW);
            float d=dot(Np,L);float dayMix=smoothstep(-.18,.22,dot(N,L));
            vec3 alb=texture2D(uDay,vU).rgb;float water=texture2D(uSpec,vU).r;
            float lum=dot(alb,vec3(.3,.59,.11));
            alb=mix(alb,alb*uTint*1.6,.18*step(.01,length(uTint-vec3(1.))));
            float lat=abs(vU.y-.5)*2.;
            float n=snoise(vec3(vU*vec2(30.,15.),1.))*.06;
            float iceFront=1.-uFreeze*1.15;
            float ice=smoothstep(iceFront,iceFront+.07,lat+n);
            ice=max(ice,smoothstep(.75,1.,uFreeze)*water);
            vec3 iceCol=mix(vec3(.78,.86,.95),vec3(.95,.97,1.),snoise(vec3(vU*80.,2.))*.5+.5);
            alb=mix(alb,iceCol*(.82+.25*lum),ice);
            vec3 charred=mix(vec3(.12,.05,.03),vec3(.35,.12,.05),lum);
            alb=mix(alb,charred,uHeat);
            alb=mix(vec3(lum),alb,1.18);
            vec3 col=alb*max(d,0.)*1.6+alb*.03;
            vec3 H=normalize(L+V);
            float sp=pow(max(dot(Np,H),0.),55.)*water*(1.-ice)*(1.-uHeat);
            col+=vec3(1.,.93,.8)*sp*.9*dayMix;
            vec3 city=texture2D(uNight,vU).rgb*vec3(1.,.82,.55);
            col+=city*(1.-dayMix)*1.4*(1.-smoothstep(.2,.6,uFreeze))*(1.-uHeat);
            float lava=smoothstep(.1,.5,snoise(vec3(vU*vec2(40.,20.),uTime*.2))*.5+.5);
            col+=vec3(1.,.32,.04)*uHeat*uHeat*lava*1.8;
            float fr=pow(1.-max(dot(N,V),0.),3.);
            col+=vec3(.3,.6,1.)*fr*smoothstep(-.3,.6,dot(N,L))*.9*(1.-uHeat);
            gl_FragColor=vec4(col,1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [day, night, spec, nrm, tint],
  );
}

const atmoMat = () =>
  new THREE.ShaderMaterial({
    uniforms: { uHeat: { value: 0 }, uFreeze: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN;varying vec3 vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform float uHeat,uFreeze;varying vec3 vN;varying vec3 vW;void main(){
      vec3 V=normalize(cameraPosition-vW);vec3 L=normalize(-vW);
      float rim=pow(clamp(1.05+dot(vN,V),0.,1.),4.);
      float lit=smoothstep(-.4,.5,dot(-vN,L)*-1.);
      vec3 c=mix(vec3(.28,.58,1.),vec3(1.,.45,.15),uHeat);c=mix(c,vec3(.7,.85,1.),uFreeze*.6);
      gl_FragColor=vec4(c*rim*lit*1.6*(1.-uFreeze*.5),1.);}`,
  });

function EarthBody({ which, sim, tint }: { which: "earth" | "twin"; sim: Sim; tint: string }) {
  const tintC = useMemo(() => new THREE.Color(tint), [tint]);
  const mat = useEarthMaterial(tintC);
  const atmo = useMemo(atmoMat, []);
  const clouds = useTexture(cloudA.url);
  clouds.colorSpace = THREE.SRGBColorSpace;
  clouds.anisotropy = 16;
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const cloudMat = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame((st, d) => {
    const b = which === "earth" ? sim.earth : sim.twin;
    const visible = (which === "earth" || sim.twinOn) && !sim.collided[which];
    if (!group.current) return;
    group.current.visible = visible;
    if (!visible) return;
    toScene(b, v);
    group.current.position.copy(v);
    const r = Math.hypot(b.x, b.y);
    const freeze = THREE.MathUtils.smoothstep(r, 1.5, 4.5);
    const heat = THREE.MathUtils.smoothstep(-r, -0.5, -0.16);
    mat.uniforms.uFreeze.value = freeze;
    mat.uniforms.uHeat.value = heat;
    mat.uniforms.uTime.value = st.clock.elapsedTime;
    atmo.uniforms.uFreeze.value = freeze;
    atmo.uniforms.uHeat.value = heat;
    if (cloudMat.current) cloudMat.current.opacity = 0.95 * (1 - freeze) * (1 - heat);
    const rot = sim.running ? d * (0.25 + sim.timeScale * 2) : 0;
    if (spin.current) spin.current.rotation.y += rot;
    if (cloudRef.current) cloudRef.current.rotation.y += rot * 0.15;
    if (ring.current) ring.current.lookAt(st.camera.position);
  });
  return (
    <group ref={group}>
      <group rotation-z={(23.44 * Math.PI) / 180}>
        <group ref={spin}>
          <mesh material={mat}>
            <sphereGeometry args={[EARTH_R, 128, 128]} />
          </mesh>
          <mesh ref={cloudRef} scale={1.012}>
            <sphereGeometry args={[EARTH_R, 96, 96]} />
            <meshStandardMaterial ref={cloudMat} map={clouds} alphaMap={clouds} transparent depthWrite={false} roughness={1} />
          </mesh>
        </group>
      </group>
      <mesh material={atmo} scale={1.11}>
        <sphereGeometry args={[EARTH_R, 64, 64]} />
      </mesh>
      {which === "twin" && (
        <mesh ref={ring}>
          <ringGeometry args={[EARTH_R * 1.55, EARTH_R * 1.62, 64]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={0.8} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/* ---------------- Stars & Milky Way ---------------- */
function Starfield() {
  const ref = useRef<THREE.Group>(null);
  const { geo, band } = useMemo(() => {
    const mk = (n: number, banded: boolean) => {
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
      const c = new THREE.Color();
      const tilt = new THREE.Matrix4().makeRotationX(1.05).multiply(new THREE.Matrix4().makeRotationZ(0.4));
      const v = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        if (banded) {
          const th = Math.random() * Math.PI * 2;
          const spread = (Math.random() + Math.random() + Math.random() - 1.5) * 0.18;
          v.set(Math.cos(th), spread, Math.sin(th)).normalize();
          v.applyMatrix4(tilt);
        } else {
          v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        }
        v.multiplyScalar(2400);
        pos.set([v.x, v.y, v.z], i * 3);
        const t = Math.random();
        if (banded) c.setHSL(0.08 + Math.random() * 0.55, 0.35, 0.55 + Math.random() * 0.2);
        else c.setHSL(t < 0.2 ? 0.58 : t < 0.7 ? 0.12 : 0.05, 0.25 + Math.random() * 0.4, 0.75 + Math.random() * 0.25);
        col.set([c.r, c.g, c.b], i * 3);
        size[i] = banded ? 1.2 + Math.random() * 1.6 : Math.pow(Math.random(), 6) * 7 + 1.4;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      g.setAttribute("size", new THREE.BufferAttribute(size, 1));
      return g;
    };
    return { geo: mk(9000, false), band: mk(26000, true) };
  }, []);
  const mat = (op: number) =>
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: { uOp: { value: op }, uTime: { value: 0 } },
      vertexShader: `attribute float size;attribute vec3 color;varying vec3 vC;varying float vTw;uniform float uTime;
        void main(){vC=color;vTw=.75+.25*sin(uTime*2.+position.x*.13+position.y*.07);gl_PointSize=size*vTw;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float uOp;varying vec3 vC;varying float vTw;void main(){float d=length(gl_PointCoord-.5);float a=exp(-d*d*34.)+exp(-d*d*8.)*.25;gl_FragColor=vec4(vC*a*uOp*1.6,1.);}`,
    });
  const m1 = useMemo(() => mat(1), []);
  const m2 = useMemo(() => mat(0.35), []);
  useFrame((st) => {
    ref.current?.position.copy(st.camera.position);
    m1.uniforms.uTime.value = st.clock.elapsedTime;
  });
  return (
    <group ref={ref}>
      <points geometry={geo} material={m1} />
      <points geometry={band} material={m2} />
    </group>
  );
}

/* ---------------- Lines ---------------- */
function TrailLine({ geom, color, opacity }: { geom: THREE.BufferGeometry; color: string; opacity: number }) {
  const line = useMemo(() => {
    const l = new THREE.Line(geom, new THREE.LineBasicMaterial({ color, transparent: true, opacity, toneMapped: false }));
    l.frustumCulled = false;
    return l;
  }, [geom, color, opacity]);
  return <primitive object={line} />;
}

function StaticLine({ data, color, opacity, dashed }: { data: Float32Array; color: string; opacity: number; dashed?: boolean }) {
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data, 3));
    const m = dashed
      ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.5, gapSize: 0.35, toneMapped: false })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity, toneMapped: false });
    const l = new THREE.Line(g, m);
    if (dashed) l.computeLineDistances();
    l.frustumCulled = false;
    return l;
  }, [data, color, opacity, dashed]);
  return <primitive object={line} />;
}

function Lines({ sim, show, tick }: { sim: Sim; show: Show; tick: number }) {
  void tick;
  return (
    <>
      {show.trails && <TrailLine geom={sim.trail.geom} color="#6fb6ff" opacity={0.95} />}
      {show.trails && <TrailLine geom={sim.twinTrail.geom} color="#ffb347" opacity={0.95} />}
      {show.prev && sim.prev.map((p, i) => <StaticLine key={i + "-" + p.length} data={p} color="#c9a46a" opacity={0.25 + i * 0.12} />)}
      {show.predict && sim.predict.length > 6 && <StaticLine key={"p" + sim.predictVersion} data={sim.predict} color="#ffffff" opacity={0.35} dashed />}
      {show.predict && sim.predictTwin.length > 6 && <StaticLine key={"pt" + sim.predictVersion} data={sim.predictTwin} color="#ffcf8a" opacity={0.3} dashed />}
    </>
  );
}

/* ---------------- Vectors ---------------- */
function Arrow({ color, get }: { color: string; get: (dir: THREE.Vector3, origin: THREE.Vector3) => number }) {
  const g = useRef<THREE.Group>(null);
  const shaft = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Mesh>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const o = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame(() => {
    const len = get(dir, o);
    if (!g.current || !shaft.current || !head.current) return;
    g.current.visible = len > 0.05;
    if (len <= 0.05) return;
    g.current.position.copy(o);
    g.current.quaternion.setFromUnitVectors(up, dir.normalize());
    const L = Math.max(len - 0.35, 0.05);
    shaft.current.scale.set(1, L, 1);
    shaft.current.position.y = L / 2;
    head.current.position.y = L + 0.17;
  });
  return (
    <group ref={g}>
      <mesh ref={shaft}>
        <cylinderGeometry args={[0.045, 0.045, 1, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={head}>
        <coneGeometry args={[0.14, 0.34, 18]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Vectors({ sim, which }: { sim: Sim; which: "earth" | "twin" }) {
  const p = useMemo(() => new THREE.Vector3(), []);
  const ok = () => (which === "earth" || sim.twinOn) && !sim.collided[which];
  const body = () => (which === "earth" ? sim.earth : sim.twin);
  return (
    <>
      <Arrow
        color="#7dffb0"
        get={(dir, o) => {
          if (!ok()) return 0;
          const b = body();
          toScene(b, p);
          dir.set(b.vx, 0, -b.vy);
          const sp = dir.length() * 4.7405;
          o.copy(p).addScaledVector(dir.clone().normalize(), EARTH_R * 1.2);
          return sp * 0.11;
        }}
      />
      <Arrow
        color="#ff6b5a"
        get={(dir, o) => {
          if (!ok() || !sim.gravity) return 0;
          const b = body();
          toScene(b, p);
          const r = Math.hypot(b.x, b.y);
          dir.copy(p).multiplyScalar(-1);
          o.copy(p).addScaledVector(dir.clone().normalize(), EARTH_R * 1.2);
          return Math.min(3.2 / (r * r), Math.max(r * S - SUN_R - EARTH_R * 2, 0.1), 9);
        }}
      />
    </>
  );
}

/* ---------------- Event markers & explosion ---------------- */
function Markers({ sim }: { sim: Sim }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((st) => {
    sim.events.forEach((e, i) => {
      const m = refs.current[i];
      if (!m) return;
      const age = sim.clock - e.t;
      const pulse = 1 + 0.25 * Math.sin(age * 4);
      m.position.set(e.x, 0, e.z);
      m.scale.setScalar(age < 1 ? 0.3 + age * 2.4 * pulse : 2.7 * pulse * 0.4 + 0.6);
      m.lookAt(st.camera.position);
    });
  });
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} ref={(m) => { refs.current[i] = m; }} visible={i < sim.events.length}>
          <ringGeometry args={[0.32, 0.38, 48]} />
          <meshBasicMaterial color={sim.events[i]?.kind === "gravity-off" ? "#ff6b5a" : "#ffe08a"} transparent opacity={0.9} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

function Explosion({ sim }: { sim: Sim }) {
  const N = 1400;
  const { geo, vel } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3(Math.random() * 2 - 1, (Math.random() * 2 - 1) * 0.6, Math.random() * 2 - 1).normalize().multiplyScalar(0.5 + Math.random() * 3);
      vel.set([v.x, v.y, v.z], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g, vel };
  }, []);
  const mat = useMemo(() => new THREE.PointsMaterial({ size: 0.12, color: "#ffb060", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  const flash = useRef<THREE.Mesh>(null);
  const pts = useRef<THREE.Points>(null);
  useFrame(() => {
    const ex = sim.explosion;
    if (!pts.current || !flash.current) return;
    pts.current.visible = flash.current.visible = !!ex;
    if (!ex) return;
    const age = sim.clock - ex.t0;
    const a = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      a.setXYZ(i, ex.pos.x + vel[i * 3] * age, vel[i * 3 + 1] * age, ex.pos.z + vel[i * 3 + 2] * age);
    }
    a.needsUpdate = true;
    mat.opacity = Math.max(0, 1 - age / 5);
    mat.color.setHSL(0.08 - Math.min(age, 4) * 0.015, 1, 0.6);
    flash.current.position.copy(ex.pos);
    const f = Math.max(0, 1 - age / 1.6);
    flash.current.scale.setScalar(0.5 + age * 3);
    (flash.current.material as THREE.MeshBasicMaterial).opacity = f;
  });
  return (
    <>
      <points ref={pts} geometry={geo} material={mat} frustumCulled={false} />
      <mesh ref={flash}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ffd9a0" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}

function OrbitGrid() {
  return (
    <group>
      {[0.5, 1, 1.5, 2, 3, 4].map((au) => (
        <mesh key={au} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[au * S - 0.02, au * S + 0.02, 256]} />
          <meshBasicMaterial color="#9cc2ff" transparent opacity={au === 1 ? 0.22 : 0.09} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- Camera rig ---------------- */
type Flight = { from: THREE.Vector3; fromT: THREE.Vector3; t0: number; dur: number; mode: CamMode };

const START_TARGET: [number, number, number] = [S, 0, 0];

function CameraRig({ sim, mode, flyKey, onUser }: { sim: Sim; mode: CamMode; flyKey: number; onUser?: () => void }) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: OC | null };
  const flight = useRef<Flight | null>(null);
  const last = useRef(new THREE.Vector3());
  const ep = useMemo(() => new THREE.Vector3(), []);
  const clock = useRef(0);

  const desired = (m: CamMode, outPos: THREE.Vector3, outT: THREE.Vector3) => {
    toScene(sim.earth, ep);
    const r = ep.length();
    if (m === "system" || m === "free") {
      const R = Math.max(S * 1.15, r * 1.25);
      outT.set(0, 0, 0);
      outPos.set(R * 0.15, R * 0.95, R * 1.25);
    } else if (m === "sun") {
      outT.set(0, 0, 0);
      outPos.set(SUN_R * 3.2, SUN_R * 0.9, SUN_R * 3.6);
    } else if (m === "chase") {
      const v = new THREE.Vector3(sim.earth.vx, 0, -sim.earth.vy).normalize();
      outT.copy(ep).addScaledVector(v, 2);
      outPos.copy(ep).addScaledVector(v, -3.6).add(new THREE.Vector3(0, 1.1, 0));
    } else {
      outT.copy(ep);
      const toSun = ep.clone().multiplyScalar(-1).normalize();
      outPos.copy(ep).addScaledVector(toSun, -2.6).add(new THREE.Vector3(toSun.z * 2.2, 1.2, -toSun.x * 2.2));
    }
  };

  const userMode = useRef<CamMode | null>(null);
  useEffect(() => {
    userMode.current = null;
    flight.current = { from: camera.position.clone(), fromT: controls ? controls.target.clone() : new THREE.Vector3(), t0: clock.current, dur: flyKey === 0 ? 0.01 : 2.6, mode };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyKey, controls]);

  // As soon as the user touches/drags/zooms, stop any automatic camera motion.
  useEffect(() => {
    if (!controls) return;
    const onStart = () => {
      flight.current = null;
      userMode.current = mode === "chase" ? "follow" : mode;
      onUser?.();
    };
    controls.addEventListener("start", onStart);
    return () => controls.removeEventListener("start", onStart);
  }, [controls, mode, onUser]);

  useFrame((_, d) => {
    clock.current += d;
    if (!controls) return;
    const mode_ = userMode.current ?? mode;
    toScene(sim.earth, ep);
    const P = new THREE.Vector3(), T = new THREE.Vector3();
    const f = flight.current;
    if (f) {
      desired(f.mode, P, T);
      const k = Math.min(1, (clock.current - f.t0) / f.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(f.from, P, e);
      controls.target.lerpVectors(f.fromT, T, e);
      if (k >= 1) flight.current = null;
    } else if (mode_ === "follow" || mode_ === "chase") {
      if (mode_ === "chase") {
        desired("chase", P, T);
        camera.position.lerp(P, 1 - Math.exp(-4 * d));
        controls.target.lerp(T, 1 - Math.exp(-6 * d));
      } else {
        const delta = ep.clone().sub(last.current);
        camera.position.add(delta);
        controls.target.add(delta);
      }
    }
    last.current.copy(ep);
    controls.update();
  });
  return null;
}

function Driver({ sim, onTick }: { sim: Sim; onTick: () => void }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  const ver = useRef(-1);
  useFrame((_, raw) => {
    sim.advance(Math.min(raw, 0.05));
    if (!sim.collided.earth) sim.trail.push(toScene(sim.earth, v));
    if (sim.twinOn && !sim.collided.twin) sim.twinTrail.push(toScene(sim.twin, v));
    if (ver.current !== sim.predictVersion) {
      ver.current = sim.predictVersion;
      onTick();
    }
  });
  return null;
}

export default function SpaceScene({ sim, show, mode, flyKey, tick, onTick, onUser }: { sim: Sim; show: Show; mode: CamMode; flyKey: number; tick: number; onTick: () => void; onUser?: () => void }) {
  void GM;
  return (
    <Canvas
      dpr={[1.5, 2.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [S + 2.6, 1.2, 2.4], fov: 45, near: 0.05, far: 20000 }}
      onCreated={({ camera }) => camera.lookAt(S, 0, 0)}
    >
      <color attach="background" args={["#01020a"]} />
      <ambientLight intensity={0.06} />
      <Suspense fallback={null}>
        <Starfield />
        <Sun />
        <EarthBody which="earth" sim={sim} tint="#ffffff" />
        <EarthBody which="twin" sim={sim} tint="#ffcf8a" />
      </Suspense>
      <Lines sim={sim} show={show} tick={tick} />
      {show.vectors && <Vectors sim={sim} which="earth" />}
      {show.vectors && <Vectors sim={sim} which="twin" />}
      {show.grid && <OrbitGrid />}
      <Markers sim={sim} />
      <Explosion sim={sim} />
      <Driver sim={sim} onTick={onTick} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={0.8} maxDistance={6000} target={START_TARGET} />
      <CameraRig sim={sim} mode={mode} flyKey={flyKey} onUser={onUser} />
      <EffectComposer multisampling={8}>
        <Bloom mipmapBlur intensity={0.7} luminanceThreshold={1.0} luminanceSmoothing={0.15} radius={0.7} />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Vignette eskil={false} offset={0.4} darkness={0.35} />
      </EffectComposer>
    </Canvas>
  );
}
