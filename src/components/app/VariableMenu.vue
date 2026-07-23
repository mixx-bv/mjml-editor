<script setup lang="ts">
// Dropdown that inserts a host-provided personalization token. Presentational:
// it takes the list and emits the chosen token, so it stays generic and reusable
// across property fields, the email-settings modal and the text editor. Renders
// nothing when the host supplied no variables.
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

defineProps<{
  variables: { label: string; value: string }[]
}>()

const emit = defineEmits<{ insert: [token: string] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const btn = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
// The dropdown is teleported to <body> so an ancestor with `overflow:auto` (the
// properties panel) can't clip it; these are its fixed viewport coords, kept
// right-aligned to the button and recomputed each time it opens.
const pos = ref({ top: 0, right: 0 })

async function toggle() {
  open.value = !open.value
  if (!open.value) return
  await nextTick()
  const r = btn.value?.getBoundingClientRect()
  if (r) pos.value = { top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) }
}

function pick(token: string) {
  emit('insert', token)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  const t = e.target as Node
  if (open.value && root.value && !root.value.contains(t) && !list.value?.contains(t)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div v-if="variables.length" ref="root" class="var-menu">
    <button
      ref="btn"
      type="button"
      class="var-menu__btn"
      title="Insert variable"
      aria-label="Insert variable"
      @click.stop="toggle"
    >
      {&nbsp;}
    </button>
    <Teleport to="body">
      <ul
        v-if="open"
        ref="list"
        class="var-menu__list"
        :style="{ top: pos.top + 'px', right: pos.right + 'px' }"
      >
        <li v-for="v in variables" :key="v.value">
          <button type="button" class="var-menu__item" @click="pick(v.value)">
            <span class="var-menu__label">{{ v.label }}</span>
            <code class="var-menu__token">{{ v.value }}</code>
          </button>
        </li>
      </ul>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.var-menu {
  position: relative;
  flex: 0 0 auto;

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    padding: 0 8px;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    background: $color-panel;
    color: $color-muted;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      border-color: $color-accent;
      color: $color-accent;
    }
  }

  &__list {
    position: fixed;
    z-index: 1100;
    margin: 0;
    padding: 4px;
    list-style: none;
    min-width: 180px;
    max-height: 240px;
    overflow-y: auto;
    background: $color-panel;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    box-shadow: $shadow-sm;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 1px;
    width: 100%;
    padding: 6px 8px;
    border: 0;
    border-radius: 3px;
    background: transparent;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: $color-bg;
    }
  }

  &__label {
    font-size: 13px;
    color: $color-text;
  }

  &__token {
    font-size: 11px;
    color: $color-muted;
  }
}
</style>
