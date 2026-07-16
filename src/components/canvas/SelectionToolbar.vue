<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { useDnd } from '../../composables/useDnd'
import { useNodeActions } from '../../composables/useNodeActions'
import { markerSelector } from '../../utils/mjedMarker'

// The preview iframe runs allow-same-origin, so we read the selected element's
// rect straight from its contentDocument — the same technique DropOverlay uses
// to place drop lines. A rAF loop keeps the toolbar glued to the block across
// scrolls and post-edit re-renders (the render lands async via postMessage, so
// there is no single "rendered" moment to hook); it only writes reactive state
// when the position actually changed, so Vue stays idle between moves.
const props = defineProps<{
  iframeEl: HTMLIFrameElement | null
}>()

const store = useEditorStore()
const { dragType } = useDnd()
const { canMoveUp, canMoveDown, canDelete, duplicate, moveUp, moveDown, remove } = useNodeActions()

interface Box {
  top: number
  left: number
  width: number
}

const box = ref<Box | null>(null)

function recompute() {
  const doc = props.iframeEl?.contentDocument
  const id = store.selectedId
  if (!doc || !id) {
    if (box.value) box.value = null
    return
  }
  const el = doc.querySelector(markerSelector(id))
  if (!el) {
    if (box.value) box.value = null
    return
  }
  const r = el.getBoundingClientRect()
  const cur = box.value
  if (!cur || cur.top !== r.top || cur.left !== r.left || cur.width !== r.width) {
    box.value = { top: r.top, left: r.left, width: r.width }
  }
}

let raf = 0
function loop() {
  recompute()
  raf = requestAnimationFrame(loop)
}
function start() {
  if (!raf) raf = requestAnimationFrame(loop)
}
function stop() {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
  box.value = null
}

watch(
  () => store.selectedId,
  (id) => (id ? start() : stop()),
  { immediate: true },
)

onMounted(() => {
  if (store.selectedId) start()
})
onBeforeUnmount(stop)

// Sit just above the top-right corner; flip to just inside when the block hugs
// the canvas top so the bar never clips out of view.
const style = computed(() => {
  const b = box.value
  if (!b) return { display: 'none' }
  const above = b.top >= 34
  return {
    left: `${b.left + b.width}px`,
    top: `${above ? b.top - 4 : b.top + 4}px`,
    transform: above ? 'translate(-100%, -100%)' : 'translateX(-100%)',
  }
})
</script>

<template>
  <div class="sel-overlay">
    <div v-if="box && !dragType" class="sel-toolbar" :style="style">
      <button
        type="button"
        class="sel-toolbar__btn"
        title="Move up"
        :disabled="!canMoveUp"
        @click="moveUp"
      >
        ↑
      </button>
      <button
        type="button"
        class="sel-toolbar__btn"
        title="Move down"
        :disabled="!canMoveDown"
        @click="moveDown"
      >
        ↓
      </button>
      <button type="button" class="sel-toolbar__btn" title="Duplicate" @click="duplicate">
        ⧉
      </button>
      <button
        v-if="canDelete"
        type="button"
        class="sel-toolbar__btn sel-toolbar__btn--danger"
        title="Delete"
        @click="remove"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.sel-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 15;
}

.sel-toolbar {
  position: absolute;
  display: flex;
  gap: 2px;
  padding: 2px;
  background: $color-panel;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  box-shadow: $shadow-sm;
  pointer-events: auto;

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: $color-text;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: $color-bg;
      color: $color-accent;
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &--danger:hover:not(:disabled) {
      color: $color-danger;
    }
  }
}
</style>
