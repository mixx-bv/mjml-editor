<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editor'

const props = defineProps<{
  nodeId: string
  attrKey: string
  label: string
  type?: 'text' | 'color' | 'number' | 'url' | 'select'
  placeholder?: string
  options?: { value: string; label: string }[]
}>()

const store = useEditorStore()

const value = computed({
  get: () => {
    const node = store.findNode(props.nodeId)?.node
    return node?.attrs[props.attrKey] ?? ''
  },
  set: (v: string) => store.updateAttr(props.nodeId, props.attrKey, v),
})

function onFocus() {
  store.beginEdit()
}
</script>

<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>
    <select v-if="type === 'select'" v-model="value" class="field__input" @focus="onFocus">
      <option value="">—</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <div v-else-if="type === 'color'" class="field__color">
      <input type="color" :value="value || '#000000'" @input="value = ($event.target as HTMLInputElement).value" @focus="onFocus" />
      <input type="text" v-model="value" :placeholder="placeholder" class="field__input" @focus="onFocus" />
    </div>
    <input
      v-else
      :type="type || 'text'"
      v-model="value"
      :placeholder="placeholder"
      class="field__input"
      @focus="onFocus"
    />
  </label>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.field {
  display: grid;
  gap: 4px;
  margin-bottom: 10px;

  &__label {
    font-size: 11px;
    color: $color-muted;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  &__input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    background: $color-panel;
    color: $color-text;

    &:focus {
      outline: 2px solid $color-accent-soft;
      border-color: $color-accent;
    }
  }

  &__color {
    display: grid;
    grid-template-columns: 32px 1fr;
    gap: 6px;

    input[type='color'] {
      width: 32px;
      height: 30px;
      padding: 0;
      border: 1px solid $color-border;
      border-radius: $radius-sm;
      background: $color-panel;
      cursor: pointer;
    }
  }
}
</style>
