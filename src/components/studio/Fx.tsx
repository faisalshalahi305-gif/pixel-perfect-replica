import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Fx } from "@/lib/lesson-blocks";

const mix = (c: string, n: number) => `color-mix(in oklab, ${c} ${n}%, transparent)`;

const TEX: Record<string, (c: string) => string> = {
  grid: (c) => `linear-gradient(${mix(c, 14)} 1px, transparent 1px), linear-gradient(90deg, ${mix(c, 14)} 1px, transparent 1px)`,
  dots: (c) => `radial-gradient(${mix(c, 22)} 1.2px, transparent 1.4px)`,
  orbit: (c) => `repeating-radial-gradient(circle at 85% 20%, transparent 0 22px, ${mix(c, 12)} 22px 23px)`,
  lines: (c) => `repeating-linear-gradient(135deg, transparent 0 10px, ${mix(c, 10)} 10px 11px)`,
};

/** outer = placement in the page flow; inner = the visual skin. */
export function fxStyle(fx?: Fx): { outer: CSSProperties; inner: CSSProperties; cls: string } {
  if (!fx) return { outer: {}, inner: {}, cls: "" };
  const outer: CSSProperties = {};
  const inner: CSSProperties = {};
  if (fx.al) {
    inner.width = "fit-content"; inner.maxWidth = "100%";
    inner.marginLeft = fx.al === "r" ? "auto" : fx.al === "c" ? "auto" : 0;
    inner.marginRight = fx.al === "l" ? "auto" : fx.al === "c" ? "auto" : 0;
  }
  const t: string[] = [];
  if (fx.dx) t.push(`translateX(${fx.dx}px)`);
  if (fx.sc && fx.sc !== 100) { t.push(`scale(${fx.sc / 100})`); inner.transformOrigin = "center top"; }
  if (t.length) inner.transform = t.join(" ");
  if (fx.z) { outer.zIndex = fx.z; outer.position = "relative"; }
  if (fx.alpha !== undefined && fx.alpha < 100) inner.opacity = fx.alpha / 100;
  if (fx.tc) inner.color = fx.tc;
  const op = fx.op ?? 100;
  const c1 = fx.c1 ?? "#38bdf8", c2 = fx.c2 ?? "#0f172a";
  const layers: string[] = [];
  if (fx.tex && fx.tex !== "none") layers.push(TEX[fx.tex]!(fx.gc ?? c1));
  if (fx.kind === "solid") layers.push(`linear-gradient(${mix(c1, op)}, ${mix(c1, op)})`);
  if (fx.kind === "linear") layers.push(`linear-gradient(${fx.ang ?? 135}deg, ${mix(c1, op)}, ${fx.c3 ? mix(fx.c3, op) + ", " : ""}${mix(c2, op)})`);
  if (fx.kind === "radial") layers.push(`radial-gradient(circle at 30% 20%, ${mix(c1, op)}, ${fx.c3 ? mix(fx.c3, op) + ", " : ""}${mix(c2, op)})`);
  if (layers.length) {
    inner.backgroundImage = layers.join(", ");
    if (fx.tex === "grid") inner.backgroundSize = "22px 22px" + (layers.length > 1 ? ", auto".repeat(layers.length - 1) : "");
    if (fx.tex === "dots") inner.backgroundSize = "14px 14px" + (layers.length > 1 ? ", auto".repeat(layers.length - 1) : "");
  }
  if (fx.blend) inner.mixBlendMode = fx.blend as CSSProperties["mixBlendMode"];
  if (fx.blur) inner.backdropFilter = `blur(${fx.blur}px) saturate(140%)`;
  if (fx.r) inner.borderRadius = fx.r.map((x) => `${x}px`).join(" ");
  if (fx.bw) inner.border = `${fx.bw}px ${fx.bs ?? "solid"} ${fx.bc ?? c1}`;
  const gc = fx.gc ?? c1;
  const sh: string[] = [];
  if (fx.glow) sh.push(`0 0 ${fx.spread ?? fx.glow * 2}px ${mix(gc, Math.min(100, fx.glow * 6))}`);
  if (fx.sh) sh.push(`0 ${fx.sh}px ${fx.sh * 3}px rgb(0 0 0 / .45)`);
  if (fx.blur) sh.push(`inset 0 1px 0 ${mix("#ffffff", 18)}`);
  if (sh.length) inner.boxShadow = sh.join(", ");
  if (fx.pad !== undefined) inner.padding = `${fx.pad}px`;
  (inner as Record<string, string>)["--gc"] = gc;
  return { outer, inner, cls: fx.pulse ? "fx-pulse" : "" };
}

const SW = ["#ffffff", "#94a3b8", "#0f172a", "#000000", "#38bdf8", "#2563eb", "#1e3a8a", "#22d3ee", "#34d399", "#059669", "#84cc16", "#fde047", "#fbbf24", "#d97706", "#fb923c", "#ef4444", "#be123c", "#f472b6", "#a78bfa", "#7c3aed"];
const PRESETS: [string, Fx][] = [
  ["زجاج كوني", { kind: "solid", c1: "#0f172a", op: 35, blur: 14, bw: 1, bc: "#7dd3fc", r: [20, 20, 20, 20], pad: 20 }],
  ["ملكي ذهبي", { kind: "linear", c1: "#1e3a8a", c2: "#0f172a", ang: 160, bw: 2, bc: "#fbbf24", glow: 6, gc: "#fbbf24", r: [14, 14, 14, 14], pad: 20 }],
  ["نيون", { kind: "solid", c1: "#020617", op: 80, bw: 2, bc: "#22d3ee", glow: 12, gc: "#22d3ee", pulse: true, r: [12, 12, 12, 12], pad: 18 }],
  ["سديم", { kind: "radial", c1: "#7c3aed", c2: "#0f172a", c3: "#be123c", op: 55, r: [24, 24, 24, 24], pad: 22 }],
  ["وثيقة رسمية", { kind: "solid", c1: "#0f172a", op: 70, bw: 3, bs: "double", bc: "#cbd5e1", r: [0, 0, 0, 0], pad: 24, tex: "lines", gc: "#cbd5e1" }],
  ["شبكة تقنية", { kind: "linear", c1: "#0c4a6e", c2: "#020617", ang: 180, tex: "grid", gc: "#38bdf8", bw: 1, bc: "#38bdf8", r: [0, 18, 0, 18], pad: 20 }],
  ["زمردي", { kind: "linear", c1: "#059669", c2: "#022c22", ang: 120, op: 70, glow: 5, gc: "#34d399", r: [18, 4, 18, 4], pad: 20 }],
  ["مدار", { kind: "solid", c1: "#0f172a", op: 60, tex: "orbit", gc: "#fbbf24", bw: 1, bc: "#fbbf24", r: [28, 28, 28, 28], pad: 22 }],
];
const PK = "fx-presets";
const loadP = (): [string, Fx][] => { try { return JSON.parse(localStorage.getItem(PK) ?? "[]"); } catch { return []; } };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex items-center gap-2 text-xs"><span className="w-20 shrink-0 text-muted-foreground">{label}</span><div className="flex flex-1 flex-wrap items-center gap-1">{children}</div></label>;
}
function Slide({ v, min, max, on, step = 1 }: { v: number; min: number; max: number; on: (n: number) => void; step?: number }) {
  return <><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(+e.target.value)} className="flex-1 accent-primary" /><span className="w-8 text-left tabular-nums">{v}</span></>;
}
function Col({ v, on, peek }: { v?: string | undefined; on: (c: string) => void; peek?: (c: string | null) => void }) {
  const drop = async () => {
    const E = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!E) return alert("القطارة غير مدعومة في هذا المتصفح");
    try { on((await new E().open()).sRGBHex); } catch { /* cancelled */ }
  };
  return (
    <>
      {SW.map((c) => <button key={c} aria-label={c} onMouseEnter={() => peek?.(c)} onMouseLeave={() => peek?.(null)} onClick={() => on(c)} className={`h-5 w-5 rounded-full border ${v === c ? "border-foreground ring-2 ring-primary" : "border-border"}`} style={{ background: c }} />)}
      <input type="color" value={v ?? "#38bdf8"} onChange={(e) => on(e.target.value)} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent" aria-label="لون حر" />
      <button onClick={drop} className="rounded border border-border px-1.5 text-[11px]" aria-label="قطارة">قطارة</button>
    </>
  );
}

const TABS = ["الألوان", "الإضاءة", "الشكل", "الموضع", "الأنماط"] as const;

export function FxPanel({ fx, set, peek, onClose, piece }: { fx: Fx; set: (f: Fx) => void; peek: (f: Fx | null) => void; onClose: () => void; piece?: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("الألوان");
  const [mine, setMine] = useState<[string, Fx][]>([]);
  useEffect(() => setMine(loadP()), []);
  const u = (p: Partial<Fx>) => set({ ...fx, ...p });
  const pk = (p: Partial<Fx>) => (c: string | null) => peek(c === null ? null : { ...fx, ...p, ...Object.fromEntries(Object.entries(p).map(([k]) => [k, c])) });
  const r = fx.r ?? [12, 12, 12, 12];
  const setR = (j: number, n: number) => { const x = [...r] as Fx["r"] & number[]; x[j] = n; u({ r: x }); };
  const btn = (on: boolean) => `rounded-md border px-2 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`;
  return (
    <div dir="rtl" onMouseDown={(e) => e.stopPropagation()} className="relative z-30 mt-2 space-y-3 rounded-2xl border border-border bg-card p-3 text-foreground shadow-2xl">
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={btn(tab === t)}>{t}</button>)}
        <button onClick={onClose} className="mr-auto rounded-md border border-border px-2 py-1 text-xs">إغلاق</button>
      </div>
      {tab === "الألوان" && <div className="space-y-2">
        <Row label="الخلفية">{(["none", "solid", "linear", "radial"] as const).map((k) => <button key={k} onClick={() => u({ kind: k })} className={btn((fx.kind ?? "none") === k)}>{{ none: "بدون", solid: "لون", linear: "تدرج", radial: "دائري" }[k]}</button>)}</Row>
        <Row label="اللون ١"><Col v={fx.c1} on={(c) => u({ c1: c, kind: fx.kind && fx.kind !== "none" ? fx.kind : "solid" })} peek={pk({ c1: "" })} /></Row>
        {(fx.kind === "linear" || fx.kind === "radial") && <>
          <Row label="اللون ٢"><Col v={fx.c2} on={(c) => u({ c2: c })} peek={pk({ c2: "" })} /></Row>
          <Row label="لون ثالث"><Col v={fx.c3} on={(c) => u({ c3: c })} /><button onClick={() => u({ c3: undefined })} className={btn(false)}>بدون</button></Row>
          {fx.kind === "linear" && <Row label="الاتجاه"><Slide v={fx.ang ?? 135} min={0} max={360} on={(n) => u({ ang: n })} /></Row>}
        </>}
        <Row label="تعبئة اللون"><Slide v={fx.op ?? 100} min={0} max={100} on={(n) => u({ op: n })} /></Row>
        <Row label="شفافية الكل"><Slide v={fx.alpha ?? 100} min={10} max={100} on={(n) => u({ alpha: n })} /></Row>
        <Row label="لون النص"><Col v={fx.tc} on={(c) => u({ tc: c })} /><button onClick={() => u({ tc: undefined })} className={btn(false)}>أصلي</button></Row>
        <Row label="الدمج">{([["", "عادي"], ["screen", "مضيء"], ["overlay", "تراكب"], ["soft-light", "ناعم"], ["multiply", "عميق"]] as const).map(([k, l]) => <button key={k} onClick={() => u({ blend: k || undefined })} className={btn((fx.blend ?? "") === k)}>{l}</button>)}</Row>
      </div>}
      {tab === "الإضاءة" && <div className="space-y-2">
        <Row label="التوهج"><Slide v={fx.glow ?? 0} min={0} max={20} on={(n) => u({ glow: n })} /></Row>
        <Row label="الانتشار"><Slide v={fx.spread ?? (fx.glow ?? 0) * 2} min={0} max={80} on={(n) => u({ spread: n })} /></Row>
        <Row label="لون الضوء"><Col v={fx.gc} on={(c) => u({ gc: c })} peek={pk({ gc: "" })} /></Row>
        <Row label="الظل"><Slide v={fx.sh ?? 0} min={0} max={20} on={(n) => u({ sh: n })} /></Row>
        <Row label="زجاج"><Slide v={fx.blur ?? 0} min={0} max={30} on={(n) => u({ blur: n })} /></Row>
        <Row label="نبض حي"><button onClick={() => u({ pulse: !fx.pulse })} className={btn(!!fx.pulse)}>{fx.pulse ? "يعمل" : "متوقف"}</button></Row>
        <Row label="زخرفة">{([["none", "بدون"], ["grid", "شبكة"], ["dots", "نقاط"], ["orbit", "مدارات"], ["lines", "خطوط"]] as const).map(([k, l]) => <button key={k} onClick={() => u({ tex: k })} className={btn((fx.tex ?? "none") === k)}>{l}</button>)}</Row>
      </div>}
      {tab === "الشكل" && <div className="space-y-2">
        <Row label="كل الزوايا"><Slide v={r[0]} min={0} max={48} on={(n) => u({ r: [n, n, n, n] })} /></Row>
        {["أعلى يسار", "أعلى يمين", "أسفل يمين", "أسفل يسار"].map((l, j) => <Row key={l} label={l}><Slide v={r[j]!} min={0} max={48} on={(n) => setR(j, n)} /></Row>)}
        <Row label="سماكة الحد"><Slide v={fx.bw ?? 0} min={0} max={10} on={(n) => u({ bw: n })} /></Row>
        <Row label="نوع الحد">{([["solid", "متصل"], ["dashed", "متقطع"], ["dotted", "منقط"], ["double", "مزدوج"]] as const).map(([k, l]) => <button key={k} onClick={() => u({ bs: k, bw: fx.bw || 2 })} className={btn((fx.bs ?? "solid") === k)}>{l}</button>)}</Row>
        <Row label="لون الحد"><Col v={fx.bc} on={(c) => u({ bc: c, bw: fx.bw || 2 })} peek={pk({ bc: "" })} /></Row>
        <Row label="الحشوة"><Slide v={fx.pad ?? 0} min={0} max={60} on={(n) => u({ pad: n })} /></Row>
        {piece && <><Row label="الارتفاع"><Slide v={fx.h ?? 6} min={1} max={160} on={(n) => u({ h: n })} /></Row><Row label="العرض %"><Slide v={fx.w ?? 100} min={5} max={100} on={(n) => u({ w: n })} /></Row></>}
      </div>}
      {tab === "الموضع" && <div className="space-y-2">
        <Row label="الحجم %"><Slide v={fx.sc ?? 100} min={40} max={200} step={5} on={(n) => u({ sc: n })} /></Row>
        <Row label="إزاحة"><Slide v={fx.dx ?? 0} min={-200} max={200} step={4} on={(n) => u({ dx: n })} /></Row>
        <Row label="الطبقة"><button onClick={() => u({ z: (fx.z ?? 0) + 1 })} className={btn(false)}>للأمام</button><button onClick={() => u({ z: (fx.z ?? 0) - 1 })} className={btn(false)}>للخلف</button><span>{fx.z ?? 0}</span></Row>
        <Row label="ترتيب الداخل"><button onClick={() => u({ row: false })} className={btn(!fx.row)}>عمودي</button><button onClick={() => u({ row: true })} className={btn(!!fx.row)}>أفقي</button></Row>
        {fx.row && <Row label="تقسيم"><button onClick={() => u({ ratio: "eq" })} className={btn(fx.ratio !== "30")}>متساوي</button><button onClick={() => u({ ratio: "30" })} className={btn(fx.ratio === "30")}>٣٠ / ٧٠</button></Row>}
      </div>}
      {tab === "الأنماط" && <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {[...PRESETS, ...mine].map(([n, p]) => (
            <button key={n} onMouseEnter={() => peek({ ...fx, ...p })} onMouseLeave={() => peek(null)} onClick={() => set({ ...fx, ...p })} className="rounded-lg border border-border p-1 text-xs">
              <div className="mb-1 h-8" style={fxStyle({ ...p, pad: 0 }).inner} />{n}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={() => { const n = prompt("اسم النمط"); if (!n) return; const l: [string, Fx][] = [...loadP(), [n, fx]]; localStorage.setItem(PK, JSON.stringify(l)); setMine(l); }} className={btn(true)}>حفظ هذا النمط</button>
          <button onClick={() => set({})} className={btn(false)}>مسح كل التنسيق</button>
        </div>
      </div>}
    </div>
  );
}

export type Dir = "tl" | "t" | "tr" | "l" | "c" | "r" | "bl" | "b" | "br";
export function Dpad({ on }: { on: (d: Dir) => void }) {
  const cells: [Dir, string, string][] = [["tl", "↖", "أعلى يسار"], ["t", "↑", "للأعلى"], ["tr", "↗", "أعلى يمين"], ["l", "←", "لليسار"], ["c", "●", "المنتصف"], ["r", "→", "لليمين"], ["bl", "↙", "أسفل يسار"], ["b", "↓", "للأسفل"], ["br", "↘", "أسفل يمين"]];
  return (
    <div dir="ltr" className="grid w-fit grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1 shadow-xl">
      {cells.map(([d, s, l]) => <button key={d} aria-label={l} title={l} onMouseDown={(e) => e.preventDefault()} onClick={() => on(d)} className="h-8 w-8 rounded-lg border border-border bg-background text-base font-bold hover:bg-accent">{s}</button>)}
    </div>
  );
}
