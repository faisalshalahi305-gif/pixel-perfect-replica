import { describe, expect, it } from "vitest";
import { clampToGuides, mobileIssues, scaleSize, type El, type Template } from "@/lib/studio";

const el = (p: Partial<El>): El => ({ id: "a", type: "text", name: "n", x: 0, y: 0, w: 100, h: 50, rotation: 0, opacity: 1, text: "x", fill: "transparent", color: "#000", fontSize: 40, fontWeight: 400, fontFamily: "Tajawal", align: "center", dir: "rtl", letterSpacing: 0, lineHeight: 1.4, padding: 8, radius: 0, borderWidth: 0, borderColor: "#000", borderStyle: "solid", shadow: 0, shadowColor: "#000", ...p });
const tpl = (els: El[]): Template => ({ id: "t", name: "t", category: "", width: 1080, height: 1080, background: "#fff", elements: els });

describe("template studio rules", () => {
  it("flags text smaller than 14px on a phone", () => {
    expect(mobileIssues(tpl([el({ fontSize: 30 })])).length).toBe(1); // 30*390/1080 ≈ 10.8px
    expect(mobileIssues(tpl([el({ fontSize: 40 })])).length).toBe(0); // ≈ 14.4px
  });
  it("flags elements past the screen edge", () => {
    expect(mobileIssues(tpl([el({ x: 1000, w: 200 })])).length).toBe(1);
  });
  it("type scale never goes below 14px on a phone", () => {
    expect(scaleSize(10 / 1080, 1080)).toBe(39);
  });
  it("smart divider keeps a title above and text below", () => {
    const g = el({ type: "guide", y: 300, h: 2 });
    expect(clampToGuides({ y: 100, h: 50 }, 400, [g])).toBe(250);
    expect(clampToGuides({ y: 500, h: 50 }, 200, [g])).toBe(302);
  });
});
