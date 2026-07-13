<script setup lang="ts">
// Inline error notice: light-red banner used for compile/send errors.
</script>

<template>
  <div class="app-banner">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.app-banner {
  background: #fff1f2;
  border: 1px solid #fecaca;
  color: $color-danger;
  border-radius: $radius-sm;
  padding: 8px 12px;
  font-size: 12px;

  :deep(pre) {
    margin: 4px 0 0;
    white-space: pre-wrap;
  }
}
</style>
