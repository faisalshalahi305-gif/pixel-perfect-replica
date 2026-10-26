// Template Studio data model. Every template is stored as plain JSON so the
// editor and the public renderer always read the exact same structure.

export type ElType = "text" | "heading" | "button" | "card" | "image" | "rect" | "circle" | "line" | "icon" | "frame" | "guide";

export interface El {
  id: string;
  type: ElType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number; // 0..1
  hidden?: boolean;
  locked?: boolean;
  group?: string;
  master?: string;
  masterEl?: string;
  text?: string;
  src?: string;
  fit?: "cover" | "contain" | "fill";
  cropZoom?: number; // 1 = no zoom
  cropX?: number; // 0..100 focus
  cropY?: number;
  dim?: number; // 0..1 darken filter for images
  fill: string; // color or CSS gradient
  color: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  align: "right" | "center" | "left";
  dir: "rtl" | "ltr";
  letterSpacing: number;
  lineHeight: number;
  padding: number;
  radius: number;
  borderWidth: number;
  borderColor: string;
  borderStyle: "solid" | "dashed" | "dotted";
  shadow: number; // blur px, 0 = none
  shadowColor: string;
  autoGrow?: boolean; // text grows its box (and enclosing frames) instead of clipping
  autoContrast?: boolean; // pick readable text color from what is behind it
  role?: "bg"; // acts as a hosting background layer
}

export interface Template {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  background: string;
  elements: El[];
  display_mode?: "full" | "boxed";
  is_system?: boolean;
  sort_order?: number;
  updated_at?: string;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

const base = (): Omit<El, "id" | "type" | "name"> => ({
  x: 80, y: 80, w: 240, h: 120, rotation: 0, opacity: 1,
  fill: "transparent", color: "#111827", fontSize: 24, fontWeight: 400, fontFamily: "Tajawal",
  align: "center", dir: "rtl", letterSpacing: 0, lineHeight: 1.4, padding: 8,
  radius: 0, borderWidth: 0, borderColor: "#111827", borderStyle: "solid", shadow: 0, shadowColor: "rgba(0,0,0,0.3)",
});

const EL_TYPES: ElType[] = ["text", "heading", "button", "card", "image", "rect", "circle", "line", "icon", "frame"];
// Turns AI output (possibly partial / sloppy) into valid elements; keeps image src from `prev` when the AI echoed a placeholder.
export function normalizeAiElements(raw: unknown, prev: El[] = []): El[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map(prev.map((e) => [e.id, e]));
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  return raw.filter((r) => r && typeof r === "object").map((r) => {
    const o = r as Partial<El>;
    const old = o.id ? byId.get(o.id) : undefined;
    const type = EL_TYPES.includes(o.type as ElType) ? (o.type as ElType) : old?.type ?? "rect";
    const e: El = { ...base(), ...(old ?? {}), ...o, id: old?.id ?? (o.id && !byId.has(o.id) ? String(o.id) : uid()), type, name: o.name ?? old?.name ?? type } as El;
    e.x = Math.round(num(e.x, 0)); e.y = Math.round(num(e.y, 0));
    e.w = Math.max(2, Math.round(num(e.w, 100))); e.h = Math.max(1, Math.round(num(e.h, 40)));
    e.opacity = Math.min(1, Math.max(0, num(e.opacity, 1)));
    if (e.src === "__KEEP__" || (type === "image" && !e.src)) e.src = old?.src ?? "";
    if (TEXT_LIKE.has(type) && e.text === undefined) e.text = "";
    return e;
  });
}
const TEXT_LIKE = new Set<ElType>(["text", "heading", "button", "card", "icon"]);

export interface LibItem { type: ElType; label: string; icon: string; make: () => Partial<El> }

export const LIBRARY: LibItem[] = [
  { type: "heading", label: "عنوان", icon: "H", make: () => ({ text: "عنوان رئيسي", fontSize: 48, fontWeight: 800, w: 420, h: 80 }) },
  { type: "text", label: "نص", icon: "T", make: () => ({ text: "اكتب النص هنا", fontSize: 22, w: 320, h: 80 }) },
  { type: "button", label: "زر", icon: "▢", make: () => ({ text: "اضغط هنا", fill: "#2563eb", color: "#ffffff", radius: 12, fontWeight: 700, w: 180, h: 56, fontSize: 20 }) },
  { type: "card", label: "بطاقة", icon: "▭", make: () => ({ text: "محتوى البطاقة", fill: "#ffffff", radius: 16, shadow: 24, w: 300, h: 200, align: "right", padding: 20 }) },
  { type: "frame", label: "إطار", icon: "⬚", make: () => ({ borderWidth: 3, borderColor: "#111827", radius: 8, w: 300, h: 200 }) },
  { type: "rect", label: "مستطيل", icon: "■", make: () => ({ fill: "#f59e0b", w: 200, h: 140 }) },
  { type: "circle", label: "دائرة", icon: "●", make: () => ({ fill: "#10b981", w: 160, h: 160, radius: 9999 }) },
  { type: "line", label: "خط فاصل", icon: "—", make: () => ({ fill: "#111827", w: 300, h: 4 }) },
  { type: "image", label: "صورة", icon: "🖼", make: () => ({ src: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800", fit: "cover", w: 320, h: 220, radius: 12 }) },
  { type: "guide", label: "حاجز ذكي", icon: "┄", make: () => ({ fill: "transparent", w: 1080, h: 2, x: 0 }) },
  { type: "icon", label: "أيقونة", icon: "★", make: () => ({ text: "⭐", fontSize: 72, w: 110, h: 110 }) },
];

// Built-in merge-gallery templates shipped in code (read-only, like is_system rows).
const be = (p: Partial<El> & Pick<El, "id" | "type" | "name" | "x" | "y" | "w" | "h">): El => ({ ...base(), fontFamily: "Tajawal", dir: "rtl", color: "#f1f5f9", ...p } as El);
export const BUILTIN_MERGE: Template[] = [
  {
    id: "builtin-equation", name: "📐 الدرس: معادلة", category: "معادلات", width: 760, height: 260, background: "#0b1530", is_system: true,
    elements: [
      be({ id: "eqframe", type: "frame", name: "إطار المعادلة", x: 20, y: 20, w: 720, h: 220, radius: 16, borderWidth: 2, borderColor: "#5ec2f2", fill: "#142347" }),
      be({ id: "eqlabel", type: "text", name: "عنوان المعادلة", x: 40, y: 36, w: 680, h: 44, text: "قانون الجذب العام", fontSize: 22, fontWeight: 700, color: "#5ec2f2", align: "center" }),
      be({ id: "eqmain", type: "heading", name: "المعادلة", x: 40, y: 90, w: 680, h: 90, text: "F = G · m₁m₂ / r²", fontSize: 48, fontWeight: 800, align: "center", dir: "ltr", fontFamily: "serif" }),
      be({ id: "eqnote", type: "text", name: "شرح الرموز", x: 40, y: 186, w: 680, h: 40, text: "F القوة · G ثابت الجذب · m الكتلة · r المسافة", fontSize: 18, color: "#94a3b8", align: "center" }),
    ],
  },
  {
    id: "builtin-image", name: "🖼️ الدرس: صورة", category: "صور", width: 760, height: 440, background: "#0b1530", is_system: true,
    elements: [
      be({ id: "imgmain", type: "image", name: "صورة", x: 20, y: 20, w: 720, h: 400, radius: 16, fill: "transparent", fit: "cover", src: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200" }),
    ],
  },
];

export const ICONS = ["⭐", "🚀", "💡", "✅", "❤️", "🔥", "🌍", "☀️", "🌙", "🪐", "📌", "🎯", "📚", "✏️", "🎉", "⚡"];

export function makeEl(item: LibItem, x?: number, y?: number): El {
  const e: El = { ...base(), id: uid(), type: item.type, name: item.label, ...item.make() } as El;
  if (x !== undefined) e.x = Math.round(x - e.w / 2);
  if (y !== undefined) e.y = Math.round(y - e.h / 2);
  return e;
}

export const SIZES = [
  { label: "مربع 1080×1080", w: 1080, h: 1080 },
  { label: "قصة 1080×1920", w: 1080, h: 1920 },
  { label: "عرض 1920×1080", w: 1920, h: 1080 },
  { label: "A4 عمودي", w: 794, h: 1123 },
  { label: "جوال 390×844", w: 390, h: 844 },
  { label: "تابلت 820×1180", w: 820, h: 1180 },
];

export const FONTS = ["Tajawal", "Cairo", "Amiri", "Noto Kufi Arabic", "Noto Naskh Arabic", "Almarai", "Changa", "El Messiri", "Lalezar", "Lateef", "Mada", "Markazi Text", "Reem Kufi", "Scheherazade New", "Harmattan", "Readex Pro", "IBM Plex Sans Arabic", "Rakkas", "Aref Ruqaa", "Kufam", "Baloo Bhaijaan 2", "Vibes", "Marhey", "Arial", "Georgia", "Courier New"];

// ---- Expanded asset library ----
export const ICON_SETS: Record<string, string[]> = {
  "عام": ICONS,
  "علوم": ["🔭", "🔬", "⚗️", "🧪", "🧬", "🧲", "⚛️", "🌡️", "💧", "🌋", "🌊", "🌪️", "🌈", "❄️", "🌌", "☄️", "🛰️", "🌕", "🌑", "🪨"],
  "تعليم": ["📖", "📝", "🎓", "🏫", "🧮", "📐", "📏", "🖊️", "🗂️", "📎", "🧠", "❓", "❗", "💬", "🗣️", "👩‍🏫", "👨‍🎓", "🏆", "🥇", "📊"],
  "أسهم": ["➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "🔄", "🔁", "⤴️", "⤵️", "▶️", "◀️", "🔼", "🔽"],
  "رموز": ["✔️", "✖️", "➕", "➖", "➗", "♾️", "💯", "🔺", "🔻", "🔷", "🔶", "⚪", "⚫", "🟢", "🔴", "🟡", "🔵", "🟣", "🟠", "⭕"],
  "مشاعر": ["😀", "😃", "🤔", "😮", "😎", "🥳", "👏", "👍", "👎", "🙌", "💪", "🤝", "✌️", "👀", "😍", "🤩"],
  "طبيعة": ["🌳", "🌴", "🌵", "🌸", "🌻", "🍀", "🍁", "🌾", "🐝", "🦋", "🐟", "🐦", "🦁", "🐘", "🌍", "🏔️"],
};
export const DECOR: LibItem[] = [
  { type: "text", label: "زخرفة ۞", icon: "۞", make: () => ({ text: "۞ ۞ ۞", fontSize: 40, w: 260, h: 70, color: "#b45309" }) },
  { type: "text", label: "فاصل نجوم", icon: "✦", make: () => ({ text: "✦ ✦ ✦ ✦ ✦", fontSize: 28, w: 320, h: 50, color: "#64748b" }) },
  { type: "text", label: "فاصل نقاط", icon: "•", make: () => ({ text: "• • • • • • •", fontSize: 30, w: 320, h: 50, color: "#94a3b8" }) },
  { type: "text", label: "زهرة", icon: "❁", make: () => ({ text: "❁", fontSize: 80, w: 110, h: 110, color: "#be185d" }) },
  { type: "line", label: "خط متدرج", icon: "▬", make: () => ({ fill: "linear-gradient(90deg, #0ea5e9, #10b981)", w: 360, h: 6, radius: 99 }) },
  { type: "frame", label: "إطار متقطع", icon: "┅", make: () => ({ borderWidth: 3, borderStyle: "dashed", borderColor: "#0ea5e9", radius: 16, w: 320, h: 200 }) },
  { type: "frame", label: "إطار مزدوج", icon: "▣", make: () => ({ borderWidth: 6, borderStyle: "solid", borderColor: "#1e293b", radius: 4, padding: 12, w: 320, h: 200, shadow: 0 }) },
  { type: "card", label: "شارة", icon: "◉", make: () => ({ text: "جديد", fill: "#ef4444", color: "#ffffff", radius: 999, fontWeight: 800, w: 120, h: 44, fontSize: 18 }) },
  { type: "card", label: "ملاحظة", icon: "📝", make: () => ({ text: "ملاحظة مهمة", fill: "#fef3c7", color: "#78350f", radius: 12, w: 320, h: 120, align: "right", padding: 18, borderWidth: 0 }) },
  { type: "card", label: "شريط عنوان", icon: "▤", make: () => ({ text: "عنوان القسم", fill: "linear-gradient(90deg, #1e3a8a, #0ea5e9)", color: "#ffffff", fontWeight: 800, fontSize: 28, w: 520, h: 70, radius: 10 }) },
];
export const EXTRA_FONTS = ["Tajawal", "Cairo", "Amiri", "Noto Kufi Arabic", "Noto Naskh Arabic", "Almarai", "Changa", "El Messiri", "Lalezar", "Lateef", "Mada", "Markazi Text", "Reem Kufi", "Scheherazade New", "Harmattan", "Readex Pro", "IBM Plex Sans Arabic", "Rakkas", "Aref Ruqaa", "Kufam", "Baloo Bhaijaan 2", "Vibes", "Marhey"];
export const FONTS_HREF = "https://fonts.googleapis.com/css2?" + EXTRA_FONTS.filter((f) => !["Arial"].includes(f)).map((f) => "family=" + f.replace(/ /g, "+") + ":wght@400;700").join("&") + "&display=swap";

// ---- Linked (master) components ----
// An instance element carries master (component template id) + masterEl (element id inside it).
// Position, size, rotation and grouping stay per-instance; everything else follows the master.
const KEEP: (keyof El)[] = ["id", "x", "y", "w", "h", "rotation", "group", "name", "hidden", "locked", "master", "masterEl"];
export function resolveMasters(els: El[], masters: Record<string, Template>): El[] {
  return els.map((e) => {
    if (!e.master || !e.masterEl) return e;
    const m = masters[e.master]?.elements.find((q) => q.id === e.masterEl);
    if (!m) return e;
    const out = { ...m } as El;
    for (const k of KEEP) (out as unknown as Record<string, unknown>)[k] = (e as unknown as Record<string, unknown>)[k];
    return out;
  });
}
export const masterIds = (els: El[]) => [...new Set(els.map((e) => e.master).filter(Boolean) as string[])];

// ---- Audit diff ----
export function diffSummary(a: El[], b: El[]): string[] {
  const out: string[] = [];
  const am = new Map(a.map((e) => [e.id, e])), bm = new Map(b.map((e) => [e.id, e]));
  for (const e of b) if (!am.has(e.id)) out.push(`أضاف «${e.name}»`);
  for (const e of a) if (!bm.has(e.id)) out.push(`حذف «${e.name}»`);
  for (const e of b) {
    const o = am.get(e.id); if (!o) continue;
    const ch: string[] = [];
    if (o.text !== e.text) ch.push("النص");
    if (o.x !== e.x || o.y !== e.y) ch.push("الموضع");
    if (o.w !== e.w || o.h !== e.h) ch.push("الحجم");
    if (o.rotation !== e.rotation) ch.push("التدوير");
    if (o.fill !== e.fill || o.color !== e.color) ch.push("الألوان");
    if (o.fontFamily !== e.fontFamily || o.fontSize !== e.fontSize || o.fontWeight !== e.fontWeight) ch.push("الخط");
    if (o.src !== e.src || o.cropX !== e.cropX || o.cropY !== e.cropY || o.cropZoom !== e.cropZoom) ch.push("الصورة");
    if (ch.length) out.push(`عدّل ${ch.join("، ")} في «${e.name}»`);
  }
  return out;
}

// ---- Type scale (16): harmonious sizes relative to a 1080px-wide canvas ----
export const TYPE_SCALE = [
  { key: "display", label: "عنوان بارز", ratio: 56 / 1080, weight: 800 },
  { key: "title", label: "عنوان فرعي", ratio: 38 / 1080, weight: 700 },
  { key: "body", label: "متن مريح", ratio: 26 / 1080, weight: 400 },
] as const;
// Phone width the lesson is read at; text must stay >= 14px there.
export const MOBILE_W = 390;
export const MIN_MOBILE_PX = 14;
export const scaleSize = (ratio: number, canvasW: number) => Math.max(Math.round(ratio * canvasW), Math.ceil((MIN_MOBILE_PX * canvasW) / MOBILE_W));
export const mobilePx = (fontSize: number, canvasW: number) => (fontSize * MOBILE_W) / canvasW;

// ---- Auto contrast (17) ----
function parseColor(c: string): [number, number, number] | null {
  const h = c.match(/#([0-9a-f]{3,8})/i);
  if (h) { let x = h[1]!; if (x.length <= 4) x = x.split("").map((q) => q + q).join(""); return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)]; }
  const r = c.match(/rgba?\(([^)]+)\)/); if (r) { const [a, b, d, al] = r[1]!.split(",").map((q) => parseFloat(q)); if (al === 0) return null; return [a!, b!, d!]; }
  return null;
}
export function luminance(c: string): number | null {
  const v = parseColor(c); if (!v) return null;
  const [r, g, b] = v.map((q) => { const s = q / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const LIGHT_TEXT = "#f8fafc";
export const DARK_TEXT = "#111827";
/** Readable text color for whatever sits behind element e (its own fill, enclosing shapes, then the canvas). */
export function contrastFor(e: El, t: Pick<Template, "elements" | "background">, fallbackBg = "#0b1026"): string {
  const own = luminance(e.fill);
  if (own !== null && e.fill !== "transparent") return own > 0.45 ? DARK_TEXT : LIGHT_TEXT;
  const i = t.elements.findIndex((q) => q.id === e.id);
  for (let k = i - 1; k >= 0; k--) {
    const q = t.elements[k]!; if (q.hidden || q.type === "guide") continue;
    const inside = q.x <= e.x + e.w / 2 && q.x + q.w >= e.x + e.w / 2 && q.y <= e.y + e.h / 2 && q.y + q.h >= e.y + e.h / 2;
    const l = inside ? luminance(q.fill) : null; if (l !== null) return l > 0.45 ? DARK_TEXT : LIGHT_TEXT;
  }
  const bg = t.background === "transparent" ? fallbackBg : t.background;
  const l = luminance(bg); return l !== null && l > 0.45 ? DARK_TEXT : LIGHT_TEXT;
}

// ---- Style copy (21) ----
export const STYLE_KEYS = ["fill", "color", "fontFamily", "fontWeight", "fontSize", "letterSpacing", "lineHeight", "radius", "borderWidth", "borderColor", "borderStyle", "shadow", "shadowColor", "opacity", "padding"] as const;
export type StyleSnap = Partial<Pick<El, (typeof STYLE_KEYS)[number]>>;
export const pickStyle = (e: El): StyleSnap => Object.fromEntries(STYLE_KEYS.map((k) => [k, e[k]])) as StyleSnap;

// ---- Smart divider (15): keep each element on its own side of every guide ----
export function clampToGuides(o: { y: number; h: number }, ny: number, guides: El[]): number {
  const c = o.y + o.h / 2; let y = ny;
  for (const g of guides) {
    if (c <= g.y) y = Math.min(y, g.y - o.h);
    else y = Math.max(y, g.y + g.h);
  }
  return y;
}

// ---- Mobile safety (24) ----
export function mobileIssues(t: Template): { id: string; why: string }[] {
  const out: { id: string; why: string }[] = [];
  for (const e of t.elements) {
    if (e.hidden || e.type === "guide") continue;
    if (e.text !== undefined && e.type !== "icon" && mobilePx(e.fontSize, t.width) < MIN_MOBILE_PX) out.push({ id: e.id, why: `«${e.name}» خط ${mobilePx(e.fontSize, t.width).toFixed(1)}px على الجوال` });
    if (e.x < -1 || e.y < -1 || e.x + e.w > t.width + 1) out.push({ id: e.id, why: `«${e.name}» يتجاوز حافة الشاشة` });
  }
  return out;
}
