import { computed } from 'vue'
import { useEditorStore } from '../stores/editor'
import { isContainer } from '../types/mjml'
import { nodeLabel } from '../utils/nodeLabels'

/**
 * Node actions for the current selection — duplicate, move up/down, delete (with
 * a confirm for non-empty containers). Shared by the in-canvas SelectionToolbar,
 * the PropertiesPanel header and the keyboard shortcuts so the behaviour lives in
 * one place instead of being mirrored per surface.
 */
export function useNodeActions() {
  const store = useEditorStore()

  const canDelete = computed(() => !!store.selected && store.selected.type !== 'mj-body')

  const position = computed(() =>
    store.selectedId ? store.siblingInfo(store.selectedId) : null,
  )
  const canMoveUp = computed(() => !!position.value && position.value.index > 0)
  const canMoveDown = computed(
    () => !!position.value && position.value.index < position.value.count - 1,
  )

  // Mirrors the original PropertiesPanel label (item count for containers) so the
  // delete button and its confirm read identically wherever they appear.
  const deleteLabel = computed(() => {
    const sel = store.selected
    if (!sel) return 'Delete'
    const label = nodeLabel(sel)
    const count = isContainer(sel) ? sel.children.length : 0
    if (!count) return `Delete ${label}`
    return `Delete ${label} (${count} ${count === 1 ? 'item' : 'items'})`
  })

  function duplicate() {
    if (store.selectedId) store.duplicateNode(store.selectedId)
  }

  function moveUp() {
    if (canMoveUp.value && store.selectedId) store.moveNode(store.selectedId, 'up')
  }

  function moveDown() {
    if (canMoveDown.value && store.selectedId) store.moveNode(store.selectedId, 'down')
  }

  function remove() {
    const sel = store.selected
    if (!sel || sel.type === 'mj-body') return
    if (isContainer(sel) && sel.children.length > 0) {
      const ok = window.confirm(`${deleteLabel.value}?\n\nThis will also remove everything inside.`)
      if (!ok) return
    }
    store.removeNode(sel.id)
  }

  return { canDelete, canMoveUp, canMoveDown, deleteLabel, duplicate, moveUp, moveDown, remove }
}
