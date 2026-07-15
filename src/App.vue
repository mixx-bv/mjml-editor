<script setup lang="ts">
import { computed, watch } from 'vue'
import TopBar from './components/topbar/TopBar.vue'
import BlocksPanel from './components/blocks/BlocksPanel.vue'
import EditorCanvas from './components/canvas/EditorCanvas.vue'
import PropertiesPanel from './components/properties/PropertiesPanel.vue'
import ImagePickerModal from './components/modals/ImagePickerModal.vue'
import SourceView from './components/source/SourceView.vue'
import EmailSettings from './components/modals/EmailSettings.vue'
import ExportModal from './components/modals/ExportModal.vue'
import { useEditorStore } from './stores/editor'
import { useUiStore, type MediaAsset } from './stores/ui'
import type { MjmlJsonDocument } from './utils/mjmlJson'
import { useDocumentCompiler } from './composables/useDocumentCompiler'
import { nextHostChange } from './utils/hostChange'
import { setPersistenceEnabled } from './utils/documentPersistence'

const props = withDefaults(
  defineProps<{
    initialMjml?: string
    mediaLibrary?: MediaAsset[] | string
    sendTestUrl?: string
    noPersist?: boolean
  }>(),
  {
    initialMjml: '',
    mediaLibrary: () => [],
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

// What the host already holds. Seeded with the initial (empty) template and
// updated on every host load / emit below, so a document identical to the host's
// is never echoed back — this is what stops merely opening a template (which
// re-serializes every locale body) from rewriting each one (review M1).
let lastSyncedMjml = store.mjmlString

const parsedMediaLibrary = computed<MediaAsset[]>(() => {
  const raw = props.mediaLibrary
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
})

watch(
  parsedMediaLibrary,
  (assets) => {
    ui.setMediaLibrary(assets)
  },
  { immediate: true },
)

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

// One shared, debounced compile feeds both the canvas preview and this emit, so
// a visual edit runs mjml2html once instead of twice (review P2). The payload
// carries the compiled email `html` too, so a host (e.g. a Filament field) can
// persist/send it without re-bundling mjml-browser itself.
const { snapshot } = useDocumentCompiler(store)
const compiledHtml = computed(() => snapshot.value?.editorHtml ?? '')
const compileError = computed(() => snapshot.value?.error ?? null)

watch(snapshot, (doc) => {
  const change = nextHostChange(doc, lastSyncedMjml)
  if (!change) return
  lastSyncedMjml = change.mjml
  emit('change', change)
})
</script>

<template>
  <div class="app">
    <TopBar />
    <div class="app__body" :class="`app__body--${ui.viewMode}`">
      <template v-if="ui.viewMode === 'visual'">
        <BlocksPanel />
        <EditorCanvas :compiled-html="compiledHtml" :compile-error="compileError" />
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
