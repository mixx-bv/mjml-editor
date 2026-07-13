<script setup lang="ts">
// Dropdown form control. The <option>s are passed in via the default slot so each
// caller keeps its own option list (including any placeholder option).
defineProps<{ modelValue: string }>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <select class="app-select" :value="modelValue" @change="onChange">
    <slot />
  </select>
</template>

<style lang="scss" scoped>
@use '../../styles/mixins' as *;

.app-select {
  @include control-base;
}
</style>
