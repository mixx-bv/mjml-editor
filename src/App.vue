<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import TopBar from './components/topbar/TopBar.vue'
import BlocksPanel from './components/blocks/BlocksPanel.vue'
import EditorCanvas from './components/canvas/EditorCanvas.vue'
import PropertiesPanel from './components/properties/PropertiesPanel.vue'
import ImagePickerModal from './components/modals/ImagePickerModal.vue'
import SourceView from './components/source/SourceView.vue'
import EmailSettings from './components/modals/EmailSettings.vue'
import ExportModal from './components/modals/ExportModal.vue'
import { useEditorStore } from './stores/editor'
import { useUiStore, type MediaAsset, type VariableItem } from './stores/ui'
import type { MjmlJsonDocument } from './utils/mjmlJson'
import { compileMjml } from './utils/compileMjml'
import { shouldEmitChange } from './utils/hostChange'
import { setPersistenceEnabled } from './utils/documentPersistence'
import { createShortcutHandler } from './composables/useKeyboardShortcuts'

const props = withDefaults(
  defineProps<{
    initialMjml?: string
    mediaLibrary?: MediaAsset[] | string
    variables?: VariableItem[] | string
    sendTestUrl?: string
    noPersist?: boolean
  }>(),
  {
    initialMjml: '',
    mediaLibrary: () => [],
    variables: () => [],
    sendTestUrl: '',
    noPersist: false,
  },
)

const emit = defineEmits<{
  change: [payload: { mjml: string; html: string; json: MjmlJsonDocument }]
}>()

// Must run before useEditorStore(): the store loads persisted state at init, so
// an embedding host that owns the data opts out (via `no-persist`) here first.
setPersistenceEnabled(!props.noPersist)

const store = useEditorStore()
const ui = useUiStore()

// Shortcuts bound to the editor root (not window) so keystrokes elsewhere on the
// host page are never hijacked. The canvas iframe binds the same handler itself
// (EditorCanvas), covering the case where a canvas click has focused the iframe.
const rootRef = ref<HTMLElement | null>(null)
const onShortcut = createShortcutHandler()
onMounted(() => rootRef.value?.addEventListener('keydown', onShortcut))
onBeforeUnmount(() => rootRef.value?.removeEventListener('keydown', onShortcut))

// What the host already holds. Seeded with the initial (empty) template and
// updated on every host load / emit below, so a document identical to the host's
// is never echoed back — this is what stops merely opening a template (which
// re-serializes every locale body) from rewriting each one (review M1).
let lastSyncedMjml = store.mjmlString

// Complex props arrive as objects (Vue property) or JSON strings (HTML attribute).
// Normalise both to an array; malformed JSON degrades to empty rather than throwing.
function parseArrayProp<T>(raw: T[] | string): T[] {
  if (typeof raw === 'string') {
    if (!raw.trim()) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return raw ?? []
}

const parsedMediaLibrary = computed<MediaAsset[]>(() => parseArrayProp(props.mediaLibrary))
const parsedVariables = computed<VariableItem[]>(() => parseArrayProp(props.variables))

watch(parsedMediaLibrary, (assets) => ui.setMediaLibrary(assets), { immediate: true })
watch(parsedVariables, (items) => ui.setVariables(items), { immediate: true })

watch(
  () => props.sendTestUrl,
  (url) => {
    if (url) ui.setSendTestUrl(url)
  },
  { immediate: true },
)

watch(
  () => props.initialMjml,
  (mjml, prev) => {
    if (!mjml) return
    // Apply on first mount, or whenever the host pushes a different value.
    if (prev === undefined || mjml !== prev) {
      store.loadMjml(mjml)
      // The host already holds this content; record it so the load-triggered
      // compile below is recognised as a no-op and not written back (M1).
      lastSyncedMjml = store.mjmlString
    }
  },
  { immediate: true },
)

// Debounce the host change-event so a burst of keystrokes collapses into one
// emit (and one JSON serialization) instead of firing per character (M8). The
// payload carries the compiled email `html` too, so a host (e.g. a Filament
// field) can persist/send it without re-bundling mjml-browser itself.
let changeTimer: number | undefined
let changeSeq = 0
watch(
  () => store.mjmlString,
  (mjml) => {
    window.clearTimeout(changeTimer)
    changeTimer = window.setTimeout(async () => {
      // Snapshot json alongside mjml before the async compile so all three
      // fields describe the same document, then guard against a slow compile
      // landing after a newer one (same seq idiom as useMjmlCompiler.ts:11).
      const json = store.mjmlJson
      const mine = ++changeSeq
      const { html } = await compileMjml(mjml)
      if (mine !== changeSeq) return
      // Skip when there is nothing new for the host: a transient uncompilable
      // source (L1) or a document the host already holds — the latter stops
      // merely opening a template from writing its re-serialized body back (M1).
      if (!shouldEmitChange(mjml, html, lastSyncedMjml)) return
      lastSyncedMjml = mjml
      emit('change', { mjml, html, json })
    }, 250)
  },
)
</script>

<template>
  <div class="app" ref="rootRef">
    <TopBar />
    <div class="app__body" :class="`app__body--${ui.viewMode}`">
      <template v-if="ui.viewMode === 'visual'">
        <BlocksPanel />
        <EditorCanvas />
        <PropertiesPanel />
      </template>
      <SourceView v-else />
    </div>
    <ImagePickerModal />
    <EmailSettings />
    <ExportModal :open="ui.exportOpen" @close="ui.exportOpen = false" />
  </div>
</template>

<style lang="scss">
@use './styles/variables' as *;

.app {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__body {
    flex: 1;
    min-height: 0;

    &--visual {
      display: grid;
      grid-template-columns: $panel-left-width 1fr $panel-right-width;
    }

    &--source {
      display: block;
    }
  }
}
</style>
