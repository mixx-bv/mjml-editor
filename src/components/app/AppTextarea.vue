<script setup lang="ts">
// Multi-line form control. Shares the control-base look with AppInput/AppSelect.
withDefaults(
  defineProps<{ modelValue: string; placeholder?: string; rows?: number }>(),
  { rows: 3 },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    class="app-textarea"
    :value="modelValue"
    :placeholder="placeholder"
    :rows="rows"
    @input="onInput"
  />
</template>

<style lang="scss" scoped>
@use '../../styles/mixins' as *;

.app-textarea {
  @include control-base;
  resize: vertical;
}
</style>
