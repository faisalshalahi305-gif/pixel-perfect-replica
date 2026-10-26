export type BlockType = "p" | "h2" | "h3" | "list" | "qa" | "eq" | "cards" | "compare" | "img" | "media" | "section" | "callout" | "color"
  | "quote" | "def" | "life" | "explain" | "steps" | "summary" | "clarify"
  | "panel" | "framed" | "tab" | "inset" | "rail" | "dashed" | "split" | "bevel" | "capsule" | "tagbox"
  | "pointer" | "etch" | "corners" | "waves" | "shield" | "reticle" | "slats" | "gate"
  | "medal" | "lead" | "exec" | "horizon" | "chief" | "doc" | "prose" | "sheet" | "spread" | "holder" | "tpl"
  | "group" | "bar" | "badge" | "divider" | "spacer" | `x${number}`;

/** Free style layer applied to ANY block (template, piece or merged group). */
export type Fx = {
  kind?: "none" | "solid" | "linear" | "radial" | undefined;
  c1?: string | undefined; c2?: string | undefined; c3?: string | undefined; ang?: number | undefined; op?: number | undefined;
  alpha?: number | undefined; tc?: string | undefined;
  glow?: number | undefined; gc?: string | undefined; spread?: number | undefined; sh?: number | undefined; blur?: number | undefined;
  r?: [number, number, number, number] | undefined;
  bw?: number | undefined; bc?: string | undefined; bs?: "solid" | "dashed" | "dotted" | "double" | undefined;
  pulse?: boolean | undefined; tex?: "none" | "grid" | "dots" | "orbit" | "lines" | undefined; blend?: string | undefined;
  al?: "l" | "c" | "r" | undefined; dx?: number | undefined; z?: number | undefined; sc?: number | undefined; pad?: number | undefined;
  lock?: boolean | undefined; row?: boolean | undefined; ratio?: "eq" | "30" | undefined;
  h?: number | undefined; w?: number | undefined; dv?: "fade" | "dots" | "double" | "diamond" | undefined;
};

export type Block = { id: string; type: BlockType; text: string; a?: string | undefined; items?: string[]; src?: string; children?: Block[]; c?: string | undefined; s?: number | undefined; num?: string | undefined; k?: string | undefined; o?: Record<string, string> | undefined; fx?: Fx | undefined; name?: string | undefined };
