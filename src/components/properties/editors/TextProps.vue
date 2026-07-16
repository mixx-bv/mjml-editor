<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../../stores/editor'
import { useUiStore } from '../../../stores/ui'
import AttrField from '../fields/AttrField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'
import BoxField from '../fields/BoxField.vue'
import VariableMenu from '../../app/VariableMenu.vue'
import { TEXT_ALIGN_OPTIONS, TEXT_WEIGHT_OPTIONS, FONT_FAMILY_OPTIONS } from '../fieldOptions'

const store = useEditorStore()
const ui = useUiStore()

// Variable insertion into body text needs a live caret, so it's offered only
// while this text node's inline editor is actually open.
const isEditing = computed(() => ui.editingNodeId != null && ui.editingNodeId === store.selectedId)
</script>

<template>
  <div>
    <div v-if="ui.variables.length" class="text-vars">
      <template v-if="isEditing">
        <span class="text-vars__label">Personalization</span>
        <VariableMenu :variables="ui.variables" @insert="ui.insertVariable" />
      </template>
      <p v-else class="text-vars__hint">Double-click the text to insert a variable.</p>
    </div>
    <AttrField
      attr-key="font-family"
      label="Font family"
      type="combobox"
      :options="FONT_FAMILY_OPTIONS"
      placeholder="Arial, sans-serif"
    />
    <NumberUnitField
      attr-key="font-size"
      label="Font size"
      :units="['px', 'em', 'rem']"
    />
    <AttrField attr-key="color" label="Color" type="color" />
    <AttrField
      attr-key="align"
      label="Align"
      type="select"
      :options="TEXT_ALIGN_OPTIONS"
    />
    <AttrField
      attr-key="font-weight"
      label="Weight"
      type="select"
      :options="TEXT_WEIGHT_OPTIONS"
    />
    <NumberUnitField
      attr-key="line-height"
      label="Line height"
      :units="['', 'px', '%', 'em']"
      :step="0.1"
    />
    <BoxField attr-key="padding" label="Padding" />
  </div>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables' as *;

.text-vars {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid $color-border;

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: $color-muted;
  }

  &__hint {
    margin: 0;
    font-size: 11px;
    color: $color-muted;
  }
}
</style>
