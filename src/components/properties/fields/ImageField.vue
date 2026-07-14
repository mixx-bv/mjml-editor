<script setup lang="ts">
import { useEditorStore } from '../../../stores/editor'
import { useUiStore } from '../../../stores/ui'
import { useNodeAttr } from '../../../composables/useNodeAttr'
import AppField from '../../app/AppField.vue'
import AppInput from '../../app/AppInput.vue'
import AppButton from '../../app/AppButton.vue'

const props = defineProps<{
  attrKey: string
  label: string
}>()

const store = useEditorStore()
const ui = useUiStore()
const { value, onFocus } = useNodeAttr(() => props.attrKey)

async function browse() {
  store.beginEdit()
  const url = await ui.openPicker()
  if (url) value.value = url
}
</script>

<template>
  <AppField :label="label">
    <div class="image-field__preview">
      <img v-if="value" :src="value" alt="" />
      <div v-else class="image-field__placeholder">No image</div>
    </div>
    <div class="image-field__row">
      <AppInput v-model="value" type="url" placeholder="https://…" @focus="onFocus" />
      <AppButton @click="browse">Browse</AppButton>
    </div>
  </AppField>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables' as *;

.image-field {
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
}
</style>
