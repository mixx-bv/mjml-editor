<script setup lang="ts">
// Label + control wrapper. `variant='caps'` is the uppercase 11px label used across
// the properties panel; `variant='plain'` is the sentence-case bold label used in
// the settings modal. The control goes in the default slot; pass richer label markup
// (e.g. an <em> hint) through the named `label` slot instead of the `label` prop.
withDefaults(
  defineProps<{ label?: string; variant?: 'caps' | 'plain' }>(),
  { variant: 'caps' },
)
</script>

<template>
  <label class="app-field" :class="`app-field--${variant}`">
    <span v-if="label || $slots.label" class="app-field__label">
      <slot name="label">{{ label }}</slot>
    </span>
    <slot />
  </label>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.app-field {
  display: grid;
  gap: 4px;

  &--caps {
    margin-bottom: 10px;

    .app-field__label {
      @include field-label;
    }
  }

  &--plain {
    gap: 6px;

    .app-field__label {
      font-size: 12px;
      color: $color-text;
      font-weight: 600;

      :deep(em) {
        font-style: normal;
        font-weight: 400;
        color: $color-muted;
      }
    }
  }
}
</style>
