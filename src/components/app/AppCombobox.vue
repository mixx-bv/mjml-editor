<script setup lang="ts">
// Searchable dropdown bound with v-model. Unlike AppSelect this stays a free text
// input — you can pick a curated option or type your own value — with a filtered
// suggestion list underneath. Click-outside handling mirrors SendTestPopover.vue.
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'focus'): void
}>()

const root = ref<HTMLElement | null>(null)
const open = ref(false)
const active = ref(-1)

// An empty query — or one that exactly matches a stored stack — shows the whole
// list so you can always switch; otherwise filter by substring on label or stack.
const filtered = computed(() => {
  const q = props.modelValue.trim().toLowerCase()
  const exact = props.options.some((o) => o.value.toLowerCase() === q)
  if (!q || exact) return props.options
  return props.options.filter(
    (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
  )
})

function onFocus() {
  open.value = true
  active.value = -1
  emit('focus')
}

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  open.value = true
  active.value = -1
}

function choose(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    open.value = false
    return
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (!open.value) {
      open.value = true
      return
    }
    const n = filtered.value.length
    if (!n) return
    const dir = e.key === 'ArrowDown' ? 1 : -1
    active.value = (active.value + dir + n) % n
  } else if (e.key === 'Enter' && open.value && active.value >= 0) {
    e.preventDefault()
    choose(filtered.value[active.value].value)
  }
}

function onDocumentClick(e: MouseEvent) {
  if (open.value && !root.value?.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div ref="root" class="app-combo">
    <input
      class="app-combo__input"
      :value="modelValue"
      :placeholder="placeholder"
      role="combobox"
      :aria-expanded="open"
      @focus="onFocus"
      @input="onInput"
      @keydown="onKeydown"
    />
    <ul v-if="open && filtered.length" class="app-combo__menu">
      <li
        v-for="(o, i) in filtered"
        :key="o.value"
        class="app-combo__option"
        :class="{ 'is-active': i === active, 'is-selected': o.value === modelValue }"
        :style="{ fontFamily: o.value }"
        @mousedown.prevent="choose(o.value)"
        @mouseenter="active = i"
      >
        {{ o.label }}
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.app-combo {
  position: relative;

  &__input {
    @include control-base;
  }

  // Absolute + shadowed menu, same treatment as the Send-test popover.
  &__menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 220px;
    overflow-y: auto;
    margin: 0;
    padding: 4px;
    list-style: none;
    background: $color-panel;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    z-index: 100;
  }

  &__option {
    padding: 6px 8px;
    border-radius: $radius-sm;
    font-size: 14px;
    color: $color-text;
    cursor: pointer;

    &.is-selected {
      color: $color-accent;
    }

    &.is-active {
      background: $color-bg;
    }
  }
}
</style>
