import { useEditorStore } from '../stores/editor'
import { useUiStore } from '../stores/ui'
import { useNodeActions } from './useNodeActions'

// A keystroke aimed at a form field or the inline rich-text editor must never
// trigger a document action (e.g. deleting the selected block mid-typing).
// NB: this handler is also bound to the preview iframe's document, so `el` may
// come from that separate realm — `el instanceof HTMLElement` is FALSE there and
// would let a Backspace in the inline editor fall through to node-delete. Duck-type
// on the properties we actually read instead.
function isEditableTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null
  if (!node || typeof node.tagName !== 'string') return false
  const tag = node.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable === true
}

/**
 * Build the visual-editor shortcut handler: undo/redo (Cmd/Ctrl+Z, +Shift or
 * Ctrl+Y for redo), duplicate (Cmd/Ctrl+D) and delete (Delete / Backspace) the
 * current selection. Returned as a bare handler so callers can bind it to the
 * *right* targets rather than `window`:
 *   - the editor root element — so host-page keystrokes outside the editor are
 *     never hijacked (this is a Web Component dropped into a bigger page);
 *   - the preview iframe's document — because a click in the canvas focuses the
 *     iframe, so a following Delete fires there, not on the parent window.
 * Both share one handler; the iframe boundary means only one ever sees a given
 * keystroke, so there is no double-firing.
 */
export function createShortcutHandler(): (e: KeyboardEvent) => void {
  const store = useEditorStore()
  const ui = useUiStore()
  const actions = useNodeActions()

  return function onKeydown(e: KeyboardEvent) {
    if (ui.viewMode !== 'visual') return
    if (isEditableTarget(e.target)) return
    const mod = e.metaKey || e.ctrlKey

    if (mod && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault()
      if (e.shiftKey) {
        if (store.canRedo) store.redo()
      } else if (store.canUndo) {
        store.undo()
      }
      return
    }
    if (mod && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault()
      if (store.canRedo) store.redo()
      return
    }

    // Selection-scoped actions from here on.
    if (!store.selectedId) return

    if (mod && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault()
      actions.duplicate()
      return
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!actions.canDelete.value) return
      e.preventDefault()
      actions.remove()
    }
  }
}
