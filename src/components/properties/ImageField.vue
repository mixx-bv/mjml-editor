<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editor'

const props = defineProps<{
  nodeId: string
  attrKey: string
  label: string
}>()

const store = useEditorStore()

const value = computed({
  get: () => store.findNode(props.nodeId)?.node.attrs[props.attrKey] ?? '',
  set: (v: string) => store.updateAttr(props.nodeId, props.attrKey, v),
})

async function browse() {
  store.beginEdit()
  const url = await store.openPicker()
  if (url) value.value = url
}
</script>

<template>
  <div class="image-field">
    <span class="image-field__label">{{ label }}</span>
    <div class="image-field__preview">
      <img v-if="value" :src="value" alt="" />
      <div v-else class="image-field__placeholder">No image</div>
    </div>
    <div class="image-field__row">
      <input
        v-model="value"
        type="url"
        placeholder="https://…"
        class="image-field__input"
        @focus="store.beginEdit()"
      />
      <button class="image-field__btn" @click="browse">Browse</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.image-field {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;

  &__label {
    font-size: 11px;
    color: $color-muted;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  &__preview {
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    background: $color-bg;
    aspect-ratio: 3 / 2;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  &__placeholder {
    color: $color-muted;
    font-size: 12px;
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px;
  }

  &__input {
    padding: 6px 8px;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    background: $color-panel;

    &:focus {
      outline: 2px solid $color-accent-soft;
      border-color: $color-accent;
    }
  }

  &__btn {
    padding: 6px 12px;
    border: 1px solid $color-border;
    background: $color-panel;
    border-radius: $radius-sm;

    &:hover {
      border-color: $color-accent;
      color: $color-accent;
    }
  }
}
</style>
