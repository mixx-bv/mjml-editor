<script setup lang="ts">
import { computed } from 'vue'
import NumberUnit from './NumberUnit.vue'
import { useEditorStore } from '../../stores/editor'

const props = defineProps<{
  nodeId: string
  attrKey: string
  label: string
  units?: string[]
  min?: number
  max?: number
  step?: number
  placeholder?: string
}>()

const store = useEditorStore()

const value = computed({
  get: () => store.findNode(props.nodeId)?.node.attrs[props.attrKey] ?? '',
  set: (v: string) => store.updateAttr(props.nodeId, props.attrKey, v),
})
</script>

<template>
  <label class="nu-field">
    <span class="nu-field__label">{{ label }}</span>
    <NumberUnit
      v-model="value"
      :units="units"
      :min="min"
      :max="max"
      :step="step"
      :placeholder="placeholder"
      @focus="store.beginEdit()"
    />
  </label>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.nu-field {
  display: grid;
  gap: 4px;
  margin-bottom: 10px;

  &__label {
    font-size: 11px;
    color: $color-muted;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
}
</style>
