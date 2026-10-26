import { describe, it, expect } from "vitest";
import { buildTree, splitSpanning } from "@/components/studio/TemplateEmbed";
import type { Template } from "@/lib/studio";

const el = (id: string, type: string, x: number, y: number, w: number, h: number, text?: string) => ({ id, type, x, y, w, h, text } as never);

describe("one tall side bar beside two stacked cards", () => {
  it("keeps the bar whole and the cards stacked", () => {
    const t = { id: "t", name: "t", width: 760, height: 740, background: "#000", elements: [
      el("c1", "frame", 20, 265, 710, 205), el("bar", "rect", 730, 265, 10, 450), el("c2", "frame", 20, 494, 710, 221),
    ] } as unknown as Template;
    const { flow, spans } = splitSpanning(buildTree(t).kids);
    expect(spans.map((s) => s.e!.id)).toEqual(["bar"]);
    expect(flow.map((s) => s.e!.id).sort()).toEqual(["c1", "c2"]);
  });
});
