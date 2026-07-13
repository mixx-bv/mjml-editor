<script setup lang="ts">
// Single-line form control. Shares the control-base look with AppSelect/AppTextarea.
// Extra attributes (@focus, min, max, step, …) fall through to the native <input>.
withDefaults(
  defineProps<{ modelValue: string; type?: string; placeholder?: string }>(),
  { type: 'text' },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    class="app-input"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    @input="onInput"
  />
</template>

<style lang="scss" scoped>
@use '../../styles/mixins' as *;

.app-input {
  @include control-base;
}
</style>
