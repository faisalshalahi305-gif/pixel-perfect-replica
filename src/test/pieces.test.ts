import { describe, expect, it } from "vitest";
import { explode } from "@/routes/index";

describe("disassemble into pieces", () => {
  it("splits a title+paragraph template into numbered independent pieces", () => {
    const [g] = explode({ id: "a", type: "panel", text: "T", a: "B" });
    expect(g!.type).toBe("group");
    expect(g!.name).toBe("الإطار والخلفية");
    expect(g!.children!.map((c) => c.name)).toEqual(["الخط العلوي", "العنصر الجانبي", "العنوان", "الخط الفاصل", "النص", "الخط السفلي"]);
    expect(g!.children!.find((c) => c.name === "العنوان")!.text).toBe("T");
    expect(g!.children!.find((c) => c.name === "النص")!.text).toBe("B");
  });
  it("gives every piece a unique id", () => {
    const [g] = explode({ id: "a", type: "x5", text: "T", a: "B" });
    const ids = g!.children!.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("disassembling a group releases all its children with fresh ids", () => {
    const kids = [{ id: "1", type: "p" as const, text: "x" }, { id: "2", type: "bar" as const, text: "" }];
    const out = explode({ id: "g", type: "group", text: "", children: kids });
    expect(out.map((c) => c.text)).toEqual(["x", ""]);
    expect(out.map((c) => c.id)).not.toContain("1");
  });
  it("an empty group never disappears", () => {
    const g = { id: "g", type: "group" as const, text: "", children: [] };
    expect(explode(g)).toEqual([g]);
  });
});
