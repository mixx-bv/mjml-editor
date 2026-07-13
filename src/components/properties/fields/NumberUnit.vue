<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    units?: string[]
    min?: number
    max?: number
    step?: number
    placeholder?: string
  }>(),
  { units: () => ['px', '%', 'em', 'rem'], step: 1 },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'focus'): void
}>()

const parsed = computed(() => {
  const v = (props.modelValue ?? '').trim()
  if (!v) return { num: '', unit: props.units[0] }
  const m = v.match(/^(-?\d*\.?\d*)\s*([a-z%]*)$/i)
  if (!m) return { num: v, unit: '' }
  const unit = m[2] || props.units[0]
  return { num: m[1], unit }
})

function emitValue(num: string, unit: string) {
  const n = num.trim()
  if (!n) {
    emit('update:modelValue', '')
    return
  }
  emit('update:modelValue', unit ? `${n}${unit}` : n)
}

function onNumInput(e: Event) {
  emitValue((e.target as HTMLInputElement).value, parsed.value.unit)
}

function onUnitChange(e: Event) {
  emitValue(parsed.value.num, (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="nu">
    <input
      type="number"
      :value="parsed.num"
      :min="min"
      :max="max"
      :step="step"
      :placeholder="placeholder"
      class="nu__num"
      @input="onNumInput"
      @focus="emit('focus')"
    />
    <select :value="parsed.unit" class="nu__unit" @change="onUnitChange" @focus="emit('focus')">
      <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
    </select>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;

// Composite control (number + unit) with its own parse logic, so it shares the
// form-control look via the control-base mixin rather than wrapping AppInput.
.nu {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px;

  &__num {
    @include control-base;

    /* Hide default number spinners for a cleaner look */
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    -moz-appearance: textfield;
  }

  &__unit {
    @include control-base;
    padding: 6px 6px;
    color: $color-muted;
    min-width: 52px;
  }
}
</style>
