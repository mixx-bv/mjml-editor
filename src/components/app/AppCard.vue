<script setup lang="ts">
// Bordered surface (border + radius + background). `hoverable` adds the accent-border
// lift used by clickable items. `as` lets it render as a <button>, <li>, … so it can
// back both plain cards and interactive tiles; extra attributes fall through.
withDefaults(
  defineProps<{ as?: string; hoverable?: boolean }>(),
  { as: 'div', hoverable: false },
)
</script>

<template>
  <component :is="as" :type="as === 'button' ? 'button' : undefined" class="app-card" :class="{ 'app-card--hoverable': hoverable }">
    <slot />
  </component>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.app-card {
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: $color-panel;

  &--hoverable {
    transition: border-color 0.1s, box-shadow 0.1s;

    &:hover {
      border-color: $color-accent;
      box-shadow: $shadow-sm;
    }
  }
}
</style>
