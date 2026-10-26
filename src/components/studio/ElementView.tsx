import type { CSSProperties } from "react";
import { contrastFor, type El, type Template } from "@/lib/studio";

export function elStyle(e: El): CSSProperties {
  return {
    position: "absolute", left: e.x, top: e.y, width: e.w, height: e.h,
    transform: e.rotation ? `rotate(${e.rotation}deg)` : undefined,
    opacity: e.opacity, background: e.fill, color: e.color,
    fontSize: e.fontSize, fontWeight: e.fontWeight, fontFamily: e.fontFamily,
    textAlign: e.align, direction: e.dir, letterSpacing: e.letterSpacing, lineHeight: e.lineHeight,
    padding: e.type === "image" || e.type === "line" ? 0 : e.padding,
    borderRadius: e.radius, border: e.borderWidth ? `${e.borderWidth}px ${e.borderStyle} ${e.borderColor}` : undefined,
    boxShadow: e.shadow ? `0 ${Math.round(e.shadow / 3)}px ${e.shadow}px ${e.shadowColor}` : undefined,
    overflow: "hidden", display: "flex", alignItems: "center",
    justifyContent: e.align === "center" ? "center" : e.align === "right" ? "flex-start" : "flex-end",
    whiteSpace: "pre-wrap", wordBreak: "break-word", boxSizing: "border-box",
  };
}

export function ElementContent({ e }: { e: El }) {
  if (e.type === "image") return e.src ? <img src={e.src} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: e.fit ?? "cover", objectPosition: `${e.cropX ?? 50}% ${e.cropY ?? 50}%`, transform: e.cropZoom && e.cropZoom !== 1 ? `scale(${e.cropZoom})` : undefined, transformOrigin: `${e.cropX ?? 50}% ${e.cropY ?? 50}%`, pointerEvents: "none", filter: e.dim ? `brightness(${1 - e.dim})` : undefined }} /> : null;
  if (e.text) return <span style={{ width: "100%" }}>{e.text}</span>;
  return null;
}

export function TemplateRender({ t, scale = 1 }: { t: Template; scale?: number }) {
  return (
    <div dir="ltr" style={{ width: t.width * scale, height: t.height * scale, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ position: "relative", width: t.width, height: t.height, background: t.background, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {t.elements.filter((e) => !e.hidden && e.type !== "guide").map((e) => (
          <div key={e.id} style={{ ...elStyle(e), ...(e.autoContrast && e.text !== undefined ? { color: contrastFor(e, t) } : {}) }}><ElementContent e={e} /></div>
        ))}
      </div>
    </div>
  );
}
