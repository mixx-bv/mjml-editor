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
import { compileMjml } from './utils/compileMjml'
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
    if (prev === undefined || mjml !== prev) store.loadMjml(mjml)
  },
  { immediate: true },
)

// Debounce the host change-event so a burst of keystrokes collapses into one
// emit (and one JSON serialization) instead of firing per character (M8). The
// payload carries the compiled email `html` too, so a host (e.g. a Filament
// field) can persist/send it without re-bundling mjml-browser itself.
let changeTimer: number | undefined
let changeSeq = 0
let lastHtml = ''
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
      // Keep the last good html when a mid-edit source is briefly uncompilable,
      // so a transient error never clobbers a valid stored body (mirrors
      // useMjmlCompiler.ts:19).
      if (html) lastHtml = html
      emit('change', { mjml, html: lastHtml, json })
    }, 250)
  },
)
</script>

<template>
  <div class="app">
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
