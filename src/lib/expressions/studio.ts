import type { PetForm } from "@/lib/petForms";
import { serializeGeometrySprite } from "@/lib/games/geometryPilot";

export const EXPRESSION_STORAGE = "metapet:expressions:v1";
export const FORMS = ["auralia", "evolved", "geometry"] as const;
export const EXPRESSIONS = [
  ["hello","Hello","Everyday","✦"], ["bye","See you!","Everyday","✧"],
  ["yes","YES!","Everyday","✓"], ["thanks","Thank you","Everyday","♥"],
  ["happy","Happy","Feelings","✦"], ["love","Love","Feelings","♥"],
  ["sad","Feeling blue","Feelings","…"], ["sleepy","Goodnight","Feelings","Z"],
  ["lol","LOL","Funny","!"], ["bruh","Bruh","Funny","…"],
  ["side-eye","Side-eye","Funny","?"], ["oops","Oops!","Funny","!"],
  ["think","Thinking","Learning","?"], ["eureka","Eureka!","Learning","✦"],
  ["focus","Focus mode","Learning","◎"], ["solved","Solved it!","Learning","✓"],
  ["win","Victory","Celebration","★"], ["champion","Champion","Celebration","♛"],
  ["level","Level up","Celebration","↑"], ["party","Party time","Celebration","✦"],
  ["dance","Dance mode","Cosmic","♪"], ["lotus","Lotus","Cosmic","◎"],
  ["orbit","In orbit","Cosmic","✧"], ["chaos","Chaos mode","Cosmic","⚡"],
] as const;
export type Expression = (typeof EXPRESSIONS)[number];
export type Portraits = Partial<Record<PetForm, string>>;
type Packet = { version: 1; petId: string; portraits: Portraits };

export function loadPortraits(petId: string): Portraits {
  try {
    const data = JSON.parse(sessionStorage.getItem(EXPRESSION_STORAGE) ?? "null") as Packet | null;
    if (!data || data.version !== 1 || data.petId !== petId) return {};
    const result: Portraits = {};
    for (const form of FORMS) {
      const image = data.portraits?.[form];
      if (typeof image === "string" && image.length <= 500_000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image)) result[form] = image;
    }
    return result;
  } catch { return {}; }
}

function localSvg(original: SVGSVGElement): string {
  const clone = original.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
  clone.setAttribute("width","256");
  clone.setAttribute("height","256");
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  for (const node of [clone, ...clone.querySelectorAll("*")]) {
    if (["script","foreignobject","image","iframe","style","link"].includes(node.tagName.toLowerCase())) throw new Error("This portrait contains an unsupported asset.");
    for (const attr of [...node.attributes]) {
      const value = attr.value.trim();
      if (/^on/i.test(attr.name) || (/(?:^|:)(?:href|src)$/i.test(attr.name) && !value.startsWith("#")) ||
          [...value.matchAll(/url\(([^)]*)\)/gi)].some(m => !m[1].trim().replace(/^['"]|['"]$/g,"").startsWith("#"))) {
        throw new Error("This portrait contains an unsupported reference.");
      }
    }
  }
  return new XMLSerializer().serializeToString(clone);
}

export async function capturePortrait(form: PetForm, petId: string): Promise<void> {
  const stage = document.querySelector<HTMLElement>(form === "auralia" ? '[data-testid="auralia-pet-runtime"]' : form === "evolved" ? '[data-testid="visual-dna-pet-runtime"]' : '[data-testid="geometry-pet-runtime"]');
  if (!stage || !petId) throw new Error("Wait for your registered companion to appear.");
  const original = stage.querySelector<SVGSVGElement>(form === "auralia" ? "svg.auralia-pet-svg" : 'svg[aria-label*="visual DNA pet"]');
  const svg = form === "geometry" ? serializeGeometrySprite(stage, petId) : original ? localSvg(original) : null;
  if (!svg) throw new Error("Your portrait is still loading.");
  const image = new Image();
  image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser cannot render this portrait.");
  ctx.drawImage(image,0,0,256,256);
  const png = canvas.toDataURL("image/png");
  if (!png.startsWith("data:image/png;base64,") || png.length > 500_000) throw new Error("This portrait is too large.");
  const portraits = {...loadPortraits(petId), [form]: png};
  sessionStorage.setItem(EXPRESSION_STORAGE, JSON.stringify({version:1,petId,portraits}));
}

export async function drawSticker(canvas: HTMLCanvasElement, png: string, expression: Expression, caption: boolean, transparent: boolean): Promise<void> {
  const image = new Image();
  image.src = png;
  await image.decode();
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  canvas.width = canvas.height = 512;
  const [,label,pack,symbol] = expression;
  if (!transparent) {ctx.fillStyle="#101b35";ctx.fillRect(0,0,512,512);}
  const color = pack === "Feelings" ? "#f5a9ca" : pack === "Funny" ? "#b6a4ff" : pack === "Learning" ? "#8de9f0" : "#e5bd69";
  ctx.save();
  ctx.translate(256,235);
  ctx.rotate(expression[0] === "side-eye" ? -.12 : expression[0] === "chaos" ? .13 : 0);
  if (expression[0] === "sleepy") ctx.scale(1,.88);
  ctx.drawImage(image,-190,-190,380,380);
  ctx.restore();
  ctx.fillStyle=color;
  ctx.font="bold 44px system-ui, sans-serif";
  ctx.textAlign="center";
  ctx.fillText(symbol,420,80);
  ctx.fillText(symbol,91,355);
  if (caption) {
    ctx.font="bold 41px system-ui, sans-serif";
    ctx.lineWidth=10;
    ctx.lineJoin="round";
    ctx.strokeStyle="#101b35";
    ctx.strokeText(label,256,473,460);
    ctx.fillStyle="#fff1cc";
    ctx.fillText(label,256,473,460);
  }
}
