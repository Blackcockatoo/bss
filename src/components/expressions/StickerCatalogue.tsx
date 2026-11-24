import { useEffect, useRef, useState } from "react";
import type { PetForm } from "@/lib/petForms";
import type { CreatureSnapshot } from "@/lib/expressions/snapshot";
import { DEFAULT_SETTINGS, getExpression, type Expression } from "@/lib/expressions/studio";
import { DEFAULT_CAPTION, DEFAULT_SCENE } from "./ExpressionArt";
import { canvasBlob, createFrameRenderer } from "./export";

export function StickerCatalogue({
  visible, pet, form, selected, buttonClass, onSelect, busy,
}: {
  visible: Expression[]; pet: CreatureSnapshot; form: PetForm; selected: string; buttonClass: string;
  onSelect: (expression: Expression) => void; busy: boolean;
}) {
  const region = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, string>());
  const [images, setImages] = useState<Record<string, string>>({});
  // Filtering only changes which static images get requested.
  const listKey = visible.map(item => item.id).join(" ");

  useEffect(() => () => {
    for (const url of cache.current.values()) URL.revokeObjectURL(url);
    cache.current.clear();
  }, []);

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
      if (expression && !cache.current.has(next)) {
        try {
          const { canvas } = await renderer.draw({
            pet, form, expression, scene: DEFAULT_SCENE, caption: DEFAULT_CAPTION,
            settings: DEFAULT_SETTINGS, reducedMotion: true,
          }, 96, controller.signal);
          const blob = await canvasBlob(canvas);
          controller.signal.throwIfAborted();
          const url = URL.createObjectURL(blob);
          cache.current.set(next, url);
          setImages(old => ({ ...old, [next]: url }));
        } catch { /* A failed thumbnail still has a labelled expression button. */ }
      }
      if (!controller.signal.aborted) timer = window.setTimeout(() => void drawNext(), 48);
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.getAttribute("data-expression-id");
        if (id && !cache.current.has(id)) queue.add(id);
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
  }, [busy, form, listKey, pet]);

  return (
    <div ref={region} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {visible.map(item => (
        <button type="button" key={item.id} data-expression-id={item.id} aria-pressed={item.id === selected}
          className={buttonClass + (item.id === selected ? " border-amber-300 bg-amber-300/10 text-amber-200" : "") + " grid justify-items-center break-words py-1.5"}
          onClick={() => onSelect(item)}>
          <span aria-hidden="true" className="block size-[58px]">
            {images[item.id] && <img src={images[item.id]} width="58" height="58" alt="" loading="lazy" decoding="async" />}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
