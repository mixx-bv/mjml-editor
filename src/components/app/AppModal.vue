<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

// Shared modal shell: overlay, centered panel, header with title + close button,
// backdrop-click and Escape to close. Body (and any footer) go in the default
// slot so each modal keeps its own inner layout.
const props = withDefaults(
  defineProps<{ open: boolean; title: string; width?: string }>(),
  { width: '540px' },
)
const emit = defineEmits<{ close: [] }>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="open" class="modal" role="dialog" aria-modal="true" @click.self="emit('close')">
    <div class="modal__panel" :style="{ width: `min(${width}, 100%)` }">
      <header class="modal__header">
        <h2 class="modal__title">{{ title }}</h2>
        <button type="button" class="modal__close" @click="emit('close')" aria-label="Close">×</button>
      </header>
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;

  &__panel {
    background: $color-panel;
    border-radius: $radius-md;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    max-height: calc(100vh - 48px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid $color-border;
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }

  &__close {
    border: 0;
    background: transparent;
    font-size: 22px;
    line-height: 1;
    color: $color-muted;
    padding: 0 4px;

    &:hover {
      color: $color-text;
    }
  }
}
</style>
