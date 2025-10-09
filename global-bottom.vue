<template></template>

<script setup lang="ts">
import { useNav } from '@slidev/client';
import { useDynamicSlideInfo } from '@slidev/client/composables/useSlideInfo.ts';
import { watch } from 'vue';

const { currentPage } = useNav();
const { info, update } = useDynamicSlideInfo(currentPage);

const eventHandlers = new WeakMap<HTMLElement, {
  pointermove: (e: PointerEvent) => void,
  pointerup: (e: PointerEvent) => void
}>();

// FIXME: cannot attach event handlers on startup
watch(info, async (newInfo) => {
  if (!newInfo) { return }

  let elements = document.querySelectorAll(`.slidev-page-${currentPage.value} > .slidev-layout *[data-markdown-map]`);
  console.log(`Current slide elements:`, elements, newInfo, currentPage.value);

  for (const el of elements) {
    if (!(el instanceof HTMLElement)) { continue }

    const handlers = eventHandlers.get(el);
    if (handlers) {
      el.removeEventListener("pointermove", handlers.pointermove);
      el.removeEventListener("pointerup", handlers.pointerup);
      eventHandlers.delete(el);
    }

    const { markdownMap } = el.dataset;
    if (!markdownMap) { continue }

    el.draggable = false;
    el.style.cursor = "move";

    const handlePointermoveEvent = (e: PointerEvent) => {
      if (e.buttons) {
        el.style.position = "relative";
        el.style.left = `${(parseInt(el.style.left || "0") + e.movementX)}px`;
        el.style.top = `${(parseInt(el.style.top || "0") + e.movementY)}px`;
        el.setPointerCapture(e.pointerId)
      }
    }

    const handlePointerupEvent = async (_e: PointerEvent) => {
      const clonedEl = el.cloneNode(true) as HTMLElement;
      clonedEl.removeAttribute("data-markdown-map");
      clonedEl.removeAttribute("draggable");
      clonedEl.style.removeProperty("cursor");

      const [_tag, lineStart, lineEnd] = markdownMap.split("-");
      const content = [
        ...newInfo.content.split('\n').slice(0, Number(lineStart)),
        clonedEl.outerHTML,
        ...newInfo.content.split('\n').slice(Number(lineEnd))
      ].join('\n');

      await update({
        content,
        // FIXME: support HMR
        skipHmr: true,
      });
    }

    el.addEventListener("pointermove", handlePointermoveEvent);
    el.addEventListener("pointerup", handlePointerupEvent);

    eventHandlers.set(el, {
      pointermove: handlePointermoveEvent,
      pointerup: handlePointerupEvent
    });
  }
});
</script>
