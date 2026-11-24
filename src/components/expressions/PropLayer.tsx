import type { PetForm } from "@/lib/petForms";
import type { PropKind } from "@/lib/expressions/contract";
import type { ActiveProp } from "@/lib/expressions/studio";

/**
 * Original, procedurally drawn performance props. Every prop is plain SVG
 * geometry (no fonts, bitmaps or external references) so stickers export
 * identically everywhere. Props support a performance; they never replace
 * the creature's own movement.
 */
export type PropAnchor = { cx: number; top: number; eye: number; headR: number; right: number; left: number; base: number };

/** Head/body landmarks in the 512px sticker space, before body motion. */
export const PROP_ANCHORS: Record<PetForm, PropAnchor> = {
  auralia: { cx: 256, top: 128, eye: 178, headR: 50, right: 330, left: 182, base: 372 },
  evolved: { cx: 256, top: 132, eye: 200, headR: 70, right: 372, left: 140, base: 372 },
  geometry: { cx: 256, top: 118, eye: 237, headR: 58, right: 371, left: 141, base: 394 },
};

const GOLD = "#d9b45a";
const CREAM = "#fff3d1";
const CYAN = "#8be8ef";
const PINK = "#ff9cbf";
const INK = "#10182c";

const fade = (t: number) => Math.min(1, t * 6, (1 - t) * 6);

function Prop({ kind, t, a }: { kind: PropKind; t: number; a: PropAnchor }) {
  const o = fade(t);
  switch (kind) {
    case "zzz":
      return <g fill="none" stroke={CREAM} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {[0, 1, 2].map(i => {
          const local = (t * 1.4 + i * .33) % 1;
          const s = 10 + i * 4;
          return <path key={i} opacity={Math.sin(Math.PI * local) * o} transform={`translate(${a.right - 8 + i * 18 + local * 10} ${a.top - 6 - local * 46 - i * 10})`}
            d={`M${-s / 2} ${-s / 2}H${s / 2}L${-s / 2} ${s / 2}H${s / 2}`} />;
        })}
      </g>;
    case "question":
      return <g opacity={o} transform={`translate(${a.right - 6} ${a.top - 18 - Math.sin(t * Math.PI * 4) * 4}) rotate(${Math.sin(t * Math.PI * 3) * 10})`}>
        <path d="M-10-12C-10-24 10-24 10-12 10-4 0-3 0 6" fill="none" stroke={CYAN} strokeWidth="6" strokeLinecap="round" />
        <circle cx="0" cy="17" r="4" fill={CYAN} />
      </g>;
    case "exclaim":
      return <g opacity={o} transform={`translate(${a.right} ${a.top - 20}) scale(${1 + Math.sin(Math.min(1, t * 4) * Math.PI) * .25})`}>
        <path d="M-4-26H4L2 4H-2Z" fill={GOLD} /><circle cx="0" cy="14" r="4.5" fill={GOLD} />
      </g>;
    case "sweat":
      return <path opacity={o} transform={`translate(${a.cx + a.headR * .95} ${a.eye - 26 + t * 34})`}
        d="M0-12C5-4 8 0 8 4A8 8 0 0 1-8 4C-8 0-5-4 0-12Z" fill="#9fd8ef" stroke="#e4f7ff" strokeWidth="1.5" />;
    case "tear":
      return <g opacity={o}>{[-1, 1].map(side => {
        const local = (t * 2 + (side > 0 ? .5 : 0)) % 1;
        return <path key={side} transform={`translate(${a.cx + side * a.headR * .42} ${a.eye + 14 + local * 46})`} opacity={1 - local * .6}
          d="M0-7C3-2 5 0 5 3A5 5 0 0 1-5 3C-5 0-3-2 0-7Z" fill="#8fd3ff" />;
      })}</g>;
    case "heart":
      return <path opacity={o} transform={`translate(${a.cx + a.headR * .9} ${a.top - 10 - t * 26}) scale(${2.2 + Math.sin(t * Math.PI * 6) * .3})`}
        d="M0 5C-11-1-5-9 0-4 5-9 11-1 0 5Z" fill={PINK} />;
    case "bulb":
      return <g opacity={o} transform={`translate(${a.cx} ${a.top - 40}) scale(${.7 + Math.min(1, t * 5) * .3})`}>
        {[0, 1, 2, 3, 4].map(i => <path key={i} d="M0-36V-46" stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${-60 + i * 30})`} />)}
        <circle cx="0" cy="-10" r="17" fill="#ffe08a" stroke={GOLD} strokeWidth="3" />
        <path d="M-8 8H8V16H-8Z" fill={CREAM} stroke={GOLD} strokeWidth="2" />
      </g>;
    case "notes":
      return <g opacity={o} fill={CYAN}>{[0, 1].map(i => {
        const local = (t * 1.5 + i * .5) % 1;
        return <g key={i} transform={`translate(${(i ? a.left : a.right) + (i ? -6 : 6)} ${a.top + 20 - local * 50}) rotate(${Math.sin(local * Math.PI * 2) * 12})`} opacity={Math.sin(Math.PI * local)}>
          <ellipse cx="-4" cy="10" rx="6" ry="4.5" /><path d="M1 10V-12L12-8V-2L3-5V10Z" />
        </g>;
      })}</g>;
    case "steam":
      return <g opacity={o} fill="#d9e1ea">{[-1, 1].map(side => [0, 1, 2].map(i => {
        const local = (t * 2 + i * .33) % 1;
        return <circle key={side + ":" + i} cx={a.cx + side * (a.headR * .7 + local * 16)} cy={a.top + 4 - local * 40} r={5 + local * 7} opacity={1 - local} />;
      }))}</g>;
    case "dizzy":
      return <g opacity={o}>{[0, 1, 2].map(i => {
        const ang = t * Math.PI * 6 + i * Math.PI * 2 / 3;
        return <path key={i} transform={`translate(${a.cx + Math.cos(ang) * a.headR * 1.1} ${a.top + 4 + Math.sin(ang) * 12})`}
          d="M0-7L2-2 7 0 2 2 0 7-2 2-7 0-2-2Z" fill={GOLD} />;
      })}</g>;
    case "ellipsis":
      return <g opacity={o} fill={CREAM}>{[0, 1, 2].map(i =>
        <circle key={i} cx={a.right - 4 + i * 15} cy={a.top - 10} r="5" opacity={t * 3.2 > i * .9 ? 1 : .15} />)}</g>;
    case "blush":
      return <g opacity={o * .75} fill={PINK}>{[-1, 1].map(side =>
        <ellipse key={side} cx={a.cx + side * a.headR * .62} cy={a.eye + 16} rx={a.headR * .2} ry={a.headR * .1} />)}</g>;
    case "motion":
      return <g opacity={o} stroke={CREAM} strokeWidth="3.5" strokeLinecap="round">
        {[0, 1, 2].map(i => <path key={i} d={`M${a.left - 18 - i * 6} ${a.eye + i * 28}h${-26 + i * 6}`} />)}
      </g>;
    case "glitch":
      return <g opacity={o * .8}>{[0, 1, 2, 3].map(i => {
        const shift = Math.sin(t * 37 + i * 11) * 18;
        return <rect key={i} x={a.left + shift} y={a.top + 30 + i * 52 + Math.sin(t * 23 + i) * 10} width={a.right - a.left} height={5 + (i % 2) * 4}
          fill={i % 2 ? CYAN : PINK} opacity=".55" />;
      })}</g>;
    case "bolt":
      return <path opacity={o * (Math.sin(t * Math.PI * 10) > -.3 ? 1 : .2)} transform={`translate(${a.right + 4} ${a.top - 6})`}
        d="M4-28-12 2H0L-6 26 12-6H0Z" fill="#ffe08a" stroke={GOLD} strokeWidth="2" strokeLinejoin="round" />;
    case "sun":
      return <g opacity={o} transform={`translate(${a.left - 18} ${a.top - 20 - t * 10}) rotate(${t * 40})`}>
        {Array.from({ length: 8 }, (_, i) => <path key={i} d="M0-24V-31" stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${i * 45})`} />)}
        <circle r="16" fill="#ffd36e" />
      </g>;
    case "moon":
      return <path opacity={o} transform={`translate(${a.right + 12} ${a.top - 22})`} d="M10-18A20 20 0 1 0 10 18 15 15 0 1 1 10-18Z" fill="#eac978" />;
    case "sparkle":
      return <g opacity={o} fill={CREAM}>{[0, 1].map(i => {
        const s = 1 + Math.sin(t * Math.PI * 6 + i * 2) * .35;
        return <path key={i} transform={`translate(${i ? a.left + 4 : a.right - 2} ${a.top + (i ? 26 : -4)}) scale(${s * (i ? .8 : 1.1)})`}
          d="M0-12C1-3 3-1 12 0 3 1 1 3 0 12-1 3-3 1-12 0-3-1-1-3 0-12Z" />;
      })}</g>;
    case "lens":
      return <g opacity={o} transform={`translate(${a.right + 2} ${a.eye + Math.sin(t * Math.PI * 4) * 8}) rotate(-20)`}>
        <circle r="20" fill={CYAN} fillOpacity=".18" stroke={GOLD} strokeWidth="5" />
        <path d="M14 14 30 30" stroke={GOLD} strokeWidth="7" strokeLinecap="round" />
      </g>;
    case "book":
      return <g opacity={o} transform={`translate(${a.cx} ${a.base - 8})`}>
        <path d="M-40-8Q-20-16 0-6Q20-16 40-8V14Q20 6 0 16Q-20 6-40 14Z" fill={CREAM} stroke={GOLD} strokeWidth="3" />
        <path d="M0-6V16" stroke={GOLD} strokeWidth="2" />
      </g>;
    case "shield":
      return <g opacity={o} transform={`translate(${a.right - 4} ${a.eye + 40}) scale(${.8 + Math.min(1, t * 4) * .2})`}>
        <path d="M0-30 26-20V2C26 18 12 28 0 34-12 28-26 18-26 2V-20Z" fill="#1b2b48" stroke={GOLD} strokeWidth="4" />
        <path d="M0-16V20M-13 0H13" stroke={CYAN} strokeWidth="4" strokeLinecap="round" />
      </g>;
    case "flag":
      return <g opacity={o} transform={`translate(${a.right + 8} ${a.top + 30})`}>
        <path d="M0-50V40" stroke={CREAM} strokeWidth="4" strokeLinecap="round" />
        <path d={`M2-50Q18 ${-56 + Math.sin(t * Math.PI * 6) * 6} 38-48Q22-38 38-26Q18 ${-32 + Math.sin(t * Math.PI * 6 + 1) * 6} 2-28Z`} fill={GOLD} />
      </g>;
    case "gem":
      return <g opacity={o} transform={`translate(${a.cx} ${a.top - 34 - Math.sin(Math.min(1, t * 2) * Math.PI / 2) * 10}) rotate(${Math.sin(t * Math.PI * 4) * 8})`}>
        <path d="M-18-8-8-18H8L18-8 0 20Z" fill={CYAN} stroke="#e4fbff" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-18-8H18M-8-18-4-8 0 20 4-8 8-18" fill="none" stroke="#e4fbff" strokeWidth="1.5" />
      </g>;
    case "check":
      return <path opacity={o} transform={`translate(${a.right + 4} ${a.top - 8})`} d="M-16 0-4 12 18-14" fill="none" stroke="#9be6a8" strokeWidth="7"
        strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={Math.max(0, 1 - t * 4)} />;
    case "cross":
      return <path opacity={o} transform={`translate(${a.right + 4} ${a.top - 8})`} d="M-13-13 13 13M13-13-13 13" stroke="#ff8f8f" strokeWidth="7" strokeLinecap="round" />;
    case "ring":
      return <g opacity={o} fill="none">{[0, 1].map(i => {
        const local = (t * 1.2 + i * .5) % 1;
        return <ellipse key={i} cx={a.cx} cy={a.top - 6} rx={a.headR * (.55 + local * .9)} ry={a.headR * (.14 + local * .22)}
          stroke={i ? CYAN : GOLD} strokeWidth="3" opacity={1 - local} />;
      })}</g>;
    case "shades":
      return <g opacity={o} transform={`translate(${a.cx} ${a.eye - 2})`}>
        <path d={`M${-a.headR * .9} -4H${a.headR * .9}`} stroke={INK} strokeWidth="4" />
        {[-1, 1].map(side => <path key={side} transform={`translate(${side * a.headR * .42} 0)`}
          d={`M${-a.headR * .34} -6H${a.headR * .34}L${a.headR * .26} 10Q0 16 ${-a.headR * .26} 10Z`} fill={INK} stroke={GOLD} strokeWidth="2" />)}
      </g>;
  }
}

export function PropLayer({ props, anchor }: { props: readonly ActiveProp[]; anchor: PropAnchor }) {
  if (!props.length) return null;
  return <g data-expression-props="">{props.map((item, i) => <g key={item.kind + i} data-prop={item.kind}><Prop kind={item.kind} t={item.t} a={anchor} /></g>)}</g>;
}
