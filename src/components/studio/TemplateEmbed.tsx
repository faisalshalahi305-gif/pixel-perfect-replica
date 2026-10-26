import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { contrastFor, type El, type Template } from "@/lib/studio";
import { loadTemplate } from "@/lib/studio-data";
import { TemplateRender } from "@/components/studio/ElementView";

// Templates usable as lesson elements (everything except reusable components).
export async function fetchLessonTemplates(): Promise<Template[]> {
  const { data } = await supabase.from("templates").select("*").neq("category", "مكون").order("sort_order", { ascending: true }).order("updated_at", { ascending: false });
  return (data ?? []) as unknown as Template[];
}

// ---------- Auto layout ----------
// Converts absolute (x, y) canvas elements into a responsive flow tree:
// containers wrap the elements they fully enclose, siblings are grouped into rows,
// all spacing is expressed as a % of the parent width, and text never has a fixed
// height, so the template grows with its content instead of clipping it.
type Box = { x: number; y: number; w: number; h: number };
type Node = { e: El | null; box: Box; kids: Node[] };
const SHAPES = new Set(["rect", "circle", "card", "frame"]);
const contains = (a: Box, b: Box) => a.x <= b.x + 1 && a.y <= b.y + 1 && a.x + a.w >= b.x + b.w - 1 && a.y + a.h >= b.y + b.h - 1 && a.w * a.h > b.w * b.h;

export function buildTree(t: Template): Node {
  const els = t.elements.filter((e) => !e.hidden && e.type !== "guide");
  const root: Node = { e: null, box: { x: 0, y: 0, w: t.width, h: t.height }, kids: [] };
  const nodes = els.map((e) => ({ e, box: { x: e.x, y: e.y, w: e.w, h: e.h }, kids: [] as Node[] }));
  for (const n of nodes) {
    let parent: Node = root;
    for (const c of nodes) {
      if (c === n || !SHAPES.has(c.e.type) || !contains(c.box, n.box)) continue;
      if (parent === root || c.box.w * c.box.h < parent.box.w * parent.box.h) parent = c;
    }
    parent.kids.push(n);
  }
  return root;
}

function rows(kids: Node[]): Node[][] {
  const s = [...kids].sort((a, b) => a.box.y - b.box.y);
  const out: { bottom: number; items: Node[] }[] = [];
  for (const k of s) {
    const r = out[out.length - 1];
    if (r && k.box.y < r.bottom - Math.min(8, k.box.h / 3)) { r.items.push(k); r.bottom = Math.max(r.bottom, k.box.y + k.box.h); }
    else out.push({ bottom: k.box.y + k.box.h, items: [k] });
  }
  return out.map((r) => r.items.sort((a, b) => a.box.x - b.box.x));
}

type SlotProps = { o?: Record<string, string> | undefined; onEdit?: ((elId: string, v: string) => void) | undefined; color?: string | undefined; scale: number; tw: number; t: Template };

function Slot({ value, onChange, style }: { value: string; onChange?: ((v: string) => void) | undefined; style: CSSProperties }) {
  const r = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => { if (r.current && r.current.textContent !== value) r.current.textContent = value; }, [value]);
  return <span ref={r} data-line={onChange ? "" : undefined} contentEditable={!!onChange} suppressContentEditableWarning
    onInput={(ev) => onChange?.(ev.currentTarget.textContent ?? "")}
    onPaste={(ev) => { ev.preventDefault(); document.execCommand("insertText", false, ev.clipboardData.getData("text/plain")); }}
    style={{ outline: "none", width: "100%", minHeight: "1em", display: "block", whiteSpace: "pre-wrap", overflowWrap: "anywhere", ...style }} />;
}

function FlowNode({ n, parent, p }: { n: Node; parent: Box; p: SlotProps }) {
  const e = n.e!;
  const pct = (v: number) => `${(v / parent.w) * 100}%`;
  const fs = (px: number) => `max(${Math.min(px, 15) * p.scale}px, ${((px / p.tw) * 100 * p.scale).toFixed(3)}cqw)`;
  const isText = e.text !== undefined && e.type !== "icon";
  const base: CSSProperties = {
    position: "relative", width: pct(e.w), flexShrink: 0, boxSizing: "border-box",
    opacity: e.opacity, background: e.fill, borderRadius: e.radius,
    border: e.borderWidth ? `${e.borderWidth}px ${e.borderStyle} ${e.borderColor}` : undefined,
    boxShadow: e.shadow ? `0 ${Math.round(e.shadow / 3)}px ${e.shadow}px ${e.shadowColor}` : undefined,
    transform: e.rotation ? `rotate(${e.rotation}deg)` : undefined,
    // (22) decorative parts are locked in the lesson: not selectable, not editable, not deletable
    ...(isText ? {} : { userSelect: "none", WebkitUserSelect: "none" }),
  };
  const lock = { contentEditable: false as const, suppressContentEditableWarning: true, "data-locked": "" };
  if (e.type === "image") return <div {...lock} style={{ ...base, aspectRatio: `${e.w} / ${e.h}`, overflow: "hidden" }}>{e.src && <img src={e.src} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: e.fit ?? "cover", objectPosition: `${e.cropX ?? 50}% ${e.cropY ?? 50}%` }} />}</div>;
  if (n.kids.length) return <div {...lock} style={{ ...base, minHeight: 0 }}><Flow kids={n.kids} box={n.box} p={p} /></div>;
  if (e.type === "icon") return <div {...lock} style={{ ...base, aspectRatio: `${e.w} / ${e.h}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: fs(e.fontSize), lineHeight: 1 }}>{e.text}</div>;
  if (!isText || (SHAPES.has(e.type) && !e.text)) return <div {...lock} style={{ ...base, aspectRatio: `${e.w} / ${Math.max(1, e.h)}` }} />;
  const pad = e.type === "line" ? 0 : `${(e.padding / e.w) * 100}%`;
  return (
    <div {...lock} style={{ ...base, padding: pad, display: "flex", alignItems: "center", minHeight: fs(e.fontSize * e.lineHeight) }}>
      <Slot value={p.o?.[e.id] ?? e.text ?? ""} onChange={p.onEdit ? (v) => p.onEdit!(e.id, v) : undefined}
        style={{ color: p.color ?? (e.autoContrast ? contrastFor(e, p.t) : e.color), fontSize: fs(e.fontSize), fontWeight: e.fontWeight, fontFamily: e.fontFamily, textAlign: e.align, direction: e.dir, letterSpacing: e.letterSpacing, lineHeight: e.lineHeight }} />
    </div>
  );
}

// A decorative leaf (bar, line, empty shape) that runs beside several stacked
// siblings must not glue them into one row; it is drawn as an overlay instead,
// stretched over the rows it spans, so the studio look stays identical.
export function splitSpanning(kids: Node[]): { flow: Node[]; spans: Node[] } {
  const isDecor = (n: Node) => !n.kids.length && n.e!.type !== "image" && n.e!.type !== "icon" && !(n.e!.text ?? "").trim();
  const spans: Node[] = [];
  for (const d of kids) {
    if (!isDecor(d)) continue;
    const others = kids.filter((k) => k !== d && !spans.includes(k) && k.box.y < d.box.y + d.box.h - 1 && k.box.y + k.box.h > d.box.y + 1);
    if (rows(others).length >= 2) spans.push(d);
  }
  return { flow: kids.filter((k) => !spans.includes(k)), spans };
}

function Flow({ kids, box, p }: { kids: Node[]; box: Box; p: SlotProps }) {
  const { flow, spans } = splitSpanning(kids);
  const rs = rows(flow);
  const pct = (v: number) => `${(Math.max(0, v) / box.w) * 100}%`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [geo, setGeo] = useState<{ top: number; height: number }[]>([]);
  const spanRows = spans.map((s) => {
    const idx = rs.map((r, i) => (r.some((k) => k.box.y < s.box.y + s.box.h - 1 && k.box.y + k.box.h > s.box.y + 1) ? i : -1)).filter((i) => i >= 0);
    return { a: idx[0] ?? 0, b: idx[idx.length - 1] ?? 0 };
  });
  const key = spanRows.map((r) => `${r.a}-${r.b}`).join(",");
  useLayoutEffect(() => {
    if (!spans.length || !wrapRef.current) return;
    const measure = () => {
      const w = wrapRef.current; if (!w) return;
      const base = w.getBoundingClientRect().top;
      setGeo(spanRows.map(({ a, b }) => {
        const ra = rowRefs.current[a]?.getBoundingClientRect(); const rb = rowRefs.current[b]?.getBoundingClientRect();
        if (!ra || !rb) return { top: 0, height: 0 };
        return { top: ra.top - base, height: rb.bottom - ra.top };
      }));
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, spans.length]);
  let prevBottom = box.y;
  const out: ReactNode[] = rs.map((r, ri) => {
    const top = Math.min(...r.map((k) => k.box.y));
    const gapTop = top - prevBottom;
    prevBottom = Math.max(...r.map((k) => k.box.y + k.box.h));
    let cursor = box.x;
    return (
      <div key={ri} ref={(el) => { rowRefs.current[ri] = el; }} dir="ltr" style={{ display: "flex", alignItems: "flex-start", marginTop: pct(gapTop) }}>
        {r.map((k) => {
          const ml = k.box.x - cursor; cursor = Math.max(cursor, k.box.x + k.box.w);
          return <div key={k.e!.id} style={{ marginLeft: ml >= 0 ? pct(ml) : 0, marginTop: pct(k.box.y - top), width: pct(k.box.w), flexShrink: 0, display: "flex" }}><div style={{ width: "100%" }}><FlowNode n={{ ...k, e: { ...k.e!, w: k.box.w } }} parent={k.box} p={p} /></div></div>;
        })}
      </div>
    );
  });
  const last = Math.max(prevBottom, ...spans.map((s) => s.box.y + s.box.h));
  return (
    <div ref={wrapRef} style={{ position: "relative", paddingBottom: pct(box.y + box.h - last > 0 && kids.length ? Math.min(box.y + box.h - last, box.w * 0.15) : 0) }}>
      {out}
      {spans.map((s, i) => {
        const e = s.e!; const g = geo[i];
        return <div key={e.id} contentEditable={false} data-locked="" style={{
          position: "absolute", left: pct(e.x - box.x), width: pct(e.w), top: g?.top ?? 0, height: g?.height ?? 0, pointerEvents: "none",
          opacity: e.opacity, background: e.fill, borderRadius: e.radius,
          border: e.borderWidth ? `${e.borderWidth}px ${e.borderStyle} ${e.borderColor}` : undefined,
          boxShadow: e.shadow ? `0 ${Math.round(e.shadow / 3)}px ${e.shadow}px ${e.shadowColor}` : undefined,
        }} />;
      })}
    </div>
  );
}

// Wrapper fixes width math: a child's % width is relative to its own box, so wrap it.
export function TemplateFlow({ t, ...p }: { t: Template } & Omit<SlotProps, "tw">) {
  const tree = buildTree(t);
  const full = t.display_mode === "full";
  // (26) full-width strip breaks out to the screen edges; boxed stays centered with margins
  const wrap: CSSProperties = full ? { width: "100vw", position: "relative", insetInlineStart: "50%", marginInlineStart: "-50vw" } : { width: "100%", maxWidth: 760, marginInline: "auto" };
  return <div style={wrap}><div style={{ containerType: "inline-size", width: "100%", background: "transparent" }}><Flow kids={tree.kids} box={tree.box} p={{ ...p, tw: t.width, t }} /></div></div>;
}

// A lesson block that shows a Template Studio template as a native part of the page:
// transparent, auto-growing, and its texts are editable in place.
export function TemplateEmbed({ id, onPick, o, onEdit, color, scale = 1 }: {
  id?: string | undefined; onPick: (id: string) => void; o?: Record<string, string> | undefined;
  onEdit?: (elId: string, v: string) => void; color?: string | undefined; scale?: number;
}) {
  const [t, setT] = useState<Template | null>(null);
  const [list, setList] = useState<Template[] | null>(null);
  useEffect(() => { if (id) void loadTemplate(id).then(setT); else setT(null); }, [id]);
  const openPicker = () => { void fetchLessonTemplates().then(setList); };

  return (
    <div className="relative">
      {t ? <TemplateFlow t={t} o={o} onEdit={onEdit} color={color} scale={scale} /> : id ? null : (
        <button onClick={openPicker} className="w-full rounded-xl border-2 border-dashed border-border p-8 text-muted-foreground hover:bg-accent/30">🧩 اختر قالباً من مصنع القوالب لعرضه هنا</button>
      )}
      {list && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={() => setList(null)}>
          <div dir="rtl" className="max-h-[80vh] w-[min(560px,92vw)] overflow-auto rounded-xl bg-card p-4" onClick={(e) => e.stopPropagation()}>
            <b>اختر قالباً</b>
            {list.length === 0 && <p className="mt-2 text-sm text-muted-foreground">لا توجد قوالب بعد — أنشئ واحداً من استوديو القوالب.</p>}
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {list.map((x) => (
                <button key={x.id} onClick={() => { onPick(x.id); setList(null); }} className="rounded border border-border p-1 hover:bg-muted">
                  <TemplateRender t={x} scale={140 / Math.max(x.width, x.height, 1)} />
                  <div className="text-xs">{x.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
