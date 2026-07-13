<script setup lang="ts">
// Segmented button group bound with v-model. `variant='pill'` is the toolbar toggle
// (grey track, active button becomes a raised pill); `variant='tabs'` is the
// underline tab row.
withDefaults(
  defineProps<{
    modelValue: string
    options: { value: string; label: string }[]
    variant?: 'pill' | 'tabs'
  }>(),
  { variant: 'pill' },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <div class="app-seg" :class="`app-seg--${variant}`">
    <button
      v-for="o in options"
      :key="o.value"
      class="app-seg__btn"
      :class="{ 'is-active': modelValue === o.value }"
      @click="emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.app-seg {
  display: flex;

  &__btn {
    border: 0;
    background: transparent;
    font-weight: 600;
    font-size: 12px;
    color: $color-muted;
  }

  // Toolbar toggle: grey track, active button becomes a raised pill.
  &--pill {
    gap: 4px;
    background: $color-bg;
    padding: 3px;
    border-radius: $radius-md;

    .app-seg__btn {
      padding: 5px 12px;
      border-radius: $radius-sm;

      &.is-active {
        background: $color-panel;
        color: $color-text;
        box-shadow: $shadow-sm;
      }
    }
  }

  // Underline tabs.
  &--tabs {
    gap: 4px;
    border-bottom: 1px solid $color-border;

    .app-seg__btn {
      padding: 8px 14px;
      margin-bottom: -1px;
      border-bottom: 2px solid transparent;
      letter-spacing: 0.4px;

      &.is-active {
        color: $color-accent;
        border-bottom-color: $color-accent;
      }
    }
  }
}
</style>
