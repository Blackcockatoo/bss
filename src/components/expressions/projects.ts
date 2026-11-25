import { EXPRESSIONS, FORMS, getExpression, parseRecipe, type Recipe } from "@/lib/expressions/studio";
import type { PetForm } from "@/lib/petForms";
import { BACKGROUNDS, DEFAULT_CAPTION, DEFAULT_SCENE, type Caption, type Scene } from "./ExpressionArt";

export const CREATIVE_STORAGE = "metapet:expressions:projects:v2";
const keyFor = (petId: string) => `${CREATIVE_STORAGE}:${petId}`;
const LEGACY_STORAGE = "metapet:expressions:v1";
export const MAX_CAPTION = 140;
export const PANEL_COUNTS = [2, 3, 4, 6] as const;
export type Panel = { form: PetForm; expressionId: string; background: Scene["background"]; bubble: string; style: Caption["style"] };
export type CreativeData = { favorites: string[]; recent: string[]; recipe: Recipe | null; comic: Panel[]; meme: Caption | null };
export const emptyCreativeData = (): CreativeData => ({ favorites: [], recent: [], recipe: null, comic: [], meme: null });

export function newPanel(form: PetForm, expressionId: string): Panel {
  return { form, expressionId, background: "midnight", bubble: "", style: "speech" };
}

function readCaption(value: Partial<Caption> | null | undefined): Caption | null {
  if (!value || typeof value !== "object") return null;
  const text = (input: unknown) => typeof input === "string" ? input.slice(0, MAX_CAPTION) : "";
  return {
    ...DEFAULT_CAPTION, top: text(value.top), bottom: text(value.bottom), bubble: text(value.bubble),
    style: value.style === "thought" || value.style === "narration" ? value.style : "speech",
    align: value.align === "left" || value.align === "right" ? value.align : "center",
    size: typeof value.size === "number" && Number.isFinite(value.size) ? Math.min(42, Math.max(18, value.size)) : 32,
    outline: value.outline !== false,
  };
}

export function loadCreativeData(petId: string): CreativeData {
  try {
    const raw = localStorage.getItem(keyFor(petId));
    if (!raw || raw.length > 16_384) return emptyCreativeData();
    const data = JSON.parse(raw);
    if (data?.version !== 2 || data.petId !== petId) return emptyCreativeData();
    const ids = (items: unknown, max: number) => Array.isArray(items) ?
      [...new Set(items.filter((item): item is string => !!getExpression(item)))].slice(0, max) : [];
    const comic: Panel[] = [];
    if (Array.isArray(data.comic) && PANEL_COUNTS.some(count => count === data.comic.length)) {
      for (const item of data.comic) {
        if (!item || !FORMS.includes(item.form) || !getExpression(item.expressionId)) break;
        const caption = readCaption(item);
        comic.push({
          form: item.form, expressionId: item.expressionId,
          background: Object.hasOwn(BACKGROUNDS, item.background) ? item.background : DEFAULT_SCENE.background,
          bubble: caption?.bubble ?? "", style: caption?.style ?? "speech",
        });
      }
    }
    let recipe: Recipe | null = null;
    try { recipe = parseRecipe(JSON.stringify(data.recipe)); } catch { /* A corrupt recipe is discarded independently. */ }
    return { favorites: ids(data.favorites, EXPRESSIONS.length), recent: ids(data.recent, 8),
      recipe, comic: comic.length === data.comic?.length ? comic : [], meme: readCaption(data.meme) };
  } catch {
    return emptyCreativeData();
  }
}

export function saveCreativeData(petId: string, data: CreativeData) {
  localStorage.setItem(keyFor(petId), JSON.stringify({ version: 2, petId, ...data }));
}

export function clearCreativeData(petId: string) {
  localStorage.removeItem(keyFor(petId));
  try {
    const portrait = JSON.parse(sessionStorage.getItem(LEGACY_STORAGE) ?? "null");
    if (portrait?.petId === petId) sessionStorage.removeItem(LEGACY_STORAGE);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    sessionStorage.removeItem(LEGACY_STORAGE);
  }
}
