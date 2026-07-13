<script setup lang="ts">
import AppField from '../../app/AppField.vue'
import AppInput from '../../app/AppInput.vue'
import AppSelect from '../../app/AppSelect.vue'
import { useNodeAttr, useNodeContent } from '../../../composables/useNodeAttr'

const props = withDefaults(
  defineProps<{
    nodeId: string
    attrKey?: string
    label: string
    type?: 'text' | 'color' | 'number' | 'url' | 'select'
    placeholder?: string
    options?: { value: string; label: string }[]
    // 'attr' binds to node.attrs[attrKey]; 'content' binds to a leaf's text.
    bind?: 'attr' | 'content'
  }>(),
  { bind: 'attr' },
)

const { value, onFocus } =
  props.bind === 'content'
    ? useNodeContent(() => props.nodeId)
    : useNodeAttr(() => props.nodeId, () => props.attrKey ?? '')

function onColorInput(e: Event) {
  value.value = (e.target as HTMLInputElement).value
}
</script>

<template>
  <AppField :label="label">
    <AppSelect v-if="type === 'select'" v-model="value" @focus="onFocus">
      <option value="">—</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </AppSelect>
    <div v-else-if="type === 'color'" class="attr-color">
      <input type="color" :value="value || '#000000'" @input="onColorInput" @focus="onFocus" />
      <AppInput v-model="value" :placeholder="placeholder" @focus="onFocus" />
    </div>
    <AppInput
      v-else
      :type="type || 'text'"
      v-model="value"
      :placeholder="placeholder"
      @focus="onFocus"
    />
  </AppField>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables' as *;

.attr-color {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 6px;

  input[type='color'] {
    width: 32px;
    height: 30px;
    padding: 0;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    background: $color-panel;
    cursor: pointer;
  }
}
</style>
