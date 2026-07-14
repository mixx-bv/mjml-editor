<script setup lang="ts">
import NumberUnit from './NumberUnit.vue'
import AppField from '../../app/AppField.vue'
import { useNodeAttr } from '../../../composables/useNodeAttr'

const props = defineProps<{
  attrKey: string
  label: string
  units?: string[]
  min?: number
  max?: number
  step?: number
  placeholder?: string
}>()

const { value, onFocus } = useNodeAttr(() => props.attrKey)
</script>

<template>
  <AppField :label="label">
    <NumberUnit
      v-model="value"
      :units="units"
      :min="min"
      :max="max"
      :step="step"
      :placeholder="placeholder"
      @focus="onFocus"
    />
  </AppField>
</template>
