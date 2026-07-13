<script setup lang="ts">
import { useEditorStore } from '../../stores/editor'
import { useUiStore, type Device, type ViewMode } from '../../stores/ui'
import SendTestPopover from './SendTestPopover.vue'
import AppSegmented from '../app/AppSegmented.vue'
import AppButton from '../app/AppButton.vue'

const store = useEditorStore()
const ui = useUiStore()

const devices: { value: Device; label: string }[] = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'mobile', label: 'Mobile' },
]

const views: { value: ViewMode; label: string }[] = [
  { value: 'visual', label: 'Visual' },
  { value: 'source', label: 'Source' },
]
</script>

<template>
  <header class="topbar">
    <div class="topbar__brand">MJML Editor</div>

    <AppSegmented
      class="topbar__devices"
      :model-value="ui.device"
      :options="devices"
      @update:model-value="(v) => (ui.device = v as Device)"
    />

    <div class="topbar__actions">
      <AppButton :disabled="!store.canUndo" @click="store.undo()">Undo</AppButton>
      <AppButton :disabled="!store.canRedo" @click="store.redo()">Redo</AppButton>
      <AppButton @click="ui.settingsOpen = true">Settings</AppButton>
      <AppButton @click="ui.exportOpen = true">Export</AppButton>

      <SendTestPopover />

      <AppSegmented
        :model-value="ui.viewMode"
        :options="views"
        @update:model-value="(v) => (ui.viewMode = v as ViewMode)"
      />
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.topbar {
  height: $topbar-height;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: $color-panel;
  border-bottom: 1px solid $color-border;
  gap: 16px;

  &__brand {
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  &__devices {
    margin-left: auto;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
