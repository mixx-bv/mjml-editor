<script setup lang="ts">
import { useDnd, type DragBlock } from '../../composables/useDnd'
import { createNode, createLayoutSection } from '../../utils/nodeFactory'
import AppCard from '../app/AppCard.vue'

const { startDrag, endDrag } = useDnd()

const layouts: DragBlock[] = [
  { id: 'layout-1', label: '1 column', nodeType: 'mj-section', create: () => createLayoutSection(1) },
  { id: 'layout-2', label: '2 columns', nodeType: 'mj-section', create: () => createLayoutSection(2) },
  { id: 'layout-3', label: '3 columns', nodeType: 'mj-section', create: () => createLayoutSection(3) },
]

const contents: DragBlock[] = [
  { id: 'text', label: 'Text', nodeType: 'mj-text', create: () => createNode('mj-text') },
  { id: 'image', label: 'Image', nodeType: 'mj-image', create: () => createNode('mj-image') },
  { id: 'button', label: 'Button', nodeType: 'mj-button', create: () => createNode('mj-button') },
  { id: 'divider', label: 'Divider', nodeType: 'mj-divider', create: () => createNode('mj-divider') },
  { id: 'spacer', label: 'Spacer', nodeType: 'mj-spacer', create: () => createNode('mj-spacer') },
]

function onDragStart(e: DragEvent, block: DragBlock) {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'copy'
  e.dataTransfer.setData('application/x-mjml-block', block.id)
  startDrag(block)
}

function onDragEnd() {
  endDrag()
}
</script>

<template>
  <aside class="blocks">
    <h2 class="blocks__title">Layouts</h2>
    <p class="blocks__help">Drag a layout into the canvas.</p>
    <ul class="blocks__list">
      <AppCard
        v-for="b in layouts"
        :key="b.id"
        as="li"
        hoverable
        class="blocks__item blocks__item--layout"
        draggable="true"
        @dragstart="onDragStart($event, b)"
        @dragend="onDragEnd"
      >
        <div class="blocks__item-preview" :class="`blocks__item-preview--${b.id}`">
          <span v-for="n in Number(b.id.split('-')[1])" :key="n" class="blocks__preview-col" />
        </div>
        <div class="blocks__item-label">{{ b.label }}</div>
      </AppCard>
    </ul>

    <h2 class="blocks__title">Content</h2>
    <ul class="blocks__list">
      <AppCard
        v-for="b in contents"
        :key="b.id"
        as="li"
        hoverable
        class="blocks__item"
        draggable="true"
        @dragstart="onDragStart($event, b)"
        @dragend="onDragEnd"
      >
        <div class="blocks__item-label">{{ b.label }}</div>
      </AppCard>
    </ul>
  </aside>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.blocks {
  background: $color-panel;
  border-right: 1px solid $color-border;
  padding: 16px;
  overflow-y: auto;

  &__title {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: $color-muted;

    &:not(:first-child) {
      margin-top: 20px;
    }
  }

  &__help {
    margin: 0 0 12px;
    font-size: 12px;
    color: $color-muted;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
  }

  &__item {
    padding: 10px 12px;
    cursor: grab;
    user-select: none;

    &:active {
      cursor: grabbing;
    }
  }

  &__item--layout {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
  }

  &__item-preview {
    flex: 0 0 56px;
    height: 32px;
    display: flex;
    gap: 3px;
    padding: 3px;
    background: #f1f5f9;
    border-radius: 3px;
  }

  &__preview-col {
    flex: 1;
    background: #cbd5e1;
    border-radius: 2px;
  }

  &__item-label {
    font-weight: 600;
  }
}
</style>
