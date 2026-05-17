<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useDnd, slotKey, type DropSlot } from '../composables/useDnd'
import { useEditorStore } from '../stores/editor'
import { isContainer } from '../types/mjml'

const props = defineProps<{
  iframeEl: HTMLIFrameElement | null
}>()

const store = useEditorStore()
const { dragType, draggedBlock, validSlots, drop, endDrag } = useDnd()

interface SlotRect {
  slot: DropSlot
  left: number
  top: number
  width: number
  height: number
  variant: 'line-horizontal' | 'line-vertical' | 'box-empty'
}

const slotRects = ref<SlotRect[]>([])
const activeKey = ref<string | null>(null)


function rectsOf(els: (Element | null)[]): DOMRect[] {
  return els.filter((el): el is Element => !!el).map((el) => el.getBoundingClientRect())
}

function recompute() {
  if (!props.iframeEl?.contentDocument || !dragType.value) {
    slotRects.value = []
    return
  }
  const doc = props.iframeEl.contentDocument
  const results: SlotRect[] = []

  for (const slot of validSlots.value) {
    const parentEl = doc.querySelector('.mjed-' + slot.parentId)
    if (!parentEl) continue
    const parentNode = store.findNode(slot.parentId)?.node
    if (!parentNode || !isContainer(parentNode)) continue

    const orientation = slot.parentType === 'mj-section' ? 'vertical' : 'horizontal'

    if (slot.childrenCount === 0) {
      const r = parentEl.getBoundingClientRect()
      const minSize = 60
      const top = r.top
      const left = r.left
      const width = Math.max(r.width, minSize)
      const height = Math.max(r.height, minSize)
      results.push({ slot, left, top, width, height, variant: 'box-empty' })
      continue
    }

    const childEls = parentNode.children.map((c) => doc.querySelector('.mjed-' + c.id))
    const childRects = rectsOf(childEls)
    if (childRects.length === 0) continue

    if (orientation === 'horizontal') {
      let y: number
      if (slot.index === 0) y = childRects[0].top
      else if (slot.index >= childRects.length) y = childRects[childRects.length - 1].bottom
      else y = (childRects[slot.index - 1].bottom + childRects[slot.index].top) / 2

      const left = Math.min(...childRects.map((r) => r.left))
      const right = Math.max(...childRects.map((r) => r.right))
      results.push({
        slot,
        left,
        top: y,
        width: right - left,
        height: 0,
        variant: 'line-horizontal',
      })
    } else {
      let x: number
      if (slot.index === 0) x = childRects[0].left
      else if (slot.index >= childRects.length) x = childRects[childRects.length - 1].right
      else x = (childRects[slot.index - 1].right + childRects[slot.index].left) / 2

      const top = Math.min(...childRects.map((r) => r.top))
      const bottom = Math.max(...childRects.map((r) => r.bottom))
      results.push({
        slot,
        left: x,
        top,
        width: 0,
        height: bottom - top,
        variant: 'line-vertical',
      })
    }
  }

  slotRects.value = results
}

watch(dragType, recompute, { flush: 'post' })
watch(validSlots, recompute, { flush: 'post' })

function onResize() {
  if (dragType.value) recompute()
}

let scrollHandler: (() => void) | null = null

function attachScrollHandler() {
  detachScrollHandler()
  const doc = props.iframeEl?.contentDocument
  if (!doc) return
  scrollHandler = () => recompute()
  doc.addEventListener('scroll', scrollHandler, true)
  doc.defaultView?.addEventListener('scroll', scrollHandler, true)
}

function detachScrollHandler() {
  if (!scrollHandler) return
  const doc = props.iframeEl?.contentDocument
  doc?.removeEventListener('scroll', scrollHandler, true)
  doc?.defaultView?.removeEventListener('scroll', scrollHandler, true)
  scrollHandler = null
}

watch(dragType, (t) => {
  if (t) attachScrollHandler()
  else detachScrollHandler()
})

onMounted(() => {
  window.addEventListener('resize', onResize)
  if (dragType.value) {
    attachScrollHandler()
    recompute()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  detachScrollHandler()
})

function onDragOver(e: DragEvent, slot: DropSlot) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  const k = slotKey(slot)
  if (activeKey.value !== k) activeKey.value = k
}

function onDragLeave(slot: DropSlot) {
  if (activeKey.value === slotKey(slot)) activeKey.value = null
}

function onDrop(e: DragEvent, slot: DropSlot) {
  e.preventDefault()
  e.stopPropagation()
  drop(slot)
  activeKey.value = null
}

function onOverlayDragEnd() {
  endDrag()
  activeKey.value = null
}

function labelFor(): string {
  return draggedBlock.value?.label.toLowerCase() || 'block'
}

function styleFor(rect: SlotRect): Record<string, string> {
  const s: Record<string, string> = {
    left: rect.left + 'px',
    top: rect.top + 'px',
  }
  if (rect.variant === 'line-horizontal') {
    s.width = rect.width + 'px'
  } else if (rect.variant === 'line-vertical') {
    s.height = rect.height + 'px'
  } else {
    s.width = rect.width + 'px'
    s.height = rect.height + 'px'
  }
  return s
}
</script>

<template>
  <div
    v-if="dragType"
    class="drop-overlay"
    @dragend="onOverlayDragEnd"
  >
    <div
      v-for="rect in slotRects"
      :key="slotKey(rect.slot)"
      class="drop-slot"
      :class="[
        `drop-slot--${rect.variant}`,
        { 'drop-slot--active': activeKey === slotKey(rect.slot) },
      ]"
      :style="styleFor(rect)"
      @dragover="onDragOver($event, rect.slot)"
      @dragleave="onDragLeave(rect.slot)"
      @drop="onDrop($event, rect.slot)"
    >
      <span v-if="rect.variant === 'box-empty'" class="drop-slot__label">
        Drop {{ labelFor() }} here
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.drop-overlay {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  z-index: 10;
}

.drop-slot {
  position: absolute;
  pointer-events: auto;
  box-sizing: border-box;

  &--line-horizontal {
    height: 24px;
    transform: translateY(-12px);

    &::before {
      content: '';
      position: absolute;
      top: 11px;
      left: 0;
      right: 0;
      height: 2px;
      background: #60a5fa;
      border-radius: 2px;
      transition: background 0.1s, height 0.1s, top 0.1s;
    }
  }

  &--line-vertical {
    width: 24px;
    transform: translateX(-12px);

    &::before {
      content: '';
      position: absolute;
      left: 11px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #60a5fa;
      border-radius: 2px;
      transition: background 0.1s, width 0.1s, left 0.1s;
    }
  }

  &--box-empty {
    outline: 2px dashed #60a5fa;
    outline-offset: -2px;
    background: rgba(96, 165, 250, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s, outline-color 0.1s;
  }

  &__label {
    color: #2563eb;
    font: 600 11px -apple-system, BlinkMacSystemFont, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: white;
    padding: 4px 10px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    pointer-events: none;
  }

  &--active {
    &.drop-slot--line-horizontal::before {
      background: #2563eb;
      height: 4px;
      top: 10px;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
    }

    &.drop-slot--line-vertical::before {
      background: #2563eb;
      width: 4px;
      left: 10px;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
    }

    &.drop-slot--box-empty {
      background: rgba(37, 99, 235, 0.15);
      outline-color: #2563eb;
      outline-width: 3px;
    }
  }
}
</style>
