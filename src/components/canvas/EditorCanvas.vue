<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { useUiStore } from '../../stores/ui'
import { useDnd } from '../../composables/useDnd'
import { useMjmlCompiler } from '../../composables/useMjmlCompiler'
import { useCanvasBridge } from '../../composables/useCanvasBridge'
import { BRIDGE_SRCDOC } from '../../utils/bridgeSrcdoc'
import DropOverlay from './DropOverlay.vue'

const store = useEditorStore()
const ui = useUiStore()
const { dragType, endDrag } = useDnd()
const iframeRef = ref<HTMLIFrameElement | null>(null)

const bodyWidth = computed(() => {
  const w = store.tree.attrs.width
  if (!w) return '600px'
  return /^\d+(\.\d+)?$/.test(w) ? `${w}px` : w
})

// The email never renders wider than its body width (MJML caps mj-body), so a
// device frame wider than the email only reveals the mj-body background as grey
// side gutters. Cap each device at the body width: the frame always hugs the
// email, and a device narrower than the email shows it shrunk-to-fit like a real
// client (mobile stacks below MJML's 480px breakpoint).
const deviceWidth = computed(() => {
  const bodyPx = parseFloat(bodyWidth.value) || 600
  switch (ui.device) {
    case 'mobile':
      return `${Math.min(375, bodyPx)}px`
    case 'tablet':
      return `${Math.min(768, bodyPx)}px`
    default:
      return bodyWidth.value
  }
})

// 250ms > a typical key interval, so a burst of edits in a property field
// coalesces into one mjml2html compile instead of one per character (P1).
const { compiledHtml, compileError } = useMjmlCompiler(computed(() => store.editorMjml), 250)
useCanvasBridge(iframeRef, store, compiledHtml, computed(() => !!dragType.value))

function onWindowDragEnd() {
  endDrag()
}
onMounted(() => window.addEventListener('dragend', onWindowDragEnd))
onBeforeUnmount(() => window.removeEventListener('dragend', onWindowDragEnd))

function onCanvasClick() {
  store.select(null)
}
</script>

<template>
  <main class="canvas" @click="onCanvasClick">
    <div
      class="canvas__frame-wrap"
      :style="{ maxWidth: deviceWidth }"
      @click.stop
    >
      <iframe
        ref="iframeRef"
        class="canvas__frame"
        :srcdoc="BRIDGE_SRCDOC"
        sandbox="allow-scripts allow-same-origin"
      />
      <DropOverlay :iframe-el="iframeRef" />
    </div>
    <div v-if="dragType" class="canvas__drag-hint">
      Dragging <strong>{{ dragType.replace('mj-', '') }}</strong> — drop on a highlighted line
    </div>
    <div v-if="compileError" class="canvas__error">
      <strong>MJML error</strong>
      <pre>{{ compileError }}</pre>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.canvas {
  position: relative;
  background: $color-bg;
  overflow: auto;
  padding: 24px;
  min-width: 0;

  &__frame-wrap {
    position: relative;
    margin: 0 auto;
    background: $color-panel;
    border-radius: $radius-md;
    box-shadow: $shadow-sm;
    transition: max-width 0.2s;
    min-height: 400px;
  }

  &__frame {
    width: 100%;
    height: calc(100vh - #{$topbar-height} - 48px);
    border: 0;
    border-radius: $radius-md;
    background: white;
    display: block;
  }

  &__drag-hint {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    background: $color-panel;
    border: 1px solid $color-accent;
    color: $color-accent;
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: $shadow-sm;
    z-index: 20;
    pointer-events: none;

    strong {
      text-transform: capitalize;
    }
  }

  &__error {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 16px;
    background: #fff1f2;
    border: 1px solid #fecaca;
    color: $color-danger;
    padding: 8px 12px;
    border-radius: $radius-md;
    font-size: 12px;

    pre {
      margin: 4px 0 0;
      white-space: pre-wrap;
    }
  }
}
</style>
