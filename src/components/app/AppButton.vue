<script setup lang="ts">
// Reusable button. `variant` picks the colour treatment, `size` the padding.
// Native attributes (type, disabled, @click) fall through to the <button>.
withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'danger'
    size?: 'sm' | 'md'
  }>(),
  { variant: 'default', size: 'md' },
)
</script>

<template>
  <button type="button" class="app-btn" :class="[`app-btn--${variant}`, `app-btn--${size}`]">
    <slot />
  </button>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  color: $color-text;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--md {
    padding: 6px 12px;
  }

  &--sm {
    padding: 4px 10px;
    font-size: 12px;
  }

  &--default {
    border-color: $color-border;
    background: $color-panel;

    &:hover:not(:disabled) {
      border-color: $color-accent;
      color: $color-accent;
    }
  }

  &--primary {
    background: $color-accent;
    border-color: $color-accent;
    color: #fff;

    &:hover:not(:disabled) {
      filter: brightness(0.96);
    }
  }

  &--danger {
    background: $color-panel;
    border-color: $color-border;
    color: $color-danger;

    &:hover:not(:disabled) {
      border-color: $color-danger;
    }
  }
}
</style>
