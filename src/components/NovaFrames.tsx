import type { ReactNode } from "react";
import { more } from "./NovaMore";

// 30 heading + paragraph frames. [command word, menu label, block type]
export const NOVA: [string, string, `x${number}`][] = [
  ["نجم", "نجم", "x1"], ["مدار", "مدار", "x2"], ["سديم", "سديم", "x3"], ["شفق", "شفق", "x4"], ["مجرة", "مجرة", "x5"],
  ["هالة", "هالة", "x6"], ["ومضة", "ومضة", "x7"], ["نيزك", "نيزك", "x8"], ["كوكب", "كوكب", "x9"], ["قمر", "قمر", "x10"],
  ["فلك", "فلك", "x11"], ["ذروة", "ذروة", "x12"], ["منارة", "منارة", "x13"], ["سطوع", "سطوع", "x14"], ["مرآة", "مرآة", "x15"],
  ["زجاج", "زجاج", "x16"], ["ظل", "ظل", "x17"], ["نسيج", "نسيج", "x18"], ["خيط", "خيط", "x19"], ["رواق", "رواق", "x20"],
  ["قوس", "قوس", "x21"], ["مدرج", "مدرج", "x22"], ["سقف", "سقف", "x23"], ["عتبة", "عتبة", "x24"], ["مقام", "مقام", "x25"],
  ["لوح", "لوح", "x26"], ["صفحة", "صفحة", "x27"], ["سجل", "سجل", "x28"], ["ختم", "ختم", "x29"], ["نهاية", "نهاية", "x30"],
  ["رصد", "رصد", "x31"],
  ["شعاع", "شعاع", "x32"],
  ["نواة", "نواة", "x33"],
  ["طيف", "طيف", "x34"],
  ["موجة", "موجة", "x35"],
  ["بوصلة", "بوصلة", "x36"],
  ["أثير", "أثير", "x37"],
  ["سحابة", "سحابة", "x38"],
  ["جاذبية", "جاذبية", "x39"],
  ["كسوف", "كسوف", "x40"],
  ["فجر", "فجر", "x41"],
  ["غسق", "غسق", "x42"],
  ["محراب", "محراب", "x43"],
  ["لؤلؤة", "لؤلؤة", "x44"],
  ["ركن", "ركن", "x45"],
  ["حافة", "حافة", "x46"],
  ["خزانة", "خزانة", "x47"],
  ["قبة", "قبة", "x48"],
  ["جسر", "جسر", "x49"],
  ["نافذة", "نافذة", "x50"],
  ["مرصد", "مرصد", "x51"],
  ["مسبار", "مسبار", "x52"],
  ["مدى", "مدى", "x53"],
  ["صدى", "صدى", "x54"],
  ["وهج", "وهج", "x55"],
  ["ميزان", "ميزان", "x56"],
  ["إشارة", "إشارة", "x57"],
  ["بيان", "بيان", "x58"],
  ["أفول", "أفول", "x59"],
  ["خاتمة", "خاتمة", "x60"],
  ["أفلاك", "أفلاك", "x61"],
  ["ثريا", "ثريا", "x62"],
  ["سهيل", "سهيل", "x63"],
  ["الجوزاء", "الجوزاء", "x64"],
  ["عطارد", "عطارد", "x65"],
  ["زحل", "زحل", "x66"],
  ["مريخ", "مريخ", "x67"],
  ["المشتري", "المشتري", "x68"],
  ["نبتون", "نبتون", "x69"],
  ["أورانوس", "أورانوس", "x70"],
  ["زهرة", "زهرة", "x71"],
  ["بلوتو", "بلوتو", "x72"],
  ["حمل", "حمل", "x73"],
  ["ثور", "ثور", "x74"],
  ["توأم", "توأم", "x75"],
  ["سرطان", "سرطان", "x76"],
  ["أسد", "أسد", "x77"],
  ["سنبلة", "سنبلة", "x78"],
  ["عقرب", "عقرب", "x79"],
  ["قوس2", "قوس2", "x80"],
  ["جدي", "جدي", "x81"],
  ["دلو", "دلو", "x82"],
  ["حوت", "حوت", "x83"],
  ["شروق", "شروق", "x84"],
  ["ضحى", "ضحى", "x85"],
  ["ظهيرة", "ظهيرة", "x86"],
  ["عصر", "عصر", "x87"],
  ["مغرب", "مغرب", "x88"],
  ["عشاء", "عشاء", "x89"],
  ["سحر", "سحر", "x90"],
  ["برق", "برق", "x91"],
  ["رعد", "رعد", "x92"],
  ["مطر", "مطر", "x93"],
  ["ندى", "ندى", "x94"],
  ["ضباب", "ضباب", "x95"],
  ["ثلج", "ثلج", "x96"],
  ["جليد", "جليد", "x97"],
  ["ريح", "ريح", "x98"],
  ["نسيم", "نسيم", "x99"],
  ["إعصار", "إعصار", "x100"],
  ["بحر", "بحر", "x101"],
  ["موج2", "موج2", "x102"],
  ["مرجان", "مرجان", "x103"],
  ["صدف", "صدف", "x104"],
  ["ساحل", "ساحل", "x105"],
  ["جزيرة", "جزيرة", "x106"],
  ["خليج", "خليج", "x107"],
  ["نهر", "نهر", "x108"],
  ["نبع", "نبع", "x109"],
  ["واحة", "واحة", "x110"],
  ["جبل", "جبل", "x111"],
  ["قمة2", "قمة2", "x112"],
  ["وادي", "وادي", "x113"],
  ["سهل", "سهل", "x114"],
  ["كثيب", "كثيب", "x115"],
  ["صخر", "صخر", "x116"],
  ["بلور", "بلور", "x117"],
  ["زمرد", "زمرد", "x118"],
  ["ياقوت", "ياقوت", "x119"],
  ["فيروز", "فيروز", "x120"],
  ["عقيق", "عقيق", "x121"],
  ["مرمر", "مرمر", "x122"],
  ["عاج", "عاج", "x123"],
  ["ذهب", "ذهب", "x124"],
  ["فضة", "فضة", "x125"],
  ["نحاس", "نحاس", "x126"],
  ["فولاذ", "فولاذ", "x127"],
  ["زئبق", "زئبق", "x128"],
  ["حرير", "حرير", "x129"],
  ["مخمل", "مخمل", "x130"],
  ["كتاب", "كتاب", "x131"],
  ["قلم", "قلم", "x132"],
  ["حبر", "حبر", "x133"],
  ["دفتر", "دفتر", "x134"],
  ["رسالة", "رسالة", "x135"],
  ["لوحة3", "لوحة3", "x136"],
  ["مخطوطة", "مخطوطة", "x137"],
  ["فهرس", "فهرس", "x138"],
  ["فصل", "فصل", "x139"],
  ["باب", "باب", "x140"],
  ["سلم", "سلم", "x141"],
  ["برج", "برج", "x142"],
  ["قلعة", "قلعة", "x143"],
  ["حصن", "حصن", "x144"],
  ["مئذنة", "مئذنة", "x145"],
  ["رواق2", "رواق2", "x146"],
  ["فناء", "فناء", "x147"],
  ["ساحة", "ساحة", "x148"],
  ["ممر", "ممر", "x149"],
  ["دهليز", "دهليز", "x150"],
  ["مشكاة", "مشكاة", "x151"],
  ["قنديل", "قنديل", "x152"],
  ["شمعة", "شمعة", "x153"],
  ["سراج", "سراج", "x154"],
  ["نور", "نور", "x155"],
  ["ضياء", "ضياء", "x156"],
  ["بريق", "بريق", "x157"],
  ["لمعة", "لمعة", "x158"],
  ["شرارة", "شرارة", "x159"],
  ["لهب", "لهب", "x160"],
];

type P = { type: string; col: string; mix: (n: number) => string; head: (cls?: string) => ReactNode; body: (cls?: string) => ReactNode; acc: ReactNode; hasH: boolean; hasB: boolean };

export function nova({ type, col, mix, head, body, acc, hasH, hasB }: P): ReactNode {
  const both = hasH && hasB;
  const card = "var(--card)";
  const num = Number(type.slice(1));
  if (num > 60) return more(num, { col, mix, head, body, acc, both });
  switch (type) {
    case "x1": return <div className="relative w-full overflow-hidden rounded-2xl border px-5 py-4" style={{ borderColor: mix(35), background: `radial-gradient(120% 80% at 100% 0%, ${mix(22)}, transparent 60%), ${card}` }}>{head("text-2xl font-extrabold")}{body("mt-2")}{acc}</div>;
    case "x2": return <div className="relative w-full rounded-[2rem] border-2 px-6 py-5" style={{ borderColor: mix(45), boxShadow: `0 0 0 6px ${mix(8)}, 0 0 30px -10px ${col}` }}>{head("text-center text-2xl font-bold")}{both && <div className="mx-auto my-3 h-1 w-1 rounded-full" style={{ background: col, boxShadow: `-14px 0 0 ${mix(60)}, 14px 0 0 ${mix(60)}` }} />}{body("text-center")}{acc}</div>;
    case "x3": return <div className="w-full rounded-3xl p-[1.5px]" style={{ background: `linear-gradient(135deg, ${col}, transparent 45%, ${mix(60)})` }}><div className="rounded-[calc(1.5rem-1.5px)] px-5 py-4" style={{ background: `linear-gradient(160deg, ${mix(14)}, ${card} 50%)` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div></div>;
    case "x4": return <div className="w-full overflow-hidden rounded-xl border" style={{ borderColor: mix(30) }}><div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${col}, transparent)` }} /><div className="px-5 py-4" style={{ background: `linear-gradient(180deg, ${mix(16)}, transparent 70%)` }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div></div>;
    case "x5": return <div className="relative w-full rounded-2xl border bg-card/70 px-5 py-4" style={{ borderColor: mix(25), backgroundImage: `radial-gradient(${mix(35)} 1px, transparent 1.5px), radial-gradient(${mix(20)} 1px, transparent 1.5px)`, backgroundSize: "34px 34px, 21px 21px", backgroundPosition: "0 0, 10px 14px" }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x6": return <div className="w-full rounded-2xl px-5 py-4" style={{ background: card, boxShadow: `0 0 0 1px ${mix(40)}, 0 0 24px ${mix(25)}, inset 0 0 24px ${mix(12)}` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x7": return <div className="w-full rounded-lg bg-card/70 px-5 py-4" style={{ borderTop: `3px solid ${col}`, boxShadow: `0 -10px 20px -14px ${col}` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x8": return <div className="w-full skew-x-[-4deg] rounded-md border bg-card/70 px-6 py-4" style={{ borderColor: mix(40), background: `linear-gradient(100deg, ${mix(18)}, transparent 40%)` }}><div className="skew-x-[4deg]">{head("text-xl font-black italic")}{body("mt-2")}{acc}</div></div>;
    case "x9": return <div className="w-full rounded-[2.5rem_0.5rem_2.5rem_0.5rem] border-2 px-6 py-5" style={{ borderColor: mix(50), background: mix(6) }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x10": return <div className="relative w-full overflow-hidden rounded-2xl border bg-card/70 px-5 py-4" style={{ borderColor: mix(30) }}><div className="pointer-events-none absolute -top-16 left-1/2 h-24 w-[140%] -translate-x-1/2 rounded-[50%]" style={{ background: mix(14), borderBottom: `1px solid ${mix(50)}` }} /><div className="relative pt-2">{head("text-center text-xl font-bold")}{body("mt-3 text-center")}{acc}</div></div>;
    case "x11": return <div className="w-full rounded-xl border px-5 py-4" style={{ borderColor: mix(35), backgroundImage: `linear-gradient(${mix(8)} 1px, transparent 1px), linear-gradient(90deg, ${mix(8)} 1px, transparent 1px)`, backgroundSize: "22px 22px" }}>{head("text-xl font-bold tracking-wide")}{body("mt-2")}{acc}</div>;
    case "x12": return <div className="w-full rounded-b-2xl border-x border-b px-5 pb-5 pt-0" style={{ borderColor: mix(30), background: `linear-gradient(180deg, ${mix(10)}, transparent)` }}><div className="mx-auto mb-4 h-1 w-1/3 rounded-b-full" style={{ background: col }} />{head("text-center text-2xl font-black")}{body("mt-2 text-center")}{acc}</div>;
    case "x13": return <div className="w-full rounded-2xl border bg-card/70 px-5 py-4" style={{ borderColor: mix(30), background: `linear-gradient(180deg, ${mix(22)}, transparent 35%), ${card}` }}>{head("text-center text-2xl font-extrabold")}{both && <div className="mx-auto my-3 h-px w-2/3" style={{ background: `linear-gradient(90deg, transparent, ${col}, transparent)` }} />}{body("text-center")}{acc}</div>;
    case "x14": return <div className="w-full rounded-xl px-5 py-4" style={{ background: `linear-gradient(135deg, ${mix(30)}, ${mix(6)})`, border: `1px solid ${mix(55)}` }}>{head("text-xl font-black")}{body("mt-2")}{acc}</div>;
    case "x15": return <div className="w-full rounded-2xl border px-5 py-4" style={{ borderColor: mix(25), background: `linear-gradient(180deg, ${card} 50%, ${mix(10)} 50%)` }}>{head("text-xl font-bold")}{body("mt-3")}{acc}</div>;
    case "x16": return <div className="w-full rounded-2xl border px-5 py-4 backdrop-blur-md" style={{ borderColor: mix(30), background: `linear-gradient(135deg, rgb(255 255 255 / .08), rgb(255 255 255 / .02))`, boxShadow: `inset 0 1px 0 rgb(255 255 255 / .15)` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x17": return <div className="w-full rounded-xl border bg-card px-5 py-4" style={{ borderColor: mix(45), boxShadow: `8px 8px 0 ${mix(30)}` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x18": return <div className="w-full rounded-xl border px-5 py-4" style={{ borderColor: mix(30), backgroundImage: `repeating-linear-gradient(45deg, ${mix(6)} 0 2px, transparent 2px 12px)` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x19": return <div className="w-full px-2 py-4" style={{ borderTop: `1px solid ${mix(45)}`, borderBottom: `1px solid ${mix(45)}`, outline: `1px solid ${mix(20)}`, outlineOffset: "4px" }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x20": return <div className="w-full rounded-xl border-y-2 border-double px-5 py-4" style={{ borderColor: col, borderWidth: "4px 0", borderStyle: "double", background: mix(5) }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x21": return <div className="w-full rounded-t-[3rem] border-2 border-b-0 px-6 pb-4 pt-6" style={{ borderColor: mix(45), background: `linear-gradient(180deg, ${mix(12)}, transparent)` }}>{head("text-center text-2xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x22": return <div className="w-full"><div className="mx-auto w-full rounded-t-xl px-5 py-3" style={{ background: mix(20), borderBottom: `2px solid ${col}` }}>{head("text-xl font-bold")}</div><div className="rounded-b-xl bg-card/70 px-5 py-4">{body("")}{acc}</div></div>;
    case "x23": return <div className="w-full overflow-hidden rounded-xl border bg-card/70" style={{ borderColor: mix(35) }}><div className="px-5 py-3" style={{ background: `linear-gradient(90deg, ${col}, ${mix(50)})` }}>{head("text-xl font-black text-background")}</div><div className="px-5 py-4">{body("")}{acc}</div></div>;
    case "x24": return <div className="w-full rounded-2xl bg-card/70 px-5 py-4" style={{ borderBottom: `4px solid ${col}`, boxShadow: `0 12px 20px -16px ${col}` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x25": return <div className="w-full rounded-full border-2 px-8 py-4" style={{ borderColor: mix(50), background: `linear-gradient(90deg, ${mix(14)}, transparent, ${mix(14)})` }}>{head("text-center text-xl font-bold")}{body("mt-1 text-center")}{acc}</div>;
    case "x26": return <div className="w-full rounded-sm border-2 p-1" style={{ borderColor: mix(40) }}><div className="rounded-sm border px-5 py-4" style={{ borderColor: mix(25), background: mix(5) }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div></div>;
    case "x27": return <div className="w-full rounded-lg bg-card px-6 py-5 shadow-2xl" style={{ boxShadow: `0 1px 0 ${mix(60)} inset, 0 20px 30px -20px rgb(0 0 0 / .8), 0 0 0 1px ${mix(18)}` }}>{head("text-2xl font-bold")}{both && <div className="my-3 h-px w-full" style={{ background: mix(25) }} />}{body("")}{acc}</div>;
    case "x28": return <div className="w-full rounded-xl border px-5 py-4" style={{ borderColor: mix(30), backgroundImage: `repeating-linear-gradient(180deg, transparent 0 calc(2.1em - 1px), ${mix(12)} calc(2.1em - 1px) 2.1em)` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x29": return <div className="w-full rounded-2xl border-2 border-dotted px-5 py-5" style={{ borderColor: mix(55), background: `radial-gradient(circle at 50% 120%, ${mix(18)}, transparent 60%)` }}>{head("text-center text-xl font-extrabold")}{body("mt-2 text-center")}{acc}</div>;
    case "x31": return <div className="relative w-full border px-6 py-5" style={{ borderColor: mix(30), clipPath: "polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px)", background: `linear-gradient(135deg, ${mix(14)}, transparent 50%)` }}><div className="absolute right-3 top-3 h-3 w-3 border-r-2 border-t-2" style={{ borderColor: col }} /><div className="absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2" style={{ borderColor: col }} />{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x32": return <div className="w-full rounded-2xl bg-card/70 px-5 py-4" style={{ background: `conic-gradient(from 200deg at 100% 0%, ${mix(30)}, transparent 25%), var(--card)` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x33": return <div className="w-full rounded-3xl border px-6 py-6" style={{ borderColor: mix(25), background: `radial-gradient(circle at 50% 0%, ${mix(30)} 0, transparent 45%), var(--card)` }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x34": return <div className="w-full overflow-hidden rounded-xl bg-card/70"><div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#f87171,#fbbf24,#34d399,#38bdf8,#a78bfa)" }} /><div className="px-5 py-4">{head("text-xl font-bold")}{body("mt-2")}{acc}</div></div>;
    case "x35": return <div className="w-full rounded-2xl border px-5 py-4" style={{ borderColor: mix(30), backgroundImage: `radial-gradient(ellipse 60% 30% at 50% 100%, ${mix(25)}, transparent), repeating-radial-gradient(circle at 50% 120%, transparent 0 18px, ${mix(7)} 18px 19px)` }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x36": return <div className="w-full rounded-full p-[2px]" style={{ background: `conic-gradient(${col}, transparent, ${col}, transparent, ${col})` }}><div className="rounded-full bg-card px-8 py-5">{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div></div>;
    case "x37": return <div className="w-full rounded-2xl px-5 py-4" style={{ background: `linear-gradient(120deg, ${mix(18)}, transparent 40%, ${mix(10)} 70%, transparent)`, border: `1px solid ${mix(20)}` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x38": return <div className="w-full rounded-[2rem] bg-card/80 px-6 py-5" style={{ boxShadow: `0 10px 40px -10px ${mix(45)}, inset 0 -6px 0 ${mix(12)}` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x39": return <div className="relative w-full rounded-2xl border bg-card/70 px-5 pb-4 pt-8" style={{ borderColor: mix(30) }}><div className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: col, boxShadow: `0 0 18px ${col}` }} />{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x40": return <div className="relative w-full overflow-hidden rounded-2xl border bg-card/70 px-5 py-4" style={{ borderColor: mix(25) }}><div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full" style={{ background: "var(--background)", boxShadow: `0 0 0 2px ${mix(50)}, 0 0 30px ${mix(40)}` }} /><div className="relative">{head("text-xl font-bold")}{body("mt-2")}{acc}</div></div>;
    case "x41": return <div className="w-full rounded-2xl px-5 py-4" style={{ background: `linear-gradient(0deg, var(--card) 40%, ${mix(28)})`, borderTop: `1px solid ${mix(60)}` }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x42": return <div className="w-full rounded-2xl px-5 py-4" style={{ background: `linear-gradient(180deg, var(--card) 40%, ${mix(28)})`, borderBottom: `1px solid ${mix(60)}` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x43": return <div className="w-full rounded-t-full border-2 px-8 pb-5 pt-10" style={{ borderColor: mix(40), background: mix(6) }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x44": return <div className="w-full rounded-[3rem] px-7 py-5" style={{ background: `radial-gradient(circle at 30% 20%, rgb(255 255 255 / .12), transparent 40%), ${mix(14)}`, border: `1px solid ${mix(35)}` }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x45": return <div className="relative w-full bg-card/70 px-6 py-5"><div className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4" style={{ borderColor: col }} /><div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4" style={{ borderColor: col }} />{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x46": return <div className="w-full rounded-xl bg-card/70 px-5 py-4" style={{ borderRight: `6px solid ${col}`, borderLeft: `1px solid ${mix(25)}`, boxShadow: `-14px 0 24px -20px ${col}` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x47": return <div className="w-full rounded-lg border-2 p-2" style={{ borderColor: mix(30), background: mix(8) }}><div className="rounded-md bg-card px-5 py-4" style={{ boxShadow: `inset 0 2px 8px rgb(0 0 0 / .5)` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div></div>;
    case "x48": return <div className="w-full rounded-t-[50%_2.5rem] border-t-2 bg-card/70 px-6 pb-5 pt-8" style={{ borderColor: col, background: `linear-gradient(180deg, ${mix(14)}, transparent)` }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x49": return <div className="w-full"><div className="mx-6 h-2 rounded-t-lg" style={{ background: mix(40) }} /><div className="rounded-xl border-2 px-5 py-4" style={{ borderColor: mix(40), background: mix(5) }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div><div className="mx-6 h-2 rounded-b-lg" style={{ background: mix(40) }} /></div>;
    case "x50": return <div className="w-full rounded-xl border-[10px] px-5 py-4" style={{ borderColor: mix(14), outline: `1px solid ${mix(45)}`, background: `linear-gradient(135deg, rgb(255 255 255 / .05), transparent)` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x51": return <div className="relative w-full rounded-2xl border px-5 py-4" style={{ borderColor: mix(30), backgroundImage: `radial-gradient(circle at 100% 100%, transparent 30px, ${mix(10)} 31px, transparent 32px), radial-gradient(circle at 100% 100%, transparent 60px, ${mix(10)} 61px, transparent 62px)` }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x52": return <div className="relative w-full overflow-hidden rounded-xl border bg-card/70 px-5 py-4" style={{ borderColor: mix(30) }}><div className="pointer-events-none absolute inset-y-0 left-0 w-1/3" style={{ background: `linear-gradient(90deg, ${mix(20)}, transparent)` }} /><div className="relative">{head("text-xl font-bold")}{body("mt-2")}{acc}</div></div>;
    case "x53": return <div className="w-full px-4 py-5"><div className="mb-3 flex items-center gap-2"><div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${col})` }} /><div className="h-2 w-2 rotate-45" style={{ background: col }} /><div className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${col})` }} /></div>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x54": return <div className="w-full rounded-2xl border-l-4 border-r-4 bg-card/60 px-6 py-4" style={{ borderColor: mix(55), boxShadow: `0 0 0 1px ${mix(10)}` }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x55": return <div className="w-full rounded-2xl px-5 py-4" style={{ background: `radial-gradient(60% 120% at 50% 50%, ${mix(26)}, transparent), var(--card)`, boxShadow: `0 0 40px -10px ${col}` }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x56": return <div className="w-full rounded-xl border bg-card/70 px-5 py-4" style={{ borderColor: mix(30), backgroundImage: `linear-gradient(90deg, transparent calc(50% - 1px), ${mix(18)} 50%, transparent calc(50% + 1px))` }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x57": return <div className="relative w-full rounded-xl border bg-card/70 py-4 pl-5 pr-10" style={{ borderColor: mix(30) }}><div className="absolute right-4 top-5 flex flex-col gap-1">{[0,1,2].map((n) => <span key={n} className="h-1.5 w-1.5 rounded-full" style={{ background: col, opacity: 1 - n * 0.3 }} />)}</div>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x58": return <div className="w-full rounded-md border-2 px-6 py-5" style={{ borderColor: col, borderStyle: "solid dashed", background: mix(6) }}>{head("text-xl font-bold")}{body("mt-2")}{acc}</div>;
    case "x59": return <div className="w-full rounded-b-full border-2 border-t-0 px-8 pb-10 pt-5" style={{ borderColor: mix(40), background: `linear-gradient(0deg, ${mix(12)}, transparent)` }}>{head("text-center text-xl font-bold")}{body("mt-2 text-center")}{acc}</div>;
    case "x60": return <div className="w-full rounded-3xl p-[2px]" style={{ background: `linear-gradient(90deg, ${col}, ${mix(20)}, ${col})` }}><div className="rounded-[calc(1.5rem-2px)] px-6 py-6" style={{ background: `radial-gradient(ellipse at top, ${mix(20)}, var(--card) 70%)` }}>{head("text-center text-2xl font-black")}{both && <div className="mx-auto my-4 flex justify-center gap-2">{[0,1,2].map((n) => <span key={n} className="h-1 w-6 rounded-full" style={{ background: col }} />)}</div>}{body("text-center")}{acc}</div></div>;
    default: return <div className="w-full rounded-3xl border-2 px-6 py-6" style={{ borderColor: col, background: `radial-gradient(ellipse at bottom, ${mix(25)}, transparent 70%)`, boxShadow: `0 0 50px -18px ${col}` }}>{head("text-center text-2xl font-black")}{both && <div className="mx-auto my-4 h-0.5 w-24 rounded-full" style={{ background: col }} />}{body("text-center")}{acc}</div>;
  }
}

