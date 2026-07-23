<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../../stores/editor'
import { useUiStore } from '../../../stores/ui'
import AppField from '../../app/AppField.vue'
import AppTextarea from '../../app/AppTextarea.vue'
import AttrField from '../fields/AttrField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'
import BoxField from '../fields/BoxField.vue'
import VariableMenu from '../../app/VariableMenu.vue'
import { useNodeContent } from '../../../composables/useNodeAttr'
import { sanitizeMjTextHtml } from '../../../utils/sanitize'
import { listCardButtons } from '../../../utils/cardButtons'
import { TEXT_ALIGN_OPTIONS, TEXT_WEIGHT_OPTIONS, FONT_FAMILY_OPTIONS } from '../fieldOptions'

const store = useEditorStore()
const ui = useUiStore()

// mj-text content is inline HTML that often nests a full <table> card layout the
// canvas WYSIWYG editor deliberately won't touch (bridgeSrcdoc table guard). Expose
// the raw content here too — same pattern as RawProps for mj-raw — so those blocks
// stay editable. Sanitize on blur to hold the same mj-text boundary as import
// (mjmlJson leafContent) and inline edit (useCanvasBridge), without fighting typing.
const { value: content, onFocus } = useNodeContent()
function sanitizeOnBlur() {
  // Idempotent: import already stores sanitized mj-text, so opening + leaving the
  // field untouched writes nothing (no spurious recompile / host change-event).
  const clean = sanitizeMjTextHtml(content.value)
  if (clean !== content.value) content.value = clean
}

// Variable insertion into body text needs a live caret, so it's offered only
// while this text node's inline editor is actually open.
const isEditing = computed(() => ui.editingNodeId != null && ui.editingNodeId === store.selectedId)

// Imported templates often pack a whole card (heading, paragraphs, buttons) into
// this one mj-text as raw HTML. The block is kept whole so its exact styling stays
// 1:1, but each button inside it can still be removed individually — list them so a
// single button can be deleted without touching the rest.
const cardButtons = computed(() => listCardButtons(content.value))
function removeButton(index: number) {
  if (store.selectedId) store.removeCardButton(store.selectedId, index)
}
</script>

<template>
  <div>
    <div v-if="cardButtons.length" class="card-buttons">
      <span class="card-buttons__label">Buttons in this card</span>
      <ul class="card-buttons__list">
        <li v-for="(label, i) in cardButtons" :key="i" class="card-buttons__item">
          <span class="card-buttons__name">{{ label }}</span>
          <button
            type="button"
            class="card-buttons__del"
            title="Remove this button"
            @click="removeButton(i)"
          >
            ✕
          </button>
        </li>
      </ul>
    </div>
    <AppField label="Content (HTML)">
      <AppTextarea v-model="content" :rows="8" @focus="onFocus" @blur="sanitizeOnBlur" />
    </AppField>
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

.card-buttons {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid $color-border;

  &__label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    color: $color-muted;
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 8px;
    border: 1px solid $color-border;
    border-radius: $radius-sm;

    & + & {
      margin-top: 4px;
    }
  }

  &__name {
    font-size: 13px;
    color: $color-text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__del {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: $color-muted;
    font-size: 12px;
    line-height: 1;
    cursor: pointer;

    &:hover {
      background: $color-bg;
      color: $color-danger;
    }
  }
}

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
