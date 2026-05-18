<script setup lang="ts">
import { computed, watch } from 'vue'
import TopBar from './components/TopBar.vue'
import BlocksPanel from './components/BlocksPanel.vue'
import EditorCanvas from './components/EditorCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import ImagePickerModal from './components/ImagePickerModal.vue'
import SourceView from './components/SourceView.vue'
import EmailSettings from './components/EmailSettings.vue'
import ExportModal from './components/ExportModal.vue'
import { useEditorStore, type MediaAsset } from './stores/editor'
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
    store.setMediaLibrary(assets)
  },
  { immediate: true },
)

watch(
  () => props.sendTestUrl,
  (url) => {
    if (url) store.setSendTestUrl(url)
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

watch(
  () => store.mjmlString,
  (mjml) => {
    emit('change', { mjml, json: store.mjmlJson as MjmlJsonDocument })
  },
)
</script>

<template>
  <div class="app">
    <TopBar />
    <div class="app__body" :class="`app__body--${store.viewMode}`">
      <template v-if="store.viewMode === 'visual'">
        <BlocksPanel />
        <EditorCanvas />
        <PropertiesPanel />
      </template>
      <SourceView v-else />
    </div>
    <ImagePickerModal />
    <EmailSettings />
    <ExportModal :open="store.exportOpen" @close="store.exportOpen = false" />
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
