import { computed, ref, type Ref } from 'vue'
import type { ContainerNode } from '../types/mjml'

const MAX_HISTORY = 50

/**
 * Undo/redo over a document tree using JSON snapshots. Bound to the store's
 * `tree` ref so undo/redo can read and replace it. `snapshot()` is called before
 * each mutation; `reset()` clears history when a fresh document is loaded.
 */
export function useHistory(tree: Ref<ContainerNode>) {
  const history = ref<string[]>([])
  const future = ref<string[]>([])

  function snapshot() {
    const current = JSON.stringify(tree.value)
    // beginEdit() fires on every field focus; skip if nothing changed since the
    // last snapshot so a focus without an edit doesn't add a no-op undo step (L17).
    if (history.value[history.value.length - 1] === current) return
    history.value.push(current)
    if (history.value.length > MAX_HISTORY) history.value.shift()
    future.value = []
  }

  function undo() {
    const prev = history.value.pop()
    if (!prev) return
    future.value.push(JSON.stringify(tree.value))
    tree.value = JSON.parse(prev)
  }

  function redo() {
    const next = future.value.pop()
    if (!next) return
    history.value.push(JSON.stringify(tree.value))
    tree.value = JSON.parse(next)
  }

  function reset() {
    history.value = []
    future.value = []
  }

  return {
    snapshot,
    undo,
    redo,
    reset,
    canUndo: computed(() => history.value.length > 0),
    canRedo: computed(() => future.value.length > 0),
  }
}
