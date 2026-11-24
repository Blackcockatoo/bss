import { useEffect, useRef, useState } from "react";
import type { PetForm } from "@/lib/petForms";
import type { CreatureSnapshot } from "@/lib/expressions/snapshot";
import { DEFAULT_SETTINGS, getExpression, type Expression } from "@/lib/expressions/studio";
import { DEFAULT_CAPTION, DEFAULT_SCENE } from "./ExpressionArt";
import { canvasBlob, createFrameRenderer } from "./export";
import { appearanceHash, readThumbnail, thumbnailRequestKey, writeThumbnail } from "./thumbnailCache";

/** Thumbnails are per form: the same expression looks different on each body. */
export const thumbKey = (form: PetForm, id: string) => `${form}:${id}`;

export function StickerCatalogue({
  visible, pet, form, selected, buttonClass, onSelect, busy, epoch = 0,
}: {
  visible: Expression[]; pet: CreatureSnapshot; form: PetForm; selected: string; buttonClass: string;
  onSelect: (expression: Expression) => void; busy: boolean;
  /** Bumped when the user clears the thumbnail cache, so in-memory images are dropped too. */
  epoch?: number;
}) {
  const region = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, string>());
  const [images, setImages] = useState<Record<string, string>>({});
  // Filtering only changes which static images get requested.
  const listKey = visible.map(item => item.id).join(" ");

  const appearance = appearanceHash(pet);

  useEffect(() => {
    const owned = cache.current;
    return () => {
      for (const url of owned.values()) URL.revokeObjectURL(url);
      owned.clear();
      setImages({});
    };
  }, [epoch, appearance]);

  useEffect(() => {
    const list = region.current;
    if (!list || busy || typeof IntersectionObserver !== "function") return;
    const controller = new AbortController();
    const queue = new Set<string>();
    const renderer = createFrameRenderer();
    let active = false;
    let timer = 0;

    async function drawNext() {
      const next = queue.values().next().value;
      if (!next || controller.signal.aborted) { active = false; return; }
      queue.delete(next);
      const expression = getExpression(next);
      const key = thumbKey(form, next);
      if (expression && !cache.current.has(key)) {
        try {
          const stored = thumbnailRequestKey(appearance, form, next);
          let blob = await readThumbnail(stored);
          if (!blob) {
            const { canvas } = await renderer.draw({
              pet, form, expression, scene: DEFAULT_SCENE, caption: DEFAULT_CAPTION,
              settings: DEFAULT_SETTINGS, reducedMotion: true,
            }, 96, controller.signal);
            blob = await canvasBlob(canvas);
            controller.signal.throwIfAborted();
            await writeThumbnail(stored, blob);
          }
          controller.signal.throwIfAborted();
          const url = URL.createObjectURL(blob);
          cache.current.set(key, url);
          setImages(old => ({ ...old, [key]: url }));
        } catch { /* A failed thumbnail still has a labelled expression button. */ }
      }
      if (!controller.signal.aborted) timer = window.setTimeout(() => void drawNext(), 48);
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.getAttribute("data-expression-id");
        if (id && !cache.current.has(thumbKey(form, id))) queue.add(id);
        observer.unobserve(entry.target);
      }
      if (!active && queue.size) {
        active = true;
        timer = window.setTimeout(() => void drawNext(), 48);
      }
    }, { rootMargin: "60px" });
    for (const item of list.querySelectorAll("[data-expression-id]")) observer.observe(item);
    return () => {
      controller.abort();
      observer.disconnect();
      window.clearTimeout(timer);
      // React also owns the visible catalogue. Dispose the detached root
      // outside the current React commit.
      queueMicrotask(() => renderer.dispose());
    };
  }, [appearance, busy, epoch, form, listKey, pet]);

  return (
    <div ref={region} role="group" aria-label="Expression catalogue"
      className="grid max-h-[30rem] grid-cols-2 gap-2 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-3 lg:max-h-[38rem]">
      {visible.map(item => (
        <button type="button" key={item.id} data-expression-id={item.id} aria-pressed={item.id === selected}
          className={buttonClass + (item.id === selected ? " border-amber-300 bg-amber-300/10 text-amber-200" : "") + " grid justify-items-center break-words py-1.5"}
          onClick={() => onSelect(item)}>
          <span aria-hidden="true" className="block size-[58px]" data-thumbnail={images[thumbKey(form, item.id)] ? "ready" : "pending"}>
            {images[thumbKey(form, item.id)] && <img src={images[thumbKey(form, item.id)]} width="58" height="58" alt="" loading="lazy" decoding="async" />}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
