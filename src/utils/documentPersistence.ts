import { watch, type Ref } from 'vue'
import type { ContainerNode } from '../types/mjml'

const STORAGE_KEY = 'mjed:document'
const STORAGE_VERSION = 1

export interface HeadFields {
  title: string
  preview: string
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
    if (parsed.v !== STORAGE_VERSION || !parsed.tree) return null
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
