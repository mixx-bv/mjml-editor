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

const props = withDefaults(
  defineProps<{
    initialMjml?: string
    mediaLibrary?: MediaAsset[] | string
    sendTestUrl?: string
  }>(),
  {
    initialMjml: '',
    mediaLibrary: () => [],
    sendTestUrl: '',
  },
)

const emit = defineEmits<{
  change: [payload: { mjml: string; json: MjmlJsonDocument }]
}>()

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
// emit (and one JSON serialization) instead of firing per character (M8).
let changeTimer: number | undefined
watch(
  () => store.mjmlString,
  (mjml) => {
    window.clearTimeout(changeTimer)
    changeTimer = window.setTimeout(() => {
      emit('change', { mjml, json: store.mjmlJson })
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
