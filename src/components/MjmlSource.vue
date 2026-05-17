<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '../stores/editor'

const store = useEditorStore()
const copied = ref(false)

function copy() {
  navigator.clipboard.writeText(store.mjmlString).then(() => {
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1200)
  })
}
</script>

<template>
  <section v-show="store.sourceVisible" class="source">
    <header class="source__header">
      <h2 class="source__title">MJML source</h2>
      <div class="source__actions">
        <button class="source__btn" @click="copy">{{ copied ? 'Copied' : 'Copy' }}</button>
        <button class="source__btn" @click="store.sourceVisible = false">Hide</button>
      </div>
    </header>
    <pre class="source__code"><code>{{ store.mjmlString }}</code></pre>
  </section>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.source {
  grid-column: 1 / -1;
  border-top: 1px solid $color-border;
  background: #0f172a;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 280px;
  min-height: 0;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: #1e293b;
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #94a3b8;
  }

  &__actions {
    display: flex;
    gap: 6px;
  }

  &__btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #e2e8f0;
    padding: 4px 10px;
    border-radius: $radius-sm;
    font-size: 12px;

    &:hover {
      border-color: rgba(255, 255, 255, 0.4);
    }
  }

  &__code {
    flex: 1;
    margin: 0;
    padding: 14px;
    overflow: auto;
    font-family: 'SF Mono', Menlo, Monaco, 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.55;
    white-space: pre;
    tab-size: 2;

    code {
      color: #cbd5e1;
    }
  }
}
</style>
