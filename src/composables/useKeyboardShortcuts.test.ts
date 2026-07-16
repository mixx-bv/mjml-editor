import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createShortcutHandler } from './useKeyboardShortcuts'
import { useEditorStore } from '../stores/editor'
import { useUiStore } from '../stores/ui'
import { createNode } from '../utils/nodeFactory'
import { isContainer, type ContainerNode, type MjmlNode } from '../types/mjml'

function stubLocalStorage() {
  const s = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (s.has(k) ? s.get(k)! : null),
    setItem: (k: string, v: string) => void s.set(k, String(v)),
    removeItem: (k: string) => void s.delete(k),
    clear: () => s.clear(),
  })
}

function findFirst(node: MjmlNode, type: string): MjmlNode | null {
  if (node.type === type) return node
  if (isContainer(node)) {
    for (const c of node.children) {
      const hit = findFirst(c, type)
      if (hit) return hit
    }
  }
  return null
}

function key(opts: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    preventDefault() {},
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    target: null,
    ...opts,
  } as unknown as KeyboardEvent
}

beforeEach(() => {
  stubLocalStorage()
  setActivePinia(createPinia())
})

describe('createShortcutHandler', () => {
  it('deletes the selected block on Delete', () => {
    const store = useEditorStore()
    const text = findFirst(store.tree, 'mj-text')!
    const column = findFirst(store.tree, 'mj-column') as ContainerNode
    store.select(text.id)

    createShortcutHandler()(key({ key: 'Delete' }))

    expect(column.children.find((c) => c.id === text.id)).toBeUndefined()
  })

  it('does NOT delete when focus is in a form field (the critical guard)', () => {
    const store = useEditorStore()
    const text = findFirst(store.tree, 'mj-text')!
    const column = findFirst(store.tree, 'mj-column') as ContainerNode
    store.select(text.id)

    const input = document.createElement('input')
    createShortcutHandler()(key({ key: 'Delete', target: input }))

    expect(column.children.find((c) => c.id === text.id)).toBeDefined()
  })

  it('duplicates the selection on Cmd/Ctrl+D', () => {
    const store = useEditorStore()
    const text = findFirst(store.tree, 'mj-text')!
    const column = findFirst(store.tree, 'mj-column') as ContainerNode
    const before = column.children.length
    store.select(text.id)

    createShortcutHandler()(key({ key: 'd', metaKey: true }))

    expect(column.children.length).toBe(before + 1)
  })

  it('undoes the last change on Cmd/Ctrl+Z', () => {
    const store = useEditorStore()
    store.insertNode(store.tree.id, createNode('mj-section')) // 2 sections; canUndo now true
    expect(store.tree.children.length).toBe(2)

    createShortcutHandler()(key({ key: 'z', metaKey: true }))

    // undo() replaces the whole tree ref, so read it fresh rather than via a
    // captured reference.
    expect(store.tree.children.length).toBe(1)
  })

  it('ignores shortcuts in source view (native textarea keeps its behaviour)', () => {
    const store = useEditorStore()
    const ui = useUiStore()
    ui.viewMode = 'source'
    const text = findFirst(store.tree, 'mj-text')!
    const column = findFirst(store.tree, 'mj-column') as ContainerNode
    store.select(text.id)

    createShortcutHandler()(key({ key: 'Delete' }))

    expect(column.children.find((c) => c.id === text.id)).toBeDefined()
  })
})
