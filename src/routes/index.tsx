import { NOVA, nova } from "@/components/NovaFrames";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { Block, BlockType as T } from "@/lib/lesson-blocks";
import { defaultBlocks } from "@/lib/lesson-content";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import cover from "@/assets/space-cover.jpg";
import { TemplateEmbed, fetchLessonTemplates } from "@/components/studio/TemplateEmbed";
import { TemplateRender } from "@/components/studio/ElementView";
import { FxPanel, Dpad, fxStyle, type Dir } from "@/components/studio/Fx";
import type { Fx } from "@/lib/lesson-blocks";
import type { Template } from "@/lib/studio";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "قوانين كبلر وقانون الجذب العام | فيصل المطيري" },
      { name: "description", content: "درس فيزياء ثاني ثانوي: قوانين كبلر الثلاثة وقانون الجذب العام مع أسئلة وحل المسائل." },
      { property: "og:title", content: "قوانين كبلر وقانون الجذب العام" },
      { property: "og:description", content: "درس تفاعلي لعرضه على البروجكتور: صور، أسئلة عميقة، ومعادلات." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lesson,
});

const CMDS: Record<string, T> = {
  "جدول": "section", "رئيسي": "h2", "فرعي": "h3", "مربع": "callout", "مقارنة": "compare", "سؤال": "qa",
  "بطاقة": "cards", "معادلة": "eq", "نقاط": "list", "صورة": "img", "قائمة": "media", "تلوين": "color",
  "اقتباس": "quote", "تعريف": "def", "شرح": "explain", "خطوات": "steps", "زبدة": "summary", "توضيح": "clarify",
  "لوحة": "panel", "إطار": "framed", "لسان": "tab", "غائر": "inset", "شريط": "rail", "متقطع": "dashed", "عمودين": "split", "مشطوف": "bevel", "كبسولة": "capsule", "وسم": "tagbox",
  "مؤشر": "pointer", "نقش": "etch", "زوايا": "corners", "أمواج": "waves", "درع": "shield", "مصفوفة": "reticle", "شرائح": "slats", "بوابة": "gate", "وسام": "medal", "صدارة": "lead", "تنفيذي": "exec", "أفق": "horizon", "قائد": "chief", "وثيقة": "doc", "متن": "prose", "شريحة": "sheet", "لوحة2": "spread", "حاوية": "holder", "قالب": "tpl", "دمج": "group", "قطعةشريط": "bar", "قطعةوسم": "badge", "قطعةفاصل": "divider", "قطعةفراغ": "spacer",
  ...Object.fromEntries(NOVA.map(([w, , t]) => [w, t])),
};
const BOX_COLORS = ["#7dd3fc", "#38bdf8", "#0284c7", "#6ee7b7", "#34d399", "#059669", "#fde68a", "#fbbf24", "#d97706", "#fdba74", "#fb923c", "#fca5a5", "#f87171", "#dc2626", "#c4b5fd", "#a78bfa", "#7c3aed", "#f9a8d4", "#f472b6", "#94a3b8", "#000000"];
const TEXT_FIRST: T[] = ["h2", "h3", "eq", "callout", "color", "section", "quote", "def", "life", "explain", "clarify", "summary", "steps", "panel", "framed", "tab", "inset", "rail", "dashed", "split", "bevel", "capsule", "tagbox", "pointer", "etch", "corners", "waves", "shield", "reticle", "slats", "gate", "medal", "lead", "exec", "horizon", "chief", "doc", "prose", "sheet", "spread", "holder", ...NOVA.map(([, , t]) => t)];
const COLORS = [
  "#ffffff", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#2563eb",
  "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#84cc16",
  "#fef08a", "#fde047", "#fbbf24", "#f59e0b", "#fb923c",
  "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#f43f5e",
  "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6", "#f472b6",
  "#ffffff", "#f1f5f9", "#cbd5e1", "#94a3b8", "#64748b",
  "#000000",
];
const SIZES = [1, 1.15, 1.3, 1.5, 1.75, 2];
const PIECES: string[] = ["bar", "badge", "divider", "spacer"];
const WORDS = new Set([...Object.keys(CMDS), "لون", "تكبير", "تصغير", "إلغاء", "الغاء"]);
// Strip invisible RTL marks/odd spaces; accept "word!" or "!word" (also Arabic/fullwidth "!").
export const cmdWord = (raw: string): string => {
  const s = raw.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u061C\uFEFF\u0640]/g, "").replace(/[\u00A0\s]+/g, " ").replace(/[！¡]/g, "!").trim();
  const m = s.match(/^!\s*(\S+)$/) || s.match(/^(\S+)\s*!$/);
  return m && WORDS.has(m[1]!) ? m[1]! : "";
};

type Mode = { color?: string | undefined; size: number; palette: boolean; del: boolean; view?: boolean };
type Ctx = { mode: Mode; setMode: (m: Partial<Mode>) => void; active: string | null; setActive: (id: string) => void; paint: { current: ((c: string) => void) | null } };
const ModeCtx = createContext<Ctx>({ mode: { size: 0, palette: false, del: false }, setMode: () => {}, active: null, setActive: () => {}, paint: { current: null } });

const uid = () => Math.random().toString(36).slice(2, 10);
const line = (m?: Mode): Block => ({ id: uid(), type: "p", text: "", ...(m?.color ? { c: m.color } : {}), ...(m?.size ? { s: m.size } : {}) });
const lines = (n: number) => Array.from({ length: n }, () => line());
const make = (id: string, type: T): Block => {
  if (type.startsWith("x")) return { id, type, text: "", a: "" };
  if (type === "group") return { id, type, text: "", children: [{ id: uid(), type: "h3", text: "" }, { id: uid(), type: "p", text: "" }], fx: { kind: "solid", c1: "#38bdf8", op: 8, bw: 1, bc: "#38bdf8", r: [16, 16, 16, 16], pad: 18 } };
  if (type === "bar") return { id, type, text: "", fx: { kind: "linear", c1: "#38bdf8", c2: "#0f172a", ang: 90, h: 5, w: 40, r: [6, 6, 6, 6] } };
  if (type === "badge") return { id, type, text: "", fx: { kind: "solid", c1: "#fbbf24", r: [99, 99, 99, 99], pad: 4, al: "r", tc: "#0f172a" } };
  if (type === "divider") return { id, type, text: "", k: "#38bdf8", fx: { dv: "fade" } };
  if (type === "spacer") return { id, type, text: "", fx: { h: 32 } };
  switch (type) {
    case "list": return { id, type, text: "", items: [""] };
    case "qa": return { id, type, text: "", a: "" };
    case "cards": return { id, type, text: "", items: ["", "", ""] };
    case "compare": return { id, type, text: "", items: ["", "", "", ""] };
    case "section": return { id, type, text: "", children: lines(3) };
    case "quote": case "def": case "life": case "explain": case "clarify":
    case "panel": case "framed": case "tab": case "inset": case "rail": case "dashed": case "split": case "bevel": case "capsule": case "tagbox": case "pointer": case "etch": case "corners": case "waves": case "shield": case "reticle": case "slats": case "gate": case "medal": case "lead": case "exec": case "horizon": case "chief": case "doc": case "prose": case "sheet": case "spread": case "holder": return { id, type, text: "", a: "" };
    case "steps": case "summary": return { id, type, text: "", items: ["", ""] };
    default: return { id, type, text: "" };
  }
};
const styleOf = (b: Block): CSSProperties => ({ ...(b.c ? { color: b.c } : {}), ...(b.s ? { fontSize: `${SIZES[b.s]}em` } : {}) });

let focusId: string | null = null;
const focusEnd = (el: HTMLElement) => {
  el.focus();
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
  getSelection()?.removeAllRanges(); getSelection()?.addRange(r);
};
const moveLine = (from: HTMLElement, dir: 1 | -1) => {
  const all = Array.from(document.querySelectorAll<HTMLElement>("[data-line]"));
  const n = all[all.indexOf(from) + dir];
  if (n) focusEnd(n);
};

// ===== Rich text: each field may hold formatted HTML (headings, colors, sizes) =====
const clean = (html: string) => {
  const d = document.createElement("div"); d.innerHTML = html;
  d.querySelectorAll("script,style,iframe,object,embed").forEach((n) => n.remove());
  d.querySelectorAll("*").forEach((n) => { for (const a of Array.from(n.attributes)) if (a.name !== "style" && a.name !== "data-f") n.removeAttribute(a.name); });
  return d.innerHTML;
};
const readField = (el: HTMLElement) => (el.querySelector("*") ? clean(el.innerHTML) : el.textContent ?? "");
const writeField = (el: HTMLElement, v: string) => { if (v.includes("<")) el.innerHTML = clean(v); else el.textContent = v; };
const FMT: Record<string, string> = {
  h1: "display:block;font-size:2em;font-weight:800;color:var(--primary)",
  h2: "display:block;font-size:1.45em;font-weight:700;color:var(--primary)",
  mark: "background:var(--primary);color:var(--primary-foreground);border-radius:.4em;padding:0 .3em;font-weight:700",
  p: "",
};
function applyFmt(kind: "h1" | "h2" | "mark" | "p" | "big" | "small" | "color", color?: string) {
  const sel = getSelection(); if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const host = (range.commonAncestorContainer instanceof HTMLElement ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement)?.closest<HTMLElement>("[data-line]");
  if (!host || range.collapsed) return;
  const frag = range.extractContents();
  const span = document.createElement("span");
  if (kind === "p") { span.textContent = frag.textContent ?? ""; }
  else {
    span.appendChild(frag);
    if (kind === "big" || kind === "small") {
      const cur = parseFloat(span.style.fontSize) || 1; span.style.fontSize = `${(kind === "big" ? cur * 1.2 : cur / 1.2).toFixed(2)}em`;
    } else if (kind === "color") span.style.color = color ?? "";
    else span.setAttribute("style", FMT[kind]!);
  }
  range.insertNode(span);
  sel.removeAllRanges(); const nr = document.createRange(); nr.selectNodeContents(span); sel.addRange(nr);
  host.dispatchEvent(new Event("input", { bubbles: true }));
}
function FormatBar() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [cols, setCols] = useState(false);
  useEffect(() => {
    const on = () => {
      const s = getSelection(); const n = s?.anchorNode;
      const el = n && (n instanceof HTMLElement ? n : n.parentElement)?.closest("[data-line]");
      if (!s || s.isCollapsed || !el) { setPos(null); setCols(false); return; }
      const r = s.getRangeAt(0).getBoundingClientRect();
      setPos({ x: r.left + r.width / 2, y: r.top });
    };
    document.addEventListener("selectionchange", on);
    return () => document.removeEventListener("selectionchange", on);
  }, []);
  if (!pos) return null;
  const B = ({ k, children, c }: { k: Parameters<typeof applyFmt>[0]; children: ReactNode; c?: string }) => (
    <button onMouseDown={(e) => { e.preventDefault(); applyFmt(k, c); }} className="rounded-lg px-2 py-1 text-sm font-bold hover:bg-accent">{children}</button>
  );
  return (
    <div style={{ position: "fixed", left: pos.x, top: Math.max(8, pos.y - 56), transform: "translateX(-50%)" }}
      className="z-50 flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-1 text-foreground shadow-xl">
      <div className="flex flex-wrap items-center gap-1">
        <B k="h1">عنوان رئيسي</B><B k="h2">عنوان فرعي</B><B k="mark">بارز</B><B k="big">A+</B><B k="small">A−</B>
        <button onMouseDown={(e) => { e.preventDefault(); setCols(!cols); }} className="rounded-lg px-2 py-1 text-sm font-bold hover:bg-accent">🎨 لون</button>
        <B k="p">نص عادي</B>
      </div>
      {cols && <div className="flex gap-1 p-1">{COLORS.map((c) => (
        <button key={c} aria-label={c} onMouseDown={(e) => { e.preventDefault(); applyFmt("color", c); }} className="h-6 w-6 rounded-full" style={{ backgroundColor: c }} />
      ))}</div>}
    </div>
  );
}

function Field({ id, value, onChange, className = "", ph, onKeyDown, style }: {
  id: string; value: string; onChange: (v: string) => void; className?: string; ph: string; onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void; style?: CSSProperties;
}) {
  const r = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (r.current && readField(r.current) !== value) writeField(r.current, value); }, [value]);
  useEffect(() => { if (focusId === id && r.current) { focusId = null; focusEnd(r.current); } }, [id]);
  return (
    <div
      ref={r} data-line contentEditable suppressContentEditableWarning data-ph={ph} style={style}
      onInput={(e) => onChange(readField(e.currentTarget))}
      onPaste={(e) => {
        e.preventDefault();
        const t = e.clipboardData.getData("text/plain").replace(/\r?\n+/g, " ");
        if (!document.execCommand("insertText", false, t)) {
          const el = e.currentTarget; el.textContent = (el.textContent ?? "") + t; onChange(el.textContent); focusEnd(el);
        }
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === "ArrowDown") { e.preventDefault(); moveLine(e.currentTarget, 1); }
        if (e.key === "ArrowUp") { e.preventDefault(); moveLine(e.currentTarget, -1); }
      }}
      className={`min-h-[1.75em] outline-none empty:before:text-muted-foreground/50 empty:focus:before:content-[attr(data-ph)] ${className}`}
    />
  );
}

function shrink(file: File): Promise<string> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1200 / img.width);
      const cv = document.createElement("canvas");
      cv.width = img.width * k; cv.height = img.height * k;
      cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
      res(cv.toDataURL("image/jpeg", 0.75));
    };
    img.src = URL.createObjectURL(file);
  });
}

function Pic({ src, onChange }: { src?: string | undefined; onChange: (s: string) => void }) {
  const f = useRef<HTMLInputElement>(null);
  return (
    <>
      {src ? (
        <img src={src} alt="" onClick={() => f.current?.click()} className="w-full cursor-pointer rounded-2xl shadow-lg" />
      ) : (
        <button onClick={() => f.current?.click()} className="flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/50 text-muted-foreground">اضغط لاختيار صورة</button>
      )}
      <input ref={f} type="file" accept="image/*" hidden onChange={async (e) => { const x = e.target.files?.[0]; if (x) onChange(await shrink(x)); e.target.value = ""; }} />
    </>
  );
}

let clip: Block[] = [];

const MENU: [string, string][] = [
  ["نسخ", "📋 نسخ القالب"], ["نسخض", "➕ نسخ وإضافة للمنسوخ"], ["لصق", "📥 لصق المنسوخ تحته"],
  ["فوق", "⬆️ سطر فوقه"], ["تحت", "⬇️ سطر تحته"],
  ["رئيسي", "📌 عنوان رئيسي"], ["فرعي", "🔖 عنوان فرعي"], ["جدول", "📊 جدول"], ["سؤال", "❓ سؤال وجواب"],
  ["مقارنة", "⚖️ مقارنة"], ["بطاقة", "🗂️ بطاقات"], ["نقاط", "🔢 نقاط"], ["معادلة", "📐 معادلة"],
  ["مربع", "💡 مربع ملاحظة"], ["تلوين", "🎨 نص بارز ملون"], ["صورة", "🖼️ صورة"], ["قائمة", "📑 صورة مع شرح"], ["قالب", "🧩 قالب من المصنع"],
  ["لون", "🖌️ تغيير اللون"], ["تكبير", "➕ تكبير الخط"], ["تصغير", "➖ تصغير الخط"], ["إلغاء", "🔄 إلغاء التنسيق"], ["حذف", "🗑️ حذف السطر"],
  ["اقتباس", "❝ اقتباس علمي"], ["تعريف", "📖 مصطلح وتعريف"], ["شرح", "📝 فقرة شرح مركز"],
  ["خطوات", "🪜 خطوات متسلسلة"], ["زبدة", "زبدة الموضوع"],
  ["دمج", "🧱 قالب حر من قطع"], ["قطعةشريط", "▬ قطعة: شريط"], ["قطعةوسم", "🏷️ قطعة: وسم"], ["قطعةفاصل", "➖ قطعة: فاصل"], ["قطعةفراغ", "⬜ قطعة: فراغ"],
];
let fxClip: Fx | undefined;
const BANK = "piece-bank";
const loadBank = (): Block[] => { try { return JSON.parse(localStorage.getItem(BANK) ?? "[]"); } catch { return []; } };
const deep = (b: Block): Block => ({ ...JSON.parse(JSON.stringify(b)), id: uid(), ...(b.children ? { children: b.children.map(deep) } : {}) });
const plain = (h?: string) => (h ?? "").replace(/<[^>]*>/g, "").trim();
const WHOLE: string[] = ["img", "media", "eq", "tpl", "compare", "qa", "list", "cards"];
const SINGLE: string[] = ["bar", "badge", "divider", "spacer", "p", "h2", "h3"];
/**
 * Break a block into independent, numbered pieces kept inside a group that carries the
 * original frame + background, so the template looks the same right after disassembly.
 * - group → its children are released (fresh ids, never empty → nothing disappears)
 * - a single piece → unchanged (nothing to split)
 */
export const explode = (b: Block): Block[] => {
  if (b.type === "group") {
    const kids = b.children ?? [];
    if (!kids.length) return [b];
    return kids.map(deep);
  }
  if (SINGLE.includes(b.type)) return [b];
  const col = b.k ?? b.c ?? "#38bdf8";
  const st = { ...(b.c ? { c: b.c } : {}), ...(b.s ? { s: b.s } : {}) };
  const kids: Block[] = [];
  const add = (p: Omit<Block, "id">) => kids.push({ id: uid(), ...p });
  add({ name: "الخط العلوي", type: "bar", text: "", fx: { kind: "linear", c1: col, c2: "#0f172a", ang: 90, h: 4, w: 100, r: [4, 4, 4, 4] } });
  add({ name: "العنصر الجانبي", type: "bar", text: "", fx: { kind: "solid", c1: col, h: 4, w: 12, r: [4, 4, 4, 4], al: "r", glow: 10, gc: col } });
  if (b.num) add({ name: "الرقم", type: "badge", text: b.num, fx: { kind: "solid", c1: col, r: [99, 99, 99, 99], pad: 4, al: "r", tc: "#0f172a" } });
  if (WHOLE.includes(b.type)) add({ ...JSON.parse(JSON.stringify(b)), name: "المحتوى" });
  else if (b.type === "section") (b.children ?? []).forEach((c) => kids.push({ ...deep(c), name: "سطر" }));
  else {
    const hasT = plain(b.text) !== "" || b.a !== undefined || !b.items;
    if (hasT) add({ name: "العنوان", type: "h3", text: b.text, c: col, ...(b.s ? { s: b.s } : {}) });
    if (b.a !== undefined) {
      add({ name: "الخط الفاصل", type: "divider", text: "", k: col, fx: { dv: "fade" } });
      add({ name: "النص", type: "p", text: b.a, ...st });
    }
    (b.items ?? []).forEach((t, j) => add({ name: `بند ${j + 1}`, type: "p", text: t, ...st }));
  }
  add({ name: "الخط السفلي", type: "bar", text: "", fx: { kind: "linear", c1: "#0f172a", c2: col, ang: 90, h: 2, w: 100, r: [2, 2, 2, 2] } });
  return [{ id: uid(), name: "الإطار والخلفية", type: "group", text: "", children: kids, fx: { kind: "linear", c1: col, c2: "#0f172a", ang: 160, op: 12, bw: 1, bc: col, r: [16, 16, 16, 16], pad: 18, ...b.fx } }];
};

const GALLERY_STAGES = ["بداية الموضوع", "العناوين والأسئلة", "المعلومات", "الفقرات والشرح", "التدرج", "ختام الموضوع"];
const GALLERY_RAW: [string, string][] = [
  ["توضيح", "توضيح نقطة"],
  ["لوحة", "لوحة مفتوحة"], ["إطار", "إطار مزدوج"], ["لسان", "صندوق بلسان"], ["غائر", "صندوق غائر"], ["شريط", "شريط جانبي"],
  ["متقطع", "إطار متقطع"], ["عمودين", "عمودين"], ["مشطوف", "بطاقة مشطوفة"], ["كبسولة", "كبسولة"], ["وسم", "صندوق بوسم"],
  ["مؤشر", "مؤشر عمودي"], ["نقش", "نقش مائل"], ["زوايا", "زوايا متقابلة"], ["أمواج", "أمواج"],
  ["درع", "درع مشطوف"], ["مصفوفة", "مصفوفة"], ["شرائح", "شرائح متدرجة"], ["بوابة", "بوابة"], ["وسام", "عنوان: وسام"], ["صدارة", "عنوان: صدارة"], ["تنفيذي", "عنوان: تنفيذي"], ["أفق", "عنوان: أفق"], ["قائد", "عنوان: قائد"], ["وثيقة", "معلومات: وثيقة"], ["متن", "معلومات: متن"], ["شريحة", "معلومات: شريحة"], ["لوحة2", "معلومات: لوحة ممتدة"], ["حاوية", "معلومات: حاوية"],
  ...NOVA.map(([w, l]): [string, string] => [w, l]),
];


function Lines({ blocks, onChange, row, ratio }: { blocks: Block[]; onChange: (b: Block[]) => void; row?: boolean | undefined; ratio?: string | undefined }) {
  const { mode, setMode, active, setActive, paint } = useContext(ModeCtx);
  const [menu, setMenu] = useState<number | null>(null);
  const [tpls, setTpls] = useState<Template[]>([]);
  const [menuTab, setMenuTab] = useState<"base" | "mine">("base");
  const [gallery, setGallery] = useState<number | null>(null);
  const [dots, setDots] = useState<string | null>(null);
  const [edit, setEdit] = useState<string | null>(null);
  const [peek, setPeek] = useState<{ id: string; fx: Fx } | null>(null);
  const [bank, setBank] = useState<Block[]>([]);
  const view = !!mode.view;
  const set = (i: number, patch: Partial<Block>) => onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const remove = (i: number) => {
    if (blocks.length <= 1) return;
    const prev = blocks[i - 1];
    focusId = prev && ["p", "h2", "h3", "eq", "color", "callout"].includes(prev.type) ? prev.id : null;
    onChange(blocks.filter((_, j) => j !== i));
  };
  const run = (i: number, b: Block, raw: string): boolean => {
    const word = cmdWord(raw);
    if (!word) return false;
    const clear = () => { const n = line(mode); focusId = n.id; const next = [...blocks]; next[i] = { ...b, id: n.id, text: "", c: n.c, s: n.s }; onChange(next); };
    if (word === "لون") { paint.current = null; setMode({ palette: true }); clear(); return true; }
    if (word === "تكبير") { const s = Math.min(SIZES.length - 1, mode.size + 1); setMode({ size: s }); focusId = b.id; set(i, { text: "", s }); return true; }
    if (word === "تصغير") { const s = Math.max(0, mode.size - 1); setMode({ size: s }); focusId = b.id; set(i, { text: "", s: s || undefined }); return true; }
    if (word === "إلغاء" || word === "الغاء") { setMode({ size: 0, color: undefined, palette: false }); focusId = b.id; set(i, { text: "", c: undefined, s: undefined, type: "p" }); return true; }
    const t = CMDS[word];
    if (!t) return false;
    const nb = { ...make(b.id, t), ...(mode.color ? { c: mode.color } : {}), ...(mode.size ? { s: mode.size } : {}) };
    const next = [...blocks]; next[i] = nb;
    const tail = line(mode);
    next.splice(i + 1, 0, tail);
    focusId = TEXT_FIRST.includes(t) ? nb.id : t === "list" ? nb.id + "0" : tail.id;
    onChange(next);
    return true;
  };
  const typed = (i: number, b: Block) => (v: string) => { if (b.type === "p" && run(i, b, v)) return; set(i, { text: v }); };
  const keys = (i: number, b: Block) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (b.type === "p" && run(i, b, e.currentTarget.textContent ?? "")) return;
      const n = line(mode); focusId = n.id;
      return onChange([...blocks.slice(0, i + 1), n, ...blocks.slice(i + 1)]);
    }
    if (e.key === "Backspace" && !e.currentTarget.textContent) {
      e.preventDefault();
      if (b.type !== "p") { focusId = b.id; set(i, { type: "p" }); } else remove(i);
    }
  };
  const nudge = (i: number, d: Dir) => {
    const b = blocks[i]!; const fx: Fx = { ...b.fx };
    if (d === "t") return moveBlock(i, -1);
    if (d === "b") return moveBlock(i, 1);
    if (d === "l" || d === "r") { fx.dx = (fx.dx ?? 0) + (d === "l" ? -12 : 12); return set(i, { fx }); }
    if (d === "c") { fx.al = "c"; fx.dx = 0; return set(i, { fx }); }
    fx.al = d.endsWith("l") ? "l" : "r"; fx.dx = 0;
    const rest = blocks.filter((_, j) => j !== i); rest.splice(d.startsWith("t") ? 0 : rest.length, 0, { ...b, fx }); onChange(rest);
  };
  const act = (i: number, w: string) => {
    setDots(null);
    const b = blocks[i]!;
    if (w === "edit") return setEdit(edit === b.id ? null : b.id);
    if (w === "del") return blocks.length > 1 ? onChange(blocks.filter((_, j) => j !== i)) : set(i, make(b.id, "p"));
    if (w === "clone") return onChange([...blocks.slice(0, i + 1), deep(b), ...blocks.slice(i + 1)]);
    if (w === "merge") { const n = blocks[i + 1]; if (!n) return; const g: Block = b.type === "group" ? { ...b, children: [...(b.children ?? []), n] } : { id: uid(), type: "group", text: "", children: [b, n], fx: { r: [16, 16, 16, 16], pad: 12, bw: 1, bc: "#38bdf8" } }; return onChange([...blocks.slice(0, i), g, ...blocks.slice(i + 2)]); }
    if (w === "explode") return onChange([...blocks.slice(0, i), ...explode(b), ...blocks.slice(i + 1)]);
    if (w === "lock") return set(i, { fx: { ...b.fx, lock: !b.fx?.lock } });
    if (w === "copyfx") { fxClip = b.fx; return; }
    if (w === "pastefx") return fxClip && set(i, { fx: { ...fxClip } });
    if (w === "bank") { const l = [...loadBank(), deep(b)]; localStorage.setItem(BANK, JSON.stringify(l)); return; }
  };
  const dotsBtn = (i: number) => {
    const b = blocks[i]!;
    const items: [string, string][] = [["edit", "تعديل وتحريك"], ["del", "حذف"], ["clone", "استنساخ"], ["explode", b.type === "group" ? "تفكيك المجموعة" : "تفكيك إلى قطع"], ["merge", "دمج مع التالي"], ["lock", b.fx?.lock ? "فتح القفل" : "قفل"], ["copyfx", "نسخ التنسيق"], ["pastefx", "لصق التنسيق"], ["bank", "حفظ في درج القطع"]];
    return (
      <>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => setDots(dots === b.id ? null : b.id)} aria-label="خيارات" className={`rounded-full border border-border px-2.5 py-1 text-sm font-black ${dots === b.id || edit === b.id ? "bg-primary text-primary-foreground" : "bg-card"}`}>⋮</button>
        {dots === b.id && <>
          <div className="fixed inset-0 z-40" onClick={() => setDots(null)} />
          <div dir="rtl" className="absolute left-0 top-9 z-50 w-48 rounded-xl border border-border bg-card p-1 shadow-xl">
            {items.map(([w, l]) => <button key={w} onMouseDown={(e) => e.preventDefault()} onClick={() => act(i, w)} disabled={w === "merge" && i === blocks.length - 1} className={`block w-full rounded-lg px-3 py-1.5 text-right text-sm hover:bg-accent disabled:opacity-40 ${w === "del" ? "text-destructive" : ""}`}>{l}</button>)}
          </div>
        </>}
      </>
    );
  };
  const trash = (i: number) => mode.del && !view && (
    <button onClick={() => (blocks.length > 1 ? onChange(blocks.filter((_, j) => j !== i)) : set(i, make(blocks[i]!.id, "p")))} aria-label="حذف"
      className="absolute left-0 -top-1 z-10 rounded-full border border-border bg-card px-2 py-1 text-sm">🗑️</button>
  );
  const applyCmd = (i: number, word: string) => {
    setMenu(null);
    const b = blocks[i]!;
    if (word === "فوق" || word === "تحت") { const n = line(); focusId = n.id; const at = word === "فوق" ? i : i + 1; return onChange([...blocks.slice(0, at), n, ...blocks.slice(at)]); }
    if (word === "نسخ") { clip = [JSON.parse(JSON.stringify(b))]; return; }
    if (word === "نسخض") { clip = [...clip, JSON.parse(JSON.stringify(b))]; return; }
    if (word === "لصق") {
      if (!clip.length) return;
      const clones = clip.map((x) => ({ ...JSON.parse(JSON.stringify(x)), id: uid() }));
      focusId = clones[0]!.id;
      return onChange([...blocks.slice(0, i + 1), ...clones, ...blocks.slice(i + 1)]);
    }
    if (word === "حذف") { if (blocks.length > 1) onChange(blocks.filter((_, j) => j !== i)); else set(i, make(b.id, "p")); return; }
    if (word === "لون") { paint.current = (c) => set(i, { c }); setMode({ palette: true }); return; }
    if (word === "تكبير") { const s = Math.min(SIZES.length - 1, (b.s ?? 0) + 1); setMode({ size: s }); set(i, { s }); return; }
    if (word === "تصغير") { const s = Math.max(0, (b.s ?? 0) - 1); setMode({ size: s }); set(i, { s: s || undefined }); return; }
    if (word === "إلغاء") { setMode({ size: 0, color: undefined, palette: false }); set(i, { c: undefined, s: undefined, type: "p" }); return; }
    const t = CMDS[word];
    if (!t) return;
    const base = make(b.id, t);
    const keep = b.type === "p" && b.text ? (t === "list" ? { items: [b.text] } : { text: b.text }) : {};
    const nb: Block = { ...base, ...keep, ...(b.c ?? mode.color ? { c: b.c ?? mode.color } : {}), ...(b.s ?? mode.size ? { s: b.s ?? mode.size } : {}) };
    const next = [...blocks]; next[i] = nb;
    const tail = line(mode);
    next.splice(i + 1, 0, tail);
    focusId = TEXT_FIRST.includes(t) ? nb.id : t === "list" ? nb.id + "0" : tail.id;
    onChange(next);
  };
  const moveBlock = (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= blocks.length) return;
    const next = [...blocks]; [next[i], next[j]] = [next[j]!, next[i]!]; onChange(next);
  };
  const addTpl = (i: number, id: string) => {
    setMenu(null);
    const b = blocks[i]!;
    const nb: Block = { id: uid(), type: "tpl", text: "", src: id };
    const tail = line(mode); focusId = tail.id;
    const empty = b.type === "p" && !b.text.replace(/<[^>]*>/g, "").trim();
    onChange(empty ? [...blocks.slice(0, i), nb, tail, ...blocks.slice(i + 1)] : [...blocks.slice(0, i + 1), nb, tail, ...blocks.slice(i + 1)]);
  };
  const openMenu = (i: number) => { if (menu === i) return setMenu(null); setMenu(i); setMenuTab("base"); setBank(loadBank()); void fetchLessonTemplates().then((l) => setTpls(l.filter((t) => !t.is_system))); };
  const plus = (i: number) => active === blocks[i]!.id && !view && (
    <>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => openMenu(i)} aria-label="إضافة عنصر"
        className={`absolute top-0 z-10 rounded-full border border-border px-2 py-1 text-sm font-bold ${mode.del ? "left-10" : "left-0"} ${menu === i ? "bg-primary text-primary-foreground" : "bg-card"}`}>＋</button>
      <div className={`absolute top-0 z-10 flex gap-1 ${mode.del ? "left-20" : "left-10"}`}>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => moveBlock(i, -1)} disabled={i === 0} aria-label="نقل للأعلى" className="rounded-full border border-border bg-card px-2 py-1 text-sm disabled:opacity-40">⬆️</button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} aria-label="نقل للأسفل" className="rounded-full border border-border bg-card px-2 py-1 text-sm disabled:opacity-40">⬇️</button>
        {dotsBtn(i)}
      </div>
      {menu === i && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div dir="rtl" className={`absolute bottom-full z-50 mb-1 w-60 rounded-xl border border-border bg-card p-2 shadow-xl ${mode.del ? "left-10" : "left-0"}`}>
            <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-bold">
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => setMenuTab("base")} className={`rounded-md py-1 ${menuTab === "base" ? "bg-card shadow" : ""}`}>العناصر الأصلية</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => setMenuTab("mine")} className={`rounded-md py-1 ${menuTab === "mine" ? "bg-card shadow" : ""}`}>قوالبي ({tpls.length})</button>
            </div>
            {menuTab === "base" && bank.length > 0 && <div className="mb-2 rounded-lg border border-border p-1"><p className="px-1 text-xs text-muted-foreground">درج القطع</p><div className="flex flex-wrap gap-1">{bank.map((x, k) => <button key={k} onMouseDown={(e) => e.preventDefault()} onClick={() => { setMenu(null); onChange([...blocks.slice(0, i + 1), deep(x), ...blocks.slice(i + 1)]); }} className="rounded-md bg-muted px-2 py-0.5 text-xs">قطعة {k + 1}</button>)}<button onMouseDown={(e) => e.preventDefault()} onClick={() => { localStorage.removeItem(BANK); setBank([]); }} className="rounded-md px-2 py-0.5 text-xs text-destructive">تفريغ</button></div></div>}
            {menuTab === "base" && <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setGallery(i); setMenu(null); }} className="mb-2 w-full rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">معرض القوالب ({GALLERY_RAW.length})</button>}
            <div className="grid max-h-72 grid-cols-2 gap-1 overflow-y-auto">
            {menuTab === "mine" ? (tpls.length === 0 ? <p className="col-span-2 p-2 text-center text-xs text-muted-foreground">لا توجد قوالب محفوظة بعد. صمّم قالباً في الاستوديو واضغط قبول.</p> : tpls.map((t) => (
              <button key={t.id} onMouseDown={(e) => e.preventDefault()} onClick={() => addTpl(i, t.id)}
                className="flex flex-col items-center gap-1 rounded-lg p-1 text-sm hover:bg-accent">
                <TemplateRender t={t} scale={90 / Math.max(t.width, t.height, 1)} />
                <span className="line-clamp-1">{t.name}</span>
              </button>
            ))) : MENU.map(([w, label]) => (
              <button key={w} onMouseDown={(e) => e.preventDefault()} onClick={() => applyCmd(i, w)}
                className="rounded-lg px-2 py-1.5 text-right text-sm hover:bg-accent">{label}</button>
            ))}
            </div>
          </div>
        </>
      )}
    </>
  );

  const per = Math.ceil(GALLERY_RAW.length / GALLERY_STAGES.length);
  const galleryView = gallery !== null && (
    <div dir="rtl" className="fixed inset-0 z-[70] overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <h2 className="text-lg font-bold">معرض القوالب</h2>
        <button onClick={() => setGallery(null)} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm">رجوع</button>
      </div>
      <div className="mx-auto max-w-3xl space-y-8 p-4">
        {GALLERY_STAGES.map((stage, si) => (
          <section key={stage}>
            <h3 className="mb-3 text-base font-bold text-primary">{si + 1}. {stage}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {GALLERY_RAW.slice(si * per, si * per + per).map(([w, label]) => (
                <div key={w} className="rounded-2xl border border-border bg-card/40 p-3">
                  <div className="pointer-events-none select-none" aria-hidden>
                    <Lines blocks={[{ ...make("pv-" + w, CMDS[w]!), text: "عنوان أو سؤال", a: "هنا تكتب المعلومة أو الفقرة بالشكل الذي تريده" }]} onChange={() => {}} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold">{label}</span>
                    <button onClick={() => { const at = gallery; setGallery(null); applyCmd(at, w); }} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground">استعمال</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );

  return (
    <div className={row ? "flex flex-wrap items-stretch gap-3" : "space-y-2"}>
      {galleryView}
      {blocks.map((b, i) => {
        const k = keys(i, b);
        const st = styleOf(b);
        const item = (j: number, v: string) => { const items = [...(b.items ?? [])]; items[j] = v; set(i, { items }); };
        const txt = (ph: string, cls = "") => <Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph={ph} className={cls} style={st} />;
        const wrap = (node: ReactNode, cls = "") => {
          const fx = peek?.id === b.id ? peek.fx : b.fx;
          const f = fxStyle(fx);
          if (fx?.w && PIECES.includes(b.type)) { f.inner.width = `${fx.w}%`; f.inner.maxWidth = "100%"; }
          const flex: CSSProperties = row ? (ratio === "30" && i === 0 ? { flex: "0 1 30%", minWidth: 140 } : { flex: "1 1 200px" }) : {};
          return (
            <div key={b.id} className={`relative ${cls}`} style={{ ...f.outer, ...flex }} onClick={(e) => { if (fx?.lock) { e.stopPropagation(); setActive(b.id); } }} onFocus={(e) => { e.stopPropagation(); setActive(b.id); }}>
              {trash(i)}{plus(i)}
              {b.name && !view && (active === b.id || edit === b.id) && <span contentEditable={false} className="absolute -top-3 right-2 z-20 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow">قطعة {i + 1}: {b.name}</span>}
              <div style={f.inner} className={`${f.cls} ${fx?.lock ? "pointer-events-none select-none" : ""}`}>{node}</div>
              {edit === b.id && !view && <div className="relative z-30 mt-2 flex flex-col items-start gap-2">
                <Dpad on={(d) => nudge(i, d)} />
                <FxPanel fx={b.fx ?? {}} piece={PIECES.includes(b.type)} set={(x) => set(i, { fx: x })} peek={(x) => setPeek(x ? { id: b.id, fx: x } : null)} onClose={() => { setEdit(null); setPeek(null); }} />
              </div>}
            </div>
          );
        };
        if (b.type === "group") return wrap(<Lines blocks={b.children ?? []} onChange={(c) => set(i, { children: c })} row={b.fx?.row} ratio={b.fx?.ratio} />);
        if (b.type === "bar") return wrap(<div style={{ height: b.fx?.h ?? 5 }} />);
        if (b.type === "spacer") return wrap(<div style={{ height: b.fx?.h ?? 32 }} className={view ? "" : "rounded border border-dashed border-border/40"} />);
        if (b.type === "badge") return wrap(<Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="01" className="px-3 text-sm font-bold" style={st} />);
        if (b.type === "divider") {
          const col = b.k ?? "#38bdf8"; const dv = b.fx?.dv ?? "fade";
          const line2 = dv === "fade" ? <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${col}, transparent)` }} />
            : dv === "dots" ? <div className="border-t-2 border-dotted" style={{ borderColor: col }} />
            : dv === "double" ? <div className="h-1.5 border-y" style={{ borderColor: col }} />
            : <div className="relative h-px" style={{ background: col }}><div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ background: col }} /></div>;
          return wrap(<div className="py-2">{line2}{active === b.id && !view && <div className="mt-2 flex flex-wrap gap-1 text-xs">{(["fade", "dots", "double", "diamond"] as const).map((x) => <button key={x} onMouseDown={(e) => e.preventDefault()} onClick={() => set(i, { fx: { ...b.fx, dv: x } })} className="rounded border border-border px-2">{{ fade: "متلاشي", dots: "منقط", double: "مزدوج", diamond: "ماسي" }[x]}</button>)}<Accent b={b} set={(x) => set(i, { k: x })} /></div>}</div>);
        }
        if (b.type.startsWith("x")) {
          const col = b.k ?? "#38bdf8";
          const mix = (n: number) => `color-mix(in oklab, ${col} ${n}%, transparent)`;
          const on = active === b.id;
          const hasH = on || !!b.text.replace(/<[^>]*>/g, "").trim();
          const hasB = on || !!(b.a ?? "").replace(/<[^>]*>/g, "").trim();
          const head = (cls = "text-xl font-bold") => <Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="العنوان" className={`${cls} ${hasH ? "" : "hidden"}`} style={{ color: col, ...st }} />;
          const body = (cls = "mt-2") => <Field id={b.id + "a"} value={b.a ?? ""} onChange={(v) => set(i, { a: v })} ph="اكتب هنا…" className={`whitespace-pre-wrap leading-loose ${hasH ? cls : cls.replace(/\bmt-\S+/g, "")} ${hasB ? "" : "hidden"}`} style={st} />;
          const acc = on && <Accent b={b} set={(x) => set(i, { k: x })} />;
          return wrap(nova({ type: b.type, col, mix, head, body, acc, hasH, hasB }));
        }
        switch (b.type) {
          case "p": return wrap(<Field id={b.id} value={b.text} onChange={typed(i, b)} onKeyDown={k} ph="اكتب… (مثال: رئيسي! ثم Enter)" className="leading-loose" style={st} />);
          case "h2": return wrap(txt("عنوان رئيسي", "pt-4 text-4xl font-extrabold text-primary"));
          case "h3": return wrap(txt("عنوان فرعي", "pt-2 text-2xl font-bold text-primary"));
          case "callout": return wrap(<div className="rounded-xl border-r-4 border-primary bg-accent/40 p-5">{txt("ملاحظة أو قانون مهم")}</div>);
          case "color": return wrap(<div className="w-fit min-w-[2.5rem] max-w-full break-words rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">{txt("نص بارز")}</div>);
          case "eq": {
            const m = b.text.match(/^\s*(.+?)\s*=\s*(.*?)\s*([^\s/]+)\s*\/\s*(\S+)\s*$/);
            const sub = (s: string) => s.split(/([a-zA-Z])/).filter(Boolean).map((p, k) => /[a-zA-Z]/.test(p) ? <i key={k} className="font-bold">{p}</i> : <span key={k}>{p}</span>);
            return wrap(<div dir="ltr" className="rounded-xl border-2 border-primary bg-accent py-6 text-center text-accent-foreground">
              {m && active !== b.id ? (
                <div className="flex cursor-text items-center justify-center gap-3 text-4xl" onClick={() => { focusId = b.id; setActive(b.id); }}>
                  <span>{sub(m[1] ?? "")}</span><span>=</span>{m[2] && <span>{sub(m[2])}</span>}
                  <span className="inline-flex flex-col items-center leading-tight"><span className="px-2">{sub(m[3] ?? "")}</span><span className="h-[3px] w-full bg-current" /><span className="px-2">{sub(m[4] ?? "")}</span></span>
                </div>
              ) : <div className="font-mono text-3xl font-bold">{txt("F = G m₁m₂ / r²")}</div>}
            </div>);
          }
          case "list": return wrap(
            <ul className="list-disc space-y-1 pr-6" style={st}>
              {(b.items ?? []).map((v, j) => (
                <li key={j}><Field id={b.id + j} value={v} onChange={(x) => item(j, x)} ph="نقطة"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!v && j === (b.items?.length ?? 1) - 1) { const n = line(mode); focusId = n.id; const next = [...blocks]; next[i] = { ...b, items: b.items!.slice(0, -1).length ? b.items!.slice(0, -1) : [""] }; next.splice(i + 1, 0, n); return onChange(next); }
                      const items = [...(b.items ?? [])]; items.splice(j + 1, 0, ""); focusId = b.id + (j + 1); set(i, { items });
                    }
                    if (e.key === "Backspace" && !v) { e.preventDefault(); if ((b.items?.length ?? 0) > 1) { focusId = b.id + Math.max(0, j - 1); set(i, { items: b.items!.filter((_, x) => x !== j) }); } else remove(i); }
                  }} /></li>
              ))}
            </ul>);
          case "qa": return wrap(<QA b={b} trash={null} st={st} onChange={(p) => set(i, p)} />);
          case "cards": return wrap(
            <div className="space-y-4">
              {b.text && txt("عنوان البطاقات", "text-xl font-bold text-primary")}
              {(b.items ?? []).map((v, j) => (
                <div key={j} className="relative rounded-xl border bg-card p-5" style={{ borderColor: b.k ?? "var(--border)" }}>
                  <Field id={b.id + j} value={v} onChange={(x) => item(j, x)} ph={`بطاقة ${j + 1}`} style={st} />
                  {active === b.id && (b.items?.length ?? 0) > 1 && <button onMouseDown={(e) => e.preventDefault()} onClick={() => set(i, { items: b.items!.filter((_, x) => x !== j) })} aria-label="حذف البطاقة" className="absolute left-2 top-2 rounded-full border border-border bg-card px-2 text-sm">−</button>}
                </div>
              ))}
              {active === b.id && <div className="flex gap-2"><button onMouseDown={(e) => e.preventDefault()} onClick={() => { focusId = b.id + (b.items?.length ?? 0); set(i, { items: [...(b.items ?? []), ""] }); }} className="rounded-full border border-border bg-card px-4 py-1 text-sm">＋ بطاقة</button><Accent b={b} set={(k) => set(i, { k })} /></div>}
            </div>);
          case "compare": return wrap(
            <div className="space-y-3">
              {b.text && txt("عنوان المقارنة", "text-xl font-bold text-primary")}
              <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((j) => (
                <div key={j} className={`rounded-xl bg-card p-5 ${j === 0 ? "border-2 border-primary" : "border border-border"}`}>
                  <Field id={b.id + "h" + j} value={b.items?.[j] ?? ""} onChange={(x) => item(j, x)} ph={j ? "العنوان الثاني" : "العنوان الأول"} style={st} className="mb-2 text-xl font-bold text-primary" />
                  {Array.from({ length: Math.max(1, Math.ceil(((b.items?.length ?? 4) - 2) / 2)) }, (_, row) => {
                    const index = 2 + row * 2 + j;
                    return <Field key={index} id={b.id + "c" + index} value={b.items?.[index] ?? ""} onChange={(x) => item(index, x)} ph="المحتوى" style={st} className="border-t border-border py-2" />;
                  })}
                </div>
              ))}
              </div>
            </div>);
          case "tpl": return wrap(<div tabIndex={-1} className="outline-none" onClick={() => setActive(b.id)}><TemplateEmbed id={b.src} onPick={(src) => set(i, { src })} o={b.o} onEdit={(k, v) => set(i, { o: { ...(b.o ?? {}), [k]: v } })} color={b.c} scale={b.s ? SIZES[b.s]! : 1} /></div>);
          case "img": return wrap(<figure className="space-y-3"><Pic src={b.src} onChange={(src) => set(i, { src })} />{b.text && txt("وصف الصورة")}</figure>);
          case "media": return wrap(
            <figure className="space-y-3">
              <Pic src={b.src} onChange={(src) => set(i, { src })} />
              {txt("اكتب الشرح والوصف هنا")}
            </figure>);
          case "quote": { const col = b.k ?? "#e2c290"; return wrap(
            <blockquote className="relative mx-auto max-w-3xl px-6 py-10 text-center">
              <div className="mx-auto mb-4 h-px w-40" style={{ background: `linear-gradient(90deg,transparent,${col},transparent)` }} />
              <div aria-hidden className="font-serif text-8xl leading-[0.6]" style={{ color: col }}>“</div>
              <Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="نص الاقتباس…" className="mt-4 text-3xl leading-relaxed" style={st} />
              <div className="mt-6 inline-block rounded-full border px-6 py-1" style={{ borderColor: col, color: col }}>
                <Field id={b.id + "a"} value={b.a ?? ""} onChange={(v) => set(i, { a: v })} ph="— القائل أو المصدر" className="text-base tracking-wide" />
              </div>
              <div className="mx-auto mt-6 h-px w-40" style={{ background: `linear-gradient(90deg,transparent,${col},transparent)` }} />
              {active === b.id && <Accent b={b} set={(x) => set(i, { k: x })} />}
            </blockquote>); }
          case "def": { const col = b.k ?? "#60a5fa"; return wrap(
            <div className="max-w-3xl rounded-xl border bg-card/70 p-4" style={{ borderColor: `color-mix(in oklab, ${col} 50%, transparent)` }}>
              <Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="العنوان" className="text-xl font-bold" style={{ color: col, ...st }} />
              <Field id={b.id + "a"} value={b.a ?? ""} onChange={(v) => set(i, { a: v })} ph="النص…" className="mt-2 border-r-2 pr-3 leading-loose" style={{ borderColor: col, ...st }} />
              {active === b.id && <Accent b={b} set={(x) => set(i, { k: x })} />}
            </div>); }
          case "explain": { const col = b.k ?? "#38bdf8"; return wrap(
            <article className="relative px-2 py-8 md:px-12" style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${col} 12%, transparent), transparent)` }}>
              <div className="absolute inset-x-0 top-0 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${col}, transparent)` }} />
              <Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="الفكرة الأساسية" className="mb-4 text-3xl font-black" style={{ color: col, ...st }} />
              <Field id={b.id + "a"} value={b.a ?? ""} onChange={(v) => set(i, { a: v })} ph="اكتب الشرح المفصل هنا…" className="whitespace-pre-wrap text-xl leading-[2.3]" style={st} />
              {active === b.id && <Accent b={b} set={(x) => set(i, { k: x })} />}
            </article>); }
          case "life": { const col = b.k ?? "#34d399"; return wrap(
            <div className="relative rounded-tl-[3rem] rounded-br-[3rem] border-2 border-dashed p-6 pt-10" style={{ borderColor: col, backgroundImage: `radial-gradient(color-mix(in oklab, ${col} 25%, transparent) 1px, transparent 1px)`, backgroundSize: "18px 18px" }}>
              <span className="absolute -top-4 right-6 rounded-lg px-4 py-1 text-sm font-black text-background shadow-lg" style={{ backgroundColor: col }}>🌍 من واقع الحياة ⚡</span>
              <div className="flex items-start gap-4">
                <span className="text-5xl">🏙️</span>
                <div className="flex-1">
                  <Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="عنوان المثال" className="text-xl font-bold" style={{ color: col, ...st }} />
                  <Field id={b.id + "a"} value={b.a ?? ""} onChange={(v) => set(i, { a: v })} ph="اكتب المثال الواقعي…" className="mt-2 whitespace-pre-wrap rounded-xl bg-background/70 p-4 leading-loose" style={st} />
                </div>
              </div>
              {active === b.id && <Accent b={b} set={(x) => set(i, { k: x })} />}
            </div>); }
          case "clarify": { const col = b.k ?? "#a78bfa"; return wrap(
            <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border shadow-2xl backdrop-blur" style={{ borderColor: col, boxShadow: `0 0 40px -10px ${col}` }}>
              <div className="flex items-center gap-4 p-5" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${col} 35%, transparent), transparent)` }}>
                <div className="flex-1">
                <Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="العنوان" className="text-xl font-bold" style={st} /></div>
              </div>
              <div className="border-t border-dashed p-5" style={{ borderColor: col }}>
                <Field id={b.id + "a"} value={b.a ?? ""} onChange={(v) => set(i, { a: v })} ph="النص…" className="whitespace-pre-wrap leading-[2.1]" style={st} />
              </div>
              {active === b.id && <div className="px-5 pb-4"><Accent b={b} set={(x) => set(i, { k: x })} /></div>}
            </div>); }
          case "panel": case "framed": case "tab": case "inset": case "rail": case "dashed": case "split": case "bevel": case "capsule": case "tagbox": case "pointer": case "etch": case "corners": case "waves": case "shield": case "reticle": case "slats": case "gate": case "medal": case "lead": case "exec": case "horizon": case "chief": case "doc": case "prose": case "sheet": case "spread": case "holder": {
            const col = b.k ?? "#38bdf8";
            const mix = (n: number) => `color-mix(in oklab, ${col} ${n}%, transparent)`;
            const on = active === b.id;
            const hasH = on || !!b.text.replace(/<[^>]*>/g, "").trim();
            const hasB = on || !!(b.a ?? "").replace(/<[^>]*>/g, "").trim();
            const head = (cls = "text-xl font-bold") => <Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="العنوان" className={`${cls} ${hasH ? "" : "hidden"}`} style={{ color: col, ...st }} />;
            const body = (cls = "mt-2") => <Field id={b.id + "a"} value={b.a ?? ""} onChange={(v) => set(i, { a: v })} ph="اكتب هنا…" className={`whitespace-pre-wrap leading-loose ${hasH ? cls : cls.replace(/\bmt-\S+/g, "")} ${hasB ? "" : "hidden"}`} style={st} />;
            const acc = active === b.id && <Accent b={b} set={(x) => set(i, { k: x })} />;
            switch (b.type) {
              case "panel": return wrap(<div className="border-y py-6 px-2 md:px-6" style={{ borderColor: mix(50), background: mix(6) }}>{head("text-2xl font-bold")}{body("mt-3")}{acc}</div>);
              case "framed": return wrap(<div className="relative ml-3 mt-3 md:mx-8"><div className="absolute inset-0 -translate-x-3 -translate-y-3 border-2" style={{ borderColor: col }} /><div className="relative border-2 bg-card p-6 text-center" style={{ borderColor: mix(40) }}>{head("text-xl font-bold tracking-wide")}{hasH && hasB && <div className="mx-auto my-3 h-px w-16" style={{ background: col }} />}{body("text-center")}{acc}</div></div>);
              case "tab": return wrap(<div className="pt-2"><div className="inline-block rounded-t-lg px-4 py-1.5" style={{ background: col }}><Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="العنوان" className="font-bold text-background" style={st} /></div><div className="rounded-b-xl rounded-tl-xl border-2 bg-card/60 p-5" style={{ borderColor: col }}>{body("")}{acc}</div></div>);
              case "inset": return wrap(<div className="mx-auto max-w-2xl rounded-[1.75rem] bg-background p-2" style={{ boxShadow: `0 1px 0 ${mix(30)}` }}><div className="flex gap-4 rounded-[1.4rem] bg-muted p-5" style={{ boxShadow: `inset 0 6px 16px rgb(0 0 0 / .45), inset 0 -2px 6px ${mix(20)}` }}><div className="w-1.5 shrink-0 rounded-full" style={{ background: mix(60), boxShadow: `inset 0 2px 4px rgb(0 0 0 / .5)` }} /><div className="flex-1">{head("text-lg font-bold")}{body("mt-1 text-sm")}{acc}</div></div></div>);
              case "rail": return wrap(<div className="border-r-[6px] py-3 pr-5" style={{ borderColor: col, background: `linear-gradient(270deg, ${mix(14)}, transparent 85%)` }}>{head()}{body()}{acc}</div>);
              case "dashed": { const cn = "absolute h-5 w-5"; return wrap(<div className="relative px-7 py-8"><div className="absolute inset-3 border border-dashed" style={{ borderColor: mix(55) }} /><div className={`${cn} top-0 right-0 border-t-[3px] border-r-[3px]`} style={{ borderColor: col }} /><div className={`${cn} top-0 left-0 border-t-[3px] border-l-[3px]`} style={{ borderColor: col }} /><div className={`${cn} bottom-0 right-0 border-b-[3px] border-r-[3px]`} style={{ borderColor: col }} /><div className={`${cn} bottom-0 left-0 border-b-[3px] border-l-[3px]`} style={{ borderColor: col }} /><div className="relative">{head("text-2xl font-light tracking-wide")}{body("mt-3")}{acc}</div></div>); }
              case "split": return wrap(<div className="rounded-xl border bg-card/60 p-5" style={{ borderColor: mix(50) }}><div className="grid grid-cols-2 gap-0"><div className="border-l pl-4" style={{ borderColor: mix(40) }}><Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="اكتب هنا…" className="whitespace-pre-wrap leading-loose" style={st} /></div><div className="pr-4">{body("")}</div></div>{acc}</div>);
              case "bevel": { const poly = (n: number) => `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)`; return wrap(<div className="p-[2px]" style={{ background: col, clipPath: poly(40) }}><div style={{ clipPath: poly(39), background: "var(--card)" }}><div className="px-6 py-3 pl-12" style={{ background: col, clipPath: "polygon(39px 0, 100% 0, 100% 100%, 0 100%, 0 39px)" }}><Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="العنوان" className="text-lg font-black text-background" style={st} /></div><div className="px-6 pb-8 pt-4">{body("")}{acc}</div></div></div>); }
              case "capsule": return wrap(<div className="rounded-[2rem] border px-6 py-3" style={{ borderColor: mix(50), background: mix(10) }}><Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="اكتب هنا…" className="leading-loose" style={st} />{acc}</div>);
              case "pointer": return wrap(<div className="flex gap-4 rounded-xl border bg-card/70 px-5 py-3" style={{ borderColor: mix(35) }}><div className="w-2 shrink-0 rounded-full" style={{ background: `linear-gradient(180deg, ${col}, ${mix(55)})`, boxShadow: `0 0 10px ${mix(35)}` }} /><div className="flex-1">{head()}{body()}{acc}</div></div>);
              case "etch": return wrap(<div className="relative overflow-hidden rounded-xl border bg-card/70 px-5 py-3 pr-14" style={{ borderColor: mix(40) }}><svg className="pointer-events-none absolute inset-y-0 right-0 h-full w-10" preserveAspectRatio="none" viewBox="0 0 64 100">{[0,1,2,3,4,5,6].map((n) => <line key={n} x1={n * 10 - 6} y1="100" x2={n * 10 + 18} y2="0" stroke={col} strokeWidth="2" opacity={0.85 - n * 0.11} />)}</svg><div className="absolute inset-y-4 right-12 w-px" style={{ background: mix(45) }} /><div className="relative">{head()}{body()}{acc}</div></div>);
              case "corners": return wrap(<div className="relative rounded-lg border bg-card/70 px-6 py-3" style={{ borderColor: mix(45) }}><div className="absolute right-0 top-0 h-6 w-6" style={{ background: `linear-gradient(225deg, ${col}, ${mix(50)})`, clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: "0.5rem" }} /><div className="absolute bottom-0 left-0 h-6 w-6" style={{ background: `linear-gradient(45deg, ${col}, ${mix(50)})`, clipPath: "polygon(0 0, 0 100%, 100% 100%)", borderBottomLeftRadius: "0.5rem" }} /><div className="relative">{head()}{body()}{acc}</div></div>);
              case "waves": return wrap(<div className="relative overflow-hidden rounded-2xl border bg-card/70 px-5 pb-6 pt-3" style={{ borderColor: mix(40) }}><svg className="pointer-events-none absolute inset-x-0 bottom-0 h-5 w-full" preserveAspectRatio="none" viewBox="0 0 400 48"><path d="M0 22 C70 4 130 40 200 22 S330 4 400 20 V48 H0Z" fill={mix(22)} /><path d="M0 32 C80 16 150 46 220 30 S340 18 400 32 V48 H0Z" fill={mix(40)} /><path d="M0 32 C80 16 150 46 220 30 S340 18 400 32" fill="none" stroke={col} strokeWidth="1.5" /></svg><div className="relative">{head()}{body()}{acc}</div></div>);
              case "shield": return wrap(<div className="flex items-stretch rounded-l-xl border bg-card/70" style={{ borderColor: mix(45) }}><div className="w-4 shrink-0" style={{ background: `linear-gradient(180deg, ${col}, ${mix(60)})`, clipPath: "polygon(0 12px, 100% 0, 100% 100%, 0 calc(100% - 12px))" }} /><div className="flex-1 px-5 py-3">{head()}{body()}{acc}</div></div>);
              case "reticle": { const m = "absolute h-4 w-4"; return wrap(<div className="relative border bg-card/60 px-6 py-3" style={{ borderColor: mix(30), backgroundImage: `radial-gradient(${mix(25)} 1px, transparent 1px)`, backgroundSize: "18px 18px" }}><div className={`${m} -right-px -top-px border-r-2 border-t-2`} style={{ borderColor: col }} /><div className={`${m} -left-px -top-px border-l-2 border-t-2`} style={{ borderColor: col }} /><div className={`${m} -bottom-px -right-px border-b-2 border-r-2`} style={{ borderColor: col }} /><div className={`${m} -bottom-px -left-px border-b-2 border-l-2`} style={{ borderColor: col }} /><div className="absolute right-3 top-3 h-2 w-2 rounded-full" style={{ background: col }} /><div className="relative">{head("text-xl font-bold tracking-wide")}{body()}{acc}</div></div>); }
              case "slats": return wrap(<div className="flex gap-4 rounded-xl border bg-card/70 px-5 py-3" style={{ borderColor: mix(35) }}><div className="flex shrink-0 flex-col gap-1.5 pt-1.5">{[28, 20, 13, 7].map((w, n) => <div key={w} className="h-1.5 rounded-full" style={{ width: w, background: col, opacity: 1 - n * 0.2 }} />)}</div><div className="flex-1">{head()}{body()}{acc}</div></div>);
              case "gate": { const notch = "polygon(0 0, 100% 0, 100% 30%, calc(100% - 8px) 34%, calc(100% - 8px) 66%, 100% 70%, 100% 100%, 0 100%, 0 70%, 8px 66%, 8px 34%, 0 30%)"; return wrap(<div className="p-[2px]" style={{ background: col, clipPath: notch }}><div className="px-4 py-1.5" style={{ background: "var(--card)", clipPath: notch }}><div className="rounded border px-4 py-2" style={{ borderColor: mix(30) }}>{head()}{body()}{acc}</div></div></div>); }
              case "medal": return wrap(<div className="relative flex w-full items-center gap-3 overflow-hidden rounded-md border px-3 py-2" style={{ borderColor: mix(35), background: `linear-gradient(270deg, ${mix(16)}, transparent 70%)` }}><div className="h-3 w-3 shrink-0 rotate-45" style={{ background: `linear-gradient(135deg, #fff, ${col})`, boxShadow: `0 0 6px ${mix(50)}` }} /><div className="min-w-0 flex-1">{head("text-xl font-extrabold")}{body("mt-1")}{acc}</div><div className="absolute bottom-0 right-0 h-px w-2/3" style={{ background: `linear-gradient(270deg, ${col}, transparent)` }} /></div>);
              case "lead": return wrap(<div className="flex w-full items-stretch gap-3 rounded-lg border bg-card/70 px-3 py-2" style={{ borderColor: mix(30) }}><div className="flex w-1.5 shrink-0 flex-col items-center justify-center rounded-full" style={{ background: mix(70) }}><span className="h-1.5 w-1.5 rounded-full bg-foreground" /></div><div className="w-px shrink-0" style={{ background: mix(40) }} /><div className="min-w-0 flex-1">{head("text-xl font-bold")}{body("mt-1")}{acc}</div></div>);
              case "exec": { const cp = "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)"; return wrap(<div className="w-full p-px" style={{ background: `linear-gradient(225deg, ${col}, ${mix(30)} 40%)`, clipPath: cp }}><div className="px-3.5 py-2" style={{ background: "var(--card)", clipPath: cp }}>{head("text-xl font-bold tracking-wide")}{body("mt-1")}{acc}</div></div>); }
              case "horizon": return wrap(<div className="w-full px-1 py-2" style={{ borderTop: `2px solid ${col}`, borderBottom: `1px solid ${mix(30)}`, background: `linear-gradient(180deg, ${mix(10)}, transparent)` }}>{head("text-xl font-bold")}{body("mt-1")}{acc}</div>);
              case "chief": return wrap(<div className="flex w-full items-stretch gap-3 rounded-r-full rounded-l-md border bg-card/70 py-2 pl-3 pr-4" style={{ borderColor: mix(40) }}><div className="w-1 shrink-0 rounded-full" style={{ background: col }} /><div className="min-w-0 flex-1">{head("text-xl font-extrabold")}{body("mt-1")}{acc}</div></div>);
              case "doc": return wrap(<div className="w-full rounded-md border bg-card/70 px-3.5 py-2.5 shadow-lg" style={{ borderColor: mix(25), boxShadow: `inset 0 1px 0 ${mix(55)}, 0 8px 20px -10px rgb(0 0 0 / .6)` }}>{head("text-lg font-bold")}{body("mt-1")}{acc}</div>);
              case "prose": return wrap(<div className="w-full border-r-2 py-2 pl-2 pr-3" style={{ borderColor: col, background: mix(6) }}>{head("text-lg font-bold")}{body("mt-1")}{acc}</div>);
              case "sheet": { const cp = "polygon(0 0, 100% 0, 100% 100%, 12px 100%, 0 calc(100% - 12px))"; const dot = "absolute h-1 w-1 rounded-full"; return wrap(<div className="relative w-full p-px" style={{ background: mix(40), clipPath: cp }}><div className="relative px-3.5 py-2.5" style={{ background: "var(--card)", clipPath: cp }}><span className={`${dot} right-1.5 top-1.5`} style={{ background: col }} /><span className={`${dot} left-1.5 top-1.5`} style={{ background: mix(60) }} /><span className={`${dot} bottom-1.5 right-1.5`} style={{ background: mix(60) }} />{head("text-lg font-bold")}{body("mt-1")}{acc}</div></div>); }
              case "spread": return wrap(<div className="w-full px-1 py-2.5" style={{ borderBottom: `1px solid ${mix(35)}`, boxShadow: `0 10px 14px -12px ${mix(50)}` }}>{head("text-lg font-bold")}{body("mt-1")}{acc}</div>);
              case "holder": return wrap(<div className="relative w-full rounded-md border px-3.5 py-2.5" style={{ borderColor: mix(30), background: mix(5) }}><div className="pointer-events-none absolute right-1 top-1 h-4 w-4 rounded-tr border-r border-t" style={{ borderColor: col }} />{head("text-lg font-bold")}{body("mt-1")}{acc}</div>);
              default: return wrap(<div className="relative mt-4 rounded-xl border p-5 pt-7" style={{ borderColor: col }}><div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-md border bg-background px-4 py-0.5" style={{ borderColor: col }}><Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="العنوان" className="text-sm font-bold" style={{ color: col, ...st }} /></div>{body("")}{acc}</div>);
            }
          }
          case "steps": case "summary": {
            const col = b.k ?? (b.type === "steps" ? "#38bdf8" : "#fbbf24");
            const listKeys = (j: number, v: string) => (e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter") { e.preventDefault(); const items = [...(b.items ?? [])]; items.splice(j + 1, 0, ""); focusId = b.id + "i" + (j + 1); set(i, { items }); }
              if (e.key === "Backspace" && !v && (b.items?.length ?? 0) > 1) { e.preventDefault(); focusId = b.id + "i" + Math.max(0, j - 1); set(i, { items: b.items!.filter((_, x) => x !== j) }); }
            };
            if (b.type === "summary") return wrap(
              <div className="relative mx-auto max-w-3xl rounded-[2.5rem] border-2 px-8 pb-8 pt-8 text-center" style={{ borderColor: col, background: `radial-gradient(ellipse at top, color-mix(in oklab, ${col} 30%, transparent), transparent 70%)`, boxShadow: `0 0 60px -15px ${col}` }}>
                <Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="زبدة الموضوع" className="mb-5 text-3xl font-black" style={{ color: col, ...st }} />
                <div className="flex flex-wrap justify-center gap-3">
                  {(b.items ?? []).map((v, j) => (
                    <div key={j} className="min-w-[10rem] rounded-full border px-5 py-2" style={{ borderColor: col, backgroundColor: `color-mix(in oklab, ${col} 15%, transparent)` }}>
                      <Field id={b.id + "i" + j} value={v} onChange={(x) => item(j, x)} onKeyDown={listKeys(j, v)} ph="نقطة مهمة" className="font-bold" style={st} />
                    </div>
                  ))}
                </div>
                {active === b.id && <Accent b={b} set={(x) => set(i, { k: x })} />}
              </div>);
            return wrap(
              <div className="space-y-2">
                <Field id={b.id} value={b.text} onChange={(v) => set(i, { text: v })} onKeyDown={k} ph="🪜 عنوان الخطوات" className="mb-4 text-xl font-extrabold" style={{ color: col, ...st }} />
                <div className="flex gap-3 overflow-x-auto pb-3">
                  {(b.items ?? []).map((v, j) => (
                    <div key={j} className="flex shrink-0 items-center gap-3">
                      <div className="w-52 rounded-xl border-t-4 bg-card p-4 shadow-lg" style={{ borderColor: col }}>
                        <div className="mb-2 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-md font-black text-background" style={{ backgroundColor: col }}>{(j + 1).toLocaleString("ar-EG")}</span><span className="text-xs font-bold" style={{ color: col }}>المرحلة</span></div>
                        <Field id={b.id + "i" + j} value={v} onChange={(x) => item(j, x)} onKeyDown={listKeys(j, v)} ph={`الخطوة ${j + 1}`} className="leading-loose" style={st} />
                      </div>
                      {j < (b.items?.length ?? 0) - 1 && <span className="text-3xl" style={{ color: col }}>⟵</span>}
                    </div>
                  ))}
                </div>
                {active === b.id && <Accent b={b} set={(x) => set(i, { k: x })} />}
              </div>);
          }
          case "section": return wrap(
            <section className="my-6 rounded-3xl border border-border bg-card/60 px-4 py-6 md:px-10 md:py-8">
              <div className="mb-4 flex items-start gap-3">
              {b.num && <span className="mt-1 shrink-0 whitespace-nowrap rounded-xl bg-primary px-3 py-1.5 text-xl font-extrabold leading-tight text-primary-foreground md:text-3xl">{b.num}</span>}
              <Field id={b.id} value={b.text} ph="عنوان الجدول" style={st} className={b.a === "box" ? "min-w-0 flex-1 break-words rounded-xl bg-primary px-4 py-2 text-xl font-extrabold leading-snug text-primary-foreground md:text-3xl" : "min-w-0 flex-1 py-1 text-xl font-extrabold leading-snug text-primary md:text-3xl"}
                onChange={(v) => {
                  const w = cmdWord(v);
                  if (w === "تكبير" || w === "تصغير") { const s = Math.max(0, Math.min(SIZES.length - 1, (b.s ?? 0) + (w === "تكبير" ? 1 : -1))); focusId = b.id; return set(i, { text: "", s: s || undefined }); }
                  if (w === "لون") { focusId = b.id; set(i, { text: "" }); paint.current = (c) => set(i, { c }); return setMode({ palette: true }); }
                  if (w === "تلوين") { focusId = b.id; return set(i, { text: "", a: b.a === "box" ? undefined : "box" }); }
                  if (w === "إلغاء" || w === "الغاء") { focusId = b.id; return set(i, { text: "", c: undefined, s: undefined, a: undefined }); }
                  set(i, { text: v });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const n = line(mode); focusId = n.id;
                    set(i, { children: [n, ...(b.children ?? [])] });
                  }
                }} />
              </div>
              <Lines blocks={b.children ?? []} onChange={(c) => set(i, { children: c })} />
            </section>);
          default: return null;
        }
      })}
    </div>
  );
}

function Accent({ b, set }: { b: Block; set: (k: string | undefined) => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" dir="rtl">
      {BOX_COLORS.map((c) => (
        <button key={c} aria-label={`لون ${c}`} onMouseDown={(e) => e.preventDefault()} onClick={() => set(c)}
          className={`h-6 w-6 rounded-full border-2 ${b.k === c ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: c }} />
      ))}
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => set(undefined)} className="text-xs text-muted-foreground">افتراضي</button>
    </div>
  );
}

function QA({ b, trash, st, onChange }: { b: Block; trash: ReactNode; st: CSSProperties; onChange: (p: Partial<Block>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative rounded-xl border border-border bg-card/80 p-5 shadow-sm">{trash}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Field id={b.id} value={b.text} onChange={(v) => onChange({ text: v })} ph="اكتب السؤال هنا؟" className="flex-1 font-bold" style={st} />
        <button onClick={() => setOpen(!open)} className="shrink-0 rounded-lg bg-primary px-5 py-2 font-bold text-primary-foreground">{open ? "إخفاء الإجابة" : "إظهار الإجابة"}</button>
      </div>
      {open && <div className="mt-4 rounded-lg bg-success p-4 text-success-foreground"><Field id={b.id + "a"} value={b.a ?? ""} onChange={(v) => onChange({ a: v })} ph="اكتب الإجابة هنا" style={st} /></div>}
    </div>
  );
}

function Stars() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0, t0 = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const size = () => { c.width = innerWidth; c.height = innerHeight; };
    size();
    addEventListener("resize", size);
    const stars = Array.from({ length: innerWidth < 700 ? 60 : 110 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.3,
      p: Math.random() * Math.PI * 2, s: Math.random() * 0.04 + 0.01, v: Math.random() * 0.0001 + 0.00004,
    }));
    ctx.fillStyle = "#cfe3ff";
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden || t - t0 < 66) return;
      t0 = t;
      ctx.clearRect(0, 0, c.width, c.height);
      for (const st of stars) {
        st.p += st.s; st.y -= st.v; if (st.y < 0) st.y = 1;
        ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(st.p));
        ctx.beginPath(); ctx.arc(st.x * c.width, st.y * c.height, st.r, 0, 7); ctx.fill();
      }
    };
    if (reduce) draw(1000); else raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />;
}

const LS = "lesson-blocks-v2";

function Lesson() {
  const [blocks, setBlocks] = useState<Block[]>(defaultBlocks);
  const [mode, setModeState] = useState<Mode>({ size: 0, palette: false, del: false, view: true });
  const [locked, setLocked] = useState(true);
  const taps = useRef<{ n: number; t: number }>({ n: 0, t: 0 });
  const tap = () => { const now = Date.now(); const c = taps.current; c.n = now - c.t < 1500 ? c.n + 1 : 1; c.t = now; if (c.n >= 10) { c.n = 0; setLocked(false); setMode({ view: false }); } };
  useEffect(() => {
    if (!locked) { document.querySelectorAll("[data-ro]").forEach((el) => { el.removeAttribute("data-ro"); el.setAttribute("contenteditable", "true"); }); return; }
    const lock = () => document.querySelectorAll('[contenteditable="true"],[contenteditable=""]').forEach((el) => { el.setAttribute("contenteditable", "false"); el.setAttribute("data-ro", ""); });
    lock(); const mo = new MutationObserver(lock); mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["contenteditable"] });
    return () => mo.disconnect();
  }, [locked]);
  const [saved, setSaved] = useState(false);
  const setMode = (m: Partial<Mode>) => setModeState((o) => ({ ...o, ...m }));
  const [active, setActive] = useState<string | null>(null);
  const paint = useRef<((c: string) => void) | null>(null);
  const saveNow = async () => { clearTimeout(timer.current); const html = JSON.stringify(blocks); try { localStorage.setItem(LS, html); } catch { /* full */ } last.current = html; const { error } = await supabase.from("lesson_content").upsert({ id: "main", blocks: blocks as never, updated_at: new Date().toISOString() }); if (error) { alert("تعذر الحفظ: " + error.message); return; } setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const last = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const edRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (html?: string | null) => {
      if (!html?.startsWith("[") || html === last.current) return;
      if (edRef.current?.contains(document.activeElement)) return;
      try { last.current = html; setBlocks(JSON.parse(html)); } catch { /* ignore */ }
    };
    apply(localStorage.getItem(LS));
    supabase.from("lesson_content").select("blocks").eq("id", "main").maybeSingle().then(({ data }) => {
      if (data?.blocks) { const html = JSON.stringify(data.blocks); try { localStorage.setItem(LS, html); } catch { /* full */ } apply(html); }
    });
  }, []);

  const hist = useRef<{ past: { t: number; b: Block[] }[]; fut: Block[][] }>({ past: [], fut: [] });
  const lastPush = useRef(0);
  const [showHist, setShowHist] = useState(false);
  const change = (b: Block[], skip = false) => {
    if (!skip) {
      const now = Date.now();
      if (now - lastPush.current > 800) { hist.current.past.push({ t: now, b: blocks }); if (hist.current.past.length > 60) hist.current.past.shift(); }
      lastPush.current = now; hist.current.fut = [];
    }
    setBlocks(b);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const html = JSON.stringify(b);
      try { localStorage.setItem(LS, html); } catch { /* full */ }
      last.current = html;
    }, 700);
  };

  const undo = () => { const p = hist.current.past.pop(); if (!p) return; hist.current.fut.push(blocks); lastPush.current = 0; change(p.b, true); };
  const redo = () => { const f = hist.current.fut.pop(); if (!f) return; hist.current.past.push({ t: Date.now(), b: blocks }); change(f, true); };
  const goTo = (k: number) => { const p = hist.current.past[k]; if (!p) return; hist.current.fut.push(blocks); hist.current.past = hist.current.past.slice(0, k); change(p.b, true); setShowHist(false); };
  const ago = (t: number) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? `قبل ${s} ث` : `قبل ${Math.round(s / 60)} د`; };
  const hb = "rounded-full border border-border bg-card/70 px-3 py-1 text-sm disabled:opacity-40";
  const HDEF = ["فيزياء ٢ — الصف الثاني الثانوي — الفصل الدراسي الأول — الوحدة الأولى", "الجاذبية وحركة الكواكب: قوانين كبلر", "الاسم: <b>فيصل المطيري</b>", "التاريخ: <b>الجمعة ١٦ أكتوبر ٢٠٢٦م</b>", "إعداد الطالب: فيصل المطيري — فيزياء ٢"];
  const meta = blocks.find((x) => x.id === "meta");
  const body = blocks.filter((x) => x.id !== "meta");
  const hv = (j: number) => meta?.items?.[j] ?? HDEF[j]!;
  const setH = (j: number, v: string) => {
    const items = HDEF.map((_, k) => hv(k)); items[j] = v;
    change([...body, { id: "meta", type: "p", text: "", items }]);
  };

  return (
    <ModeCtx.Provider value={{ mode, setMode, active, setActive, paint }}>
      <Stars />
      <main className="min-h-screen text-foreground">
        <header className="relative isolate overflow-hidden py-20 text-center text-foreground">
          <img src={cover} width={1920} height={832} alt="المجموعة الشمسية" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/50 to-background" />
          {mode.view ? (locked ? null : <button onClick={() => setMode({ view: false })} className="absolute left-4 top-4 z-20 rounded-full border border-border bg-card/70 px-4 py-1 text-sm">خروج من العرض</button>) : <>
          <div className="relative z-20 mx-auto -mt-4 mb-6 flex w-fit flex-wrap justify-center gap-2">
            <button onClick={undo} disabled={!hist.current.past.length} className={hb} aria-label="تراجع">↩ تراجع</button>
            <button onClick={redo} disabled={!hist.current.fut.length} className={hb} aria-label="تقدم">تقدم ↪</button>
            <div className="relative"><button onClick={() => setShowHist(!showHist)} className={hb}>السجل</button>
              {showHist && <div dir="rtl" className="absolute right-0 top-9 z-50 w-48 rounded-xl border border-border bg-card p-1 text-right shadow-xl">
                {hist.current.past.length === 0 ? <p className="p-2 text-xs text-muted-foreground">لا توجد خطوات</p> : hist.current.past.map((p, k) => ({ p, k })).slice(-10).reverse().map(({ p, k }) => <button key={k} onClick={() => goTo(k)} className="block w-full rounded-lg px-3 py-1.5 text-sm hover:bg-accent">الرجوع إلى خطوة {k + 1} · {ago(p.t)}</button>)}
              </div>}
            </div>
            <button onClick={() => { setActive(""); setMode({ view: true, del: false }); }} className={hb}>عرض صافي</button>
          </div>
          <button onClick={() => setMode({ del: !mode.del })} aria-label="إدارة العناصر"
            className={`absolute left-4 top-4 rounded-full border border-border px-4 py-1 text-xl ${mode.del ? "bg-primary text-primary-foreground" : "bg-card/70"}`}>…</button>
          <button onClick={saveNow} className={`absolute right-4 top-4 rounded-full border border-border px-4 py-1 text-base font-bold ${saved ? "bg-success text-success-foreground" : "bg-card/70"}`}>{saved ? "✓ تم الحفظ" : "💾 حفظ"}</button>
          <Link to="/simulation" className="absolute left-20 top-4 rounded-full border border-border bg-card/70 px-4 py-1 text-base font-bold">🪐 محاكاة النظام 3D</Link></>}
          <Field id="meta0" value={hv(0)} onChange={(v) => setH(0, v)} ph="سطر المادة" className="px-4 text-lg text-primary" />
          <Field id="meta1" value={hv(1)} onChange={(v) => setH(1, v)} ph="عنوان الدرس" className="mt-3 px-4 text-4xl font-extrabold md:text-6xl" />
          <div className="mt-6 flex flex-col items-center gap-2 text-lg">
            <Field id="meta2" value={hv(2)} onChange={(v) => setH(2, v)} ph="الاسم" className="rounded-full border border-border bg-card/70 px-4 py-1" />
            <Field id="meta3" value={hv(3)} onChange={(v) => setH(3, v)} ph="التاريخ" className="rounded-full border border-border bg-card/70 px-4 py-1" />
          </div>
        </header>
        {mode.palette && (
          <div className="sticky top-2 z-40 mx-auto grid w-fit grid-cols-5 gap-2 rounded-2xl border border-border bg-card p-3 shadow-xl">
            {COLORS.map((c) => (
              <button key={c} aria-label={c} onMouseDown={(e) => { e.preventDefault(); paint.current?.(c); paint.current = null; setMode({ color: c, palette: false }); }}
                className={`h-8 w-8 rounded-full border-2 ${mode.color === c ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
        <div ref={edRef} className={`mx-auto max-w-5xl px-2 py-6 text-lg md:px-8`}>
          <Lines blocks={body} onChange={(b) => change(meta ? [...b, meta] : b)} />
        </div>
        <footer onClick={locked ? tap : undefined} className="select-none py-8 text-center text-muted-foreground"><Field id="meta4" value={hv(4)} onChange={(v) => setH(4, v)} ph="سطر الإعداد" className="px-4" /></footer>
      </main>
    </ModeCtx.Provider>
  );
}
