<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import AppField from '../../app/AppField.vue'
import AppInput from '../../app/AppInput.vue'
import AppSelect from '../../app/AppSelect.vue'
import AppCombobox from '../../app/AppCombobox.vue'
import VariableMenu from '../../app/VariableMenu.vue'
import { useUiStore } from '../../../stores/ui'
import { insertAtCaret } from '../../../utils/caretInsert'
import { useNodeAttr, useNodeContent } from '../../../composables/useNodeAttr'

const props = withDefaults(
  defineProps<{
    attrKey?: string
    label: string
    type?: 'text' | 'color' | 'number' | 'url' | 'select' | 'combobox'
    placeholder?: string
    options?: { value: string; label: string }[]
    // 'attr' binds to node.attrs[attrKey]; 'content' binds to a leaf's text.
    bind?: 'attr' | 'content'
  }>(),
  { bind: 'attr' },
)

const ui = useUiStore()

const { value, onFocus } =
  props.bind === 'content' ? useNodeContent() : useNodeAttr(() => props.attrKey ?? '')

const inputRef = ref<InstanceType<typeof AppInput> | null>(null)

// Personalization tokens only make sense in free-text/URL fields, not in
// numeric/colour/select controls.
const allowVariables = computed(() => {
  const t = props.type ?? 'text'
  return t === 'text' || t === 'url'
})

function onColorInput(e: Event) {
  value.value = (e.target as HTMLInputElement).value
}

// Insert the token at the caret and restore the caret just after it. onFocus()
// first so the insertion lands as a single undo step.
function insertToken(token: string) {
  onFocus()
  const el = inputRef.value?.$el as HTMLInputElement | undefined
  const start = el && typeof el.selectionStart === 'number' ? el.selectionStart : null
  const { value: next, caret } = insertAtCaret(value.value ?? '', token, start, el?.selectionEnd ?? null)
  value.value = next
  if (el) nextTick(() => { el.focus(); el.setSelectionRange(caret, caret) })
}
</script>

<template>
  <AppField :label="label">
    <AppSelect v-if="type === 'select'" v-model="value" @focus="onFocus">
      <option value="">—</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </AppSelect>
    <AppCombobox
      v-else-if="type === 'combobox'"
      v-model="value"
      :options="options ?? []"
      :placeholder="placeholder"
      @focus="onFocus"
    />
    <div v-else-if="type === 'color'" class="attr-color">
      <input type="color" :value="value || '#000000'" @input="onColorInput" @focus="onFocus" />
      <AppInput v-model="value" :placeholder="placeholder" @focus="onFocus" />
    </div>
    <div v-else class="attr-input">
      <AppInput
        ref="inputRef"
        :type="type || 'text'"
        v-model="value"
        :placeholder="placeholder"
        @focus="onFocus"
      />
      <VariableMenu v-if="allowVariables" :variables="ui.variables" @insert="insertToken" />
    </div>
  </AppField>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables' as *;

.attr-input {
  display: flex;
  gap: 6px;
  align-items: center;

  :deep(.app-input) {
    flex: 1 1 auto;
    min-width: 0;
  }
}

.attr-color {
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
</style>
