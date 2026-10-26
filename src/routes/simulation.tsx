import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Sim } from "@/components/sim/sim-state";
import type { CamMode, Show } from "@/components/sim/SpaceScene";
import { orbitInfo, auyrToKms, escapeSpeedKms, surfaceTempK, EARTH_V_KMS, GM } from "@/lib/orbit-physics";

const SpaceScene = lazy(() => import("@/components/sim/SpaceScene"));

export const Route = createFileRoute("/simulation")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "محاكاة سرعة الأرض وجاذبية الشمس — ثلاثية الأبعاد" },
      { name: "description", content: "محاكاة علمية ثلاثية الأبعاد لحركة الأرض حول الشمس وتأثير تغيير السرعة والجاذبية." },
      { property: "og:title", content: "محاكاة سرعة الأرض وجاذبية الشمس" },
      { property: "og:description", content: "مدارات محسوبة فيزيائياً، إفلات، اصطدام، وإيقاف افتراضي للجاذبية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimulationPage,
});

const KIND: Record<string, string> = {
  circular: "مدار مغلق شبه دائري",
  elliptic: "مدار مغلق إهليلجي",
  parabolic: "مسار حدّي (سرعة الإفلات)",
  hyperbolic: "مسار مفتوح — إفلات من الشمس",
  collision: "مسار يتقاطع مع الشمس — اصطدام",
  free: "حركة مستقيمة (بلا جاذبية)",
};

export const FATE_DELAY_MS = 10_000;

const fmt = (n: number, d = 2) => (isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }) : "∞");

function SimulationPage() {
  const [sim] = useState(() => new Sim());
  const [, force] = useState(0);
  const [tick, setTick] = useState(0);
  const [mode, setMode] = useState<CamMode>("follow");
  const [flyKey, setFlyKey] = useState(0);
  const [panel, setPanel] = useState(true);
  const [eq, setEq] = useState(false);
  const [open, setOpen] = useState<"fate" | "cam" | "stats" | "lines" | null>(null);
  const [ellip, setEllip] = useState(0.6);
  const [pending, setPending] = useState<string | null>(null);
  const fateTimer = useRef<number | null>(null);
  const [cinema, setCinema] = useState(true);
  const [speed, setSpeed] = useState(EARTH_V_KMS);
  const [angle, setAngle] = useState(0);
  const [dv, setDv] = useState(0.3);
  const [timeScale, setTimeScale] = useState(0.12);
  const [show, setShow] = useState<Show>({ trails: true, vectors: true, predict: true, prev: true, grid: true });
  const timers = useRef<number[]>([]);

  const fly = useCallback((m: CamMode) => { setMode(m); setFlyKey((k) => k + 1); }, []);
  const cinematic = useCallback(() => {
    if (!cinema) return;
    timers.current.forEach(clearTimeout);
    fly("follow");
    timers.current = [window.setTimeout(() => fly("system"), 4200)];
  }, [cinema, fly]);

  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 120);
    const t = window.setTimeout(() => fly("system"), 2200);
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") { sim.running = !sim.running; e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { clearInterval(id); clearTimeout(t); window.removeEventListener("keydown", onKey); timers.current.forEach(clearTimeout); if (fateTimer.current) clearTimeout(fateTimer.current); };
  }, [sim, fly]);

  const b = sim.earth;
  const r = Math.hypot(b.x, b.y);
  const v = auyrToKms(Math.hypot(b.vx, b.vy));
  const info = orbitInfo(b, sim.gravity);
  const vesc = escapeSpeedKms(r);
  const vcirc = auyrToKms(Math.sqrt(GM / r));
  const tempC = surfaceTempK(r) - 273;
  const gAcc = sim.gravity ? (GM / (r * r)) * 1.496e11 / (3.156e7 ** 2) * 1000 : 0; // mm/s²
  const twinSep = sim.twinOn ? Math.hypot(sim.twin.x - b.x, sim.twin.y - b.y) * 149.6 : 0;
  const status = sim.collided.earth ? KIND["collision"] : KIND[info.kind];

  const applySpeed = (s: number, a = angle) => {
    const sv = Math.max(0, Math.min(80, s));
    setSpeed(sv);
    sim.applyVelocity(sv, a);
    cinematic();
  };
  const reset = () => {
    sim.reset();
    setSpeed(EARTH_V_KMS); setAngle(0);
    timers.current.forEach(clearTimeout);
    fly("follow");
    timers.current = [window.setTimeout(() => fly("system"), 2200)];
  };
  // Hidden 10-second suspense timer: the orbit continues calmly, then the event fires suddenly.
  const schedule = (key: string, action: () => void) => {
    if (fateTimer.current) clearTimeout(fateTimer.current);
    setPending(key);
    fateTimer.current = window.setTimeout(() => {
      fateTimer.current = null;
      setPending(null);
      sim.running = true;
      action();
      force((x) => x + 1);
    }, FATE_DELAY_MS);
  };
  const fates: Record<string, () => void> = {
    stable: () => { sim.stopTwin(); sim.setGravity(true); applySpeed(EARTH_V_KMS, 0); },
    sun: () => { sim.setGravity(true); applySpeed(6, 0); },
    escape: () => { sim.setGravity(true); applySpeed(46, 0); fly("system"); },
    nogravity: () => { sim.setGravity(false); cinematic(); },
    ellipse: () => { sim.setGravity(true); applySpeed(EARTH_V_KMS + ellip * 10, 0); fly("system"); },
    twinSoft: () => { sim.setGravity(true); sim.stopTwin(); sim.startTwin(0.3); fly("system"); },
    twinSplit: () => { sim.setGravity(true); sim.stopTwin(); sim.startTwin(16); fly("system"); },
  };
  const pick = (k: string) => schedule(k, fates[k]);
  const quickReset = () => { if (fateTimer.current) clearTimeout(fateTimer.current); fateTimer.current = null; setPending(null); reset(); };

  const toggle = (k: keyof Show) => setShow((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div dir="rtl" className="fixed inset-0 overflow-hidden bg-background text-foreground select-none">
      <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">جارٍ تحميل المشهد الفضائي…</div>}>
        <SpaceScene sim={sim} show={show} mode={mode} flyKey={flyKey} tick={tick} onTick={() => setTick((x) => x + 1)} />
      </Suspense>

      {/* Left tool buttons */}
      <div className="absolute left-3 bottom-4 z-20 flex flex-col gap-1.5">
        {([["fate", "🎚️", "التحكم والمصائر"], ["cam", "🎥", "الكاميرا"], ["stats", "📊", "الحالة المدارية"], ["lines", "🧭", "الخطوط والمسارات"]] as [typeof open, string, string][]).map(([k, ic, l]) => (
          <button key={k} onClick={() => setOpen((o) => (o === k ? null : k))} aria-label={l} title={l}
            className={`grid h-8 w-8 place-items-center rounded-full border border-border/40 text-sm backdrop-blur-md transition ${open === k ? "bg-primary text-primary-foreground" : "bg-background/50 hover:bg-foreground/10"}`}>{ic}</button>
        ))}
      </div>

      {open && (
        <div className="absolute left-14 bottom-4 z-20 max-w-[80vw] rounded-lg border border-border/40 bg-background/50 p-2 text-[11px] backdrop-blur-md" dir="rtl">
          {open === "fate" && (
            <div className="w-[min(300px,78vw)] space-y-1">
              <div className="grid grid-cols-2 gap-1">
                <Fate on={pending === "stable"} onClick={() => pick("stable")}>🌍 المدار الطبيعي المستقر</Fate>
                <Fate on={pending === "sun"} onClick={() => pick("sun")}>🔥 السقوط في الشمس</Fate>
                <Fate on={pending === "escape"} onClick={() => pick("escape")}>❄️ الإفلات والتجمد</Fate>
                <Fate on={pending === "nogravity"} onClick={() => pick("nogravity")}>🚀 اختفاء جاذبية الشمس</Fate>
              </div>
              <div className="rounded-md border border-border/40 p-1">
                <Fate on={pending === "ellipse"} onClick={() => pick("ellipse")}>🪐 مدار إهليلجي متطرف</Fate>
                <input type="range" min={0.1} max={1.2} step={0.05} value={ellip} onChange={(e) => setEllip(parseFloat(e.target.value))} className="mt-1 w-full accent-primary" aria-label="شدة التمدد" />
                <div className="flex justify-between text-[9px] text-muted-foreground"><span>شدة التمدد</span><span dir="ltr" className="font-mono">{fmt(EARTH_V_KMS + ellip * 10, 1)} km/s</span></div>
              </div>
              <div className="rounded-md border border-border/40 p-1">
                <div className="mb-1 text-[10px] text-muted-foreground">👥 كوكب الأرض التوأم</div>
                <div className="grid grid-cols-2 gap-1">
                  <Fate on={pending === "twinSoft"} onClick={() => pick("twinSoft")}>افتراق تدريجي هادئ</Fate>
                  <Fate on={pending === "twinSplit"} onClick={() => pick("twinSplit")}>مصيران مختلفان</Fate>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                <Fate onClick={quickReset}>🔄 إعادة ضبط</Fate>
                <Fate onClick={() => { sim.running = !sim.running; force((x) => x + 1); }}>{sim.running ? "⏸️ إيقاف" : "▶️ تشغيل"}</Fate>
                <Link to="/" className="rounded-md bg-foreground/10 px-1 py-1 text-center text-[10px] hover:bg-foreground/20">العودة للدرس</Link>
              </div>
            </div>
          )}
          {open === "cam" && (
            <div className="flex flex-col gap-0.5">
              {([["follow", "قرب الأرض"], ["chase", "تتبع خلفي"], ["system", "المدار كاملاً"], ["sun", "الشمس"]] as [CamMode, string][]).map(([m, l]) => (
                <button key={m} onClick={() => fly(m)} className={`rounded-full px-3 py-1 text-[11px] transition ${mode === m ? "bg-primary text-primary-foreground" : "hover:bg-foreground/10"}`}>{l}</button>
              ))}
            </div>
          )}
          {open === "stats" && (
            <div className="w-[min(420px,78vw)] space-y-1">
              <div className={`text-center text-[11px] font-semibold ${info.kind === "hyperbolic" || sim.collided.earth ? "text-destructive" : "text-primary"}`}>{status}</div>
              <div className="grid grid-cols-3 gap-1">
                <Stat k="سرعة الأرض" v={`${fmt(v)} كم/ث`} />
                <Stat k="البعد عن الشمس" v={`${fmt(r * 149.6, 1)} م.كم`} />
                <Stat k="تسارع الجاذبية" v={`${fmt(gAcc / 1000, 5)} م/ث²`} />
              </div>
              <div className="grid grid-cols-4 gap-1">
                <Stat k="سرعة الإفلات" v={`${fmt(vesc, 1)} كم/ث`} />
                <Stat k="زمن الدورة" v={sim.gravity && !sim.collided.earth && isFinite(info.periodYr) ? `${fmt(info.periodYr * 365.25, 1)} يوم` : "—"} />
                <Stat k="الحرارة" v={`${fmt(tempC, 0)}°م`} />
                <Stat k="الزمن المنقضي" v={`${fmt(sim.t * 365.25, 0)} يوم`} />
              </div>
            </div>
          )}
          {open === "lines" && (
            <div className="space-y-1 text-[11px]">
              <Explain c="#ff6b5a" t="قوة الجاذبية F" />
              <Explain c="#7dffb0" t="السرعة v" />
              <Explain c="#6fb6ff" t="المسار الحالي" />
              <Explain c="#ffffff" t="المسار المتوقع" />
              <Explain c="#c9a46a" t="المدار السابق" />
              {sim.twinOn && <Explain c="#ffb347" t="الأرض الثانية" />}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function Fate({ children, on, onClick }: { children: React.ReactNode; on?: boolean; onClick: () => void }) {
  return (<button onClick={onClick} className={`w-full rounded-md px-1 py-1 text-[10px] transition active:scale-[.98] ${on ? "bg-primary/25" : "bg-foreground/10 hover:bg-foreground/20"}`}>{children}</button>);
}
function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-background/40 px-1 py-0.5 text-center">
      <div className="text-[9px] text-muted-foreground">{k}</div>
      <div className="font-mono text-[11px] font-semibold" dir="ltr">{v}</div>
    </div>
  );
}
function Explain({ c, t }: { c: string; t: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="inline-block h-[3px] w-4 shrink-0 rounded" style={{ background: c }} />
      <span>{t}</span>
    </div>
  );
}
function Section({ t, children }: { t: string; children: React.ReactNode }) {
  return (<section className="mt-4 border-t border-border/30 pt-3"><h2 className="mb-2 text-xs font-semibold text-muted-foreground">{t}</h2><div className="space-y-2">{children}</div></section>);
}
function Btn({ children, onClick, primary, danger }: { children: React.ReactNode; onClick: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full rounded-md px-2 py-1.5 text-xs font-medium transition active:scale-[.98] ${danger ? "bg-destructive text-destructive-foreground" : primary ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-foreground/10 hover:bg-foreground/20"}`}>{children}</button>
  );
}
function Tg({ children, on, onClick }: { children: React.ReactNode; on: boolean; onClick: () => void }) {
  return (<button onClick={onClick} className={`rounded-md border px-2 py-1 text-[11px] transition ${on ? "border-primary/60 bg-primary/20" : "border-border/40 opacity-60"}`}>{children}</button>);
}
function Slider({ label, value, min, max, step, show, onChange }: { label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="flex justify-between text-[11px]"><span>{label}</span><span dir="ltr" className="font-mono">{show}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-primary" />
    </label>
  );
}
