import { watch, type Ref } from 'vue'
import { isContainer, type ContainerNode, type HeadFields, type MjmlNode } from '../types/mjml'
import { sanitizeMjTextHtml } from './sanitize'

const STORAGE_KEY = 'mjed:document'
const STORAGE_VERSION = 1

// localStorage auto-restore is a nicety for the standalone app (survive a
// refresh), but harmful when the editor is embedded and the HOST owns the data:
// all instances share one key, so an empty document would show another one's
// content. A host (e.g. the Filament field) disables it via the `no-persist`
// attribute; App.vue flips this before the store initializes.
let persistenceEnabled = true

export function setPersistenceEnabled(enabled: boolean): void {
  persistenceEnabled = enabled
}

/**
 * Re-run the mj-text inline-HTML sanitizer over a restored tree. localStorage is
 * untrusted/tamperable, so mj-text content must pass the same boundary here that
 * parseMjmlString applies to imported MJML (S4). Mutates in place.
 */
function sanitizeRestoredTree(node: MjmlNode): void {
  if (isContainer(node)) {
    node.children.forEach(sanitizeRestoredTree)
  } else if (node.type === 'mj-text' && typeof node.content === 'string') {
    node.content = sanitizeMjTextHtml(node.content)
  }
}

export interface PersistedDocument {
  v: number
  tree: ContainerNode
  head: HeadFields
}

export function loadPersistedDocument(): PersistedDocument | null {
  if (!persistenceEnabled) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedDocument
    // localStorage is untrusted input, so validate the shape before the cast is
    // trusted: right version + an mj-body tree root with children (the same guard
    // loadDocument applies to host-supplied documents) (T4).
    if (
      parsed?.v !== STORAGE_VERSION ||
      parsed.tree?.type !== 'mj-body' ||
      !Array.isArray(parsed.tree.children)
    ) {
      return null
    }
    sanitizeRestoredTree(parsed.tree)
    return parsed
  } catch {
    return null
  }
}

/**
 * Debounced auto-save of the document to localStorage. Triggers off the already-
 * computed serialized signal (which changes on any tree or head edit) instead of
 * deep-watching the reactive tree, avoiding a full traversal per keystroke (M9).
 * Writes at most once per 300ms; quota errors are ignored.
 */
export function persistDocument(tree: Ref<ContainerNode>, head: Ref<HeadFields>, signal: Ref<string>) {
  if (!persistenceEnabled) return
  let timer: number | undefined
  watch(signal, () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      try {
        const doc: PersistedDocument = { v: STORAGE_VERSION, tree: tree.value, head: head.value }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
      } catch {
        // ignore quota errors
      }
    }, 300)
  })
}
