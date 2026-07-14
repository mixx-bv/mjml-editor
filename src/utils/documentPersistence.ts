import { watch, type Ref } from 'vue'
import { isContainer, type ContainerNode, type HeadFields, type MjmlNode } from '../types/mjml'
import { sanitizeInlineHtml } from './sanitize'

const STORAGE_KEY = 'mjed:document'
const STORAGE_VERSION = 1

/**
 * Re-run the mj-text inline-HTML sanitizer over a restored tree. localStorage is
 * untrusted/tamperable, so mj-text content must pass the same boundary here that
 * parseMjmlString applies to imported MJML (S4). Mutates in place.
 */
function sanitizeRestoredTree(node: MjmlNode): void {
  if (isContainer(node)) {
    node.children.forEach(sanitizeRestoredTree)
  } else if (node.type === 'mj-text' && typeof node.content === 'string') {
    node.content = sanitizeInlineHtml(node.content)
  }
}

export interface PersistedDocument {
  v: number
  tree: ContainerNode
  head: HeadFields
}

export function loadPersistedDocument(): PersistedDocument | null {
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
