<script setup lang="ts">
import { onMounted } from 'vue'
import TopBar from './components/TopBar.vue'
import BlocksPanel from './components/BlocksPanel.vue'
import EditorCanvas from './components/EditorCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import ImagePickerModal from './components/ImagePickerModal.vue'
import MjmlSource from './components/MjmlSource.vue'
import EmailSettings from './components/EmailSettings.vue'
import { useEditorStore } from './stores/editor'

const store = useEditorStore()

// Seed a demo library; replace via store.setMediaLibrary([...]) from host app.
onMounted(() => {
  if (store.mediaLibrary.length === 0) {
    store.setMediaLibrary([
      { url: 'https://placehold.co/600x400/2563eb/fff?text=Hero', label: 'Hero' },
      { url: 'https://placehold.co/600x400/16a34a/fff?text=Product', label: 'Product' },
      { url: 'https://placehold.co/600x400/f97316/fff?text=Banner', label: 'Banner' },
      { url: 'https://placehold.co/600x400/a855f7/fff?text=Lifestyle', label: 'Lifestyle' },
      { url: 'https://placehold.co/600x400/ef4444/fff?text=Sale', label: 'Sale' },
      { url: 'https://placehold.co/600x400/0ea5e9/fff?text=Announcement', label: 'Announcement' },
    ])
  }
})
</script>

<template>
  <div class="app">
    <TopBar />
    <div class="app__body">
      <BlocksPanel />
      <EditorCanvas />
      <PropertiesPanel />
    </div>
    <MjmlSource />
    <ImagePickerModal />
    <EmailSettings />
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
    display: grid;
    grid-template-columns: $panel-left-width 1fr $panel-right-width;
    min-height: 0;
  }
}
</style>
