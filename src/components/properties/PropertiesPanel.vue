<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { useNodeActions } from '../../composables/useNodeActions'
import { NODE_LABELS } from '../../utils/nodeLabels'
import BodyProps from './editors/BodyProps.vue'
import ColumnProps from './editors/ColumnProps.vue'
import SectionProps from './editors/SectionProps.vue'
import TextProps from './editors/TextProps.vue'
import ImageProps from './editors/ImageProps.vue'
import ButtonProps from './editors/ButtonProps.vue'
import DividerProps from './editors/DividerProps.vue'
import SpacerProps from './editors/SpacerProps.vue'
import AppButton from '../app/AppButton.vue'

const store = useEditorStore()
const { canMoveUp, canMoveDown, deleteLabel, duplicate, moveUp, moveDown, remove } = useNodeActions()

const typeLabel = computed(() => (store.selected ? NODE_LABELS[store.selected.type] : ''))
</script>

<template>
  <aside class="props">
    <h2 class="props__title">Properties</h2>

    <div v-if="!store.selected" class="props__empty">
      Select a block in the canvas to edit its properties.
    </div>

    <template v-else>
      <nav v-if="store.ancestors.length > 1" class="props__crumbs" aria-label="Selection path">
        <template v-for="(node, i) in store.ancestors" :key="node.id">
          <button
            type="button"
            class="props__crumb"
            :class="{ 'is-current': node.id === store.selectedId }"
            @click="store.select(node.id)"
          >
            {{ NODE_LABELS[node.type] || node.type }}
          </button>
          <span v-if="i < store.ancestors.length - 1" class="props__crumb-sep">›</span>
        </template>
      </nav>

      <div class="props__header">
        <span class="props__type">{{ typeLabel }}</span>
        <div v-if="store.selected.type !== 'mj-body'" class="props__actions">
          <AppButton size="sm" title="Move up" :disabled="!canMoveUp" @click="moveUp">↑</AppButton>
          <AppButton size="sm" title="Move down" :disabled="!canMoveDown" @click="moveDown">↓</AppButton>
          <AppButton size="sm" title="Duplicate" @click="duplicate">⧉</AppButton>
          <AppButton variant="danger" size="sm" @click="remove">{{ deleteLabel }}</AppButton>
        </div>
      </div>

      <BodyProps v-if="store.selected.type === 'mj-body'" />
      <SectionProps v-else-if="store.selected.type === 'mj-section'" />
      <ColumnProps v-else-if="store.selected.type === 'mj-column'" />
      <TextProps v-else-if="store.selected.type === 'mj-text'" />
      <ImageProps v-else-if="store.selected.type === 'mj-image'" />
      <ButtonProps v-else-if="store.selected.type === 'mj-button'" />
      <DividerProps v-else-if="store.selected.type === 'mj-divider'" />
      <SpacerProps v-else-if="store.selected.type === 'mj-spacer'" />
    </template>
  </aside>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.props {
  background: $color-panel;
  border-left: 1px solid $color-border;
  padding: 16px;
  overflow-y: auto;

  &__title {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: $color-muted;
  }

  &__empty {
    color: $color-muted;
    font-size: 12px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid $color-border;
  }

  &__type {
    font-weight: 600;
  }

  &__actions {
    display: flex;
    gap: 4px;
  }

  &__crumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    margin-bottom: 12px;
    padding: 6px 8px;
    background: $color-bg;
    border-radius: $radius-sm;
    font-size: 11px;
  }

  &__crumb {
    border: 0;
    background: transparent;
    color: $color-muted;
    padding: 2px 6px;
    border-radius: 3px;
    cursor: pointer;

    &:hover {
      color: $color-text;
      background: $color-panel;
    }

    &.is-current {
      color: $color-accent;
      font-weight: 600;
    }
  }

  &__crumb-sep {
    color: $color-muted;
    padding: 0 2px;
  }
}
</style>
