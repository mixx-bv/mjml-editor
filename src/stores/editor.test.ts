import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEditorStore } from './editor'
import { createNode } from '../utils/nodeFactory'
import { isContainer, type ContainerNode, type MjmlNode } from '../types/mjml'

function findFirst(node: MjmlNode, type: string): MjmlNode | null {
  if (node.type === type) return node
  if (isContainer(node)) {
    for (const child of node.children) {
      const hit = findFirst(child, type)
      if (hit) return hit
    }
  }
  return null
}

// Node 22 ships an experimental global `localStorage` that shadows jsdom's and
// throws without a backing file, so back the store's auto-restore with a fresh
// in-memory stub each test (same idiom as documentPersistence.test.ts).
function stubLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  })
}

beforeEach(() => {
  stubLocalStorage()
  setActivePinia(createPinia())
})

describe('editor store — duplicateNode', () => {
  it('inserts a fresh-id copy right after the original and selects it', () => {
    const store = useEditorStore()
    const column = findFirst(store.tree, 'mj-column') as ContainerNode
    const text = column.children[0]
    const before = column.children.length

    const copy = store.duplicateNode(text.id)

    expect(copy).not.toBeNull()
    expect(column.children.length).toBe(before + 1)
    expect(column.children[1].id).toBe(copy!.id) // sits directly after the original
    expect(copy!.id).not.toBe(text.id)
    expect(store.selectedId).toBe(copy!.id)
  })

  it('is a no-op for mj-body (it has no parent to insert into)', () => {
    const store = useEditorStore()
    expect(store.duplicateNode(store.tree.id)).toBeNull()
  })
})

describe('editor store — moveNode', () => {
  it('reorders a node up and down among its siblings', () => {
    const store = useEditorStore()
    const body = store.tree
    store.insertNode(body.id, createNode('mj-section')) // body now has two sections
    const firstId = body.children[0].id
    const secondId = body.children[1].id

    store.moveNode(secondId, 'up')
    expect(body.children[0].id).toBe(secondId)
    expect(body.children[1].id).toBe(firstId)

    store.moveNode(secondId, 'down')
    expect(body.children[0].id).toBe(firstId)
    expect(body.children[1].id).toBe(secondId)
  })

  it('does not move a node past the ends of its sibling list', () => {
    const store = useEditorStore()
    const body = store.tree
    const only = body.children[0]

    store.moveNode(only.id, 'up') // already first
    expect(body.children[0].id).toBe(only.id)

    store.moveNode(only.id, 'down') // already last
    expect(body.children[0].id).toBe(only.id)
  })
})

describe('editor store — siblingInfo', () => {
  it('reports index and count, and null for the parentless body', () => {
    const store = useEditorStore()
    const body = store.tree
    store.insertNode(body.id, createNode('mj-section'))

    expect(store.siblingInfo(body.children[1].id)).toEqual({ index: 1, count: 2 })
    expect(store.siblingInfo(body.id)).toBeNull()
  })
})

describe('editor store — removeCardButton', () => {
  // A card mj-text: a heading, a button that shares its cell with a paragraph, and a
  // second button alone in its own table row.
  const CARD =
    '<table><tbody>' +
    '<tr><td><div>Title</div></td></tr>' +
    '<tr><td>' +
    '<div><a href="{{a}}" style="display:inline-block;padding:8px;background:#000;color:#fff;">One</a></div>' +
    '<div>Keep me</div>' +
    '</td></tr>' +
    '<tr><td><a href="{{b}}" style="display:inline-block;padding:8px;background:#000;color:#fff;">Two</a></td></tr>' +
    '</tbody></table>'

  function contentOf(store: ReturnType<typeof useEditorStore>): string {
    return (findFirst(store.tree, 'mj-text') as { content?: string }).content ?? ''
  }

  it('removes only the chosen button, keeping the rest of the card 1:1', () => {
    const store = useEditorStore()
    const text = findFirst(store.tree, 'mj-text')!
    store.updateContent(text.id, CARD)

    expect(store.removeCardButton(text.id, 0)).toBe(true) // remove "One"

    const content = contentOf(store)
    expect(content).not.toContain('One')
    expect(content).toContain('Two') // other button kept
    expect(content).toContain('Keep me') // sibling text in the same cell kept
    expect(content).toContain('Title') // heading kept
  })

  it('is a single undo step', () => {
    const store = useEditorStore()
    const text = findFirst(store.tree, 'mj-text')!
    store.updateContent(text.id, CARD)
    store.removeCardButton(text.id, 1) // remove "Two"

    store.undo()

    expect(contentOf(store)).toContain('Two')
  })

  it('is a no-op for an out-of-range index or a non-mj-text node', () => {
    const store = useEditorStore()
    const column = findFirst(store.tree, 'mj-column') as ContainerNode
    const text = column.children[0]
    store.updateContent(text.id, CARD)

    expect(store.removeCardButton(text.id, 9)).toBe(false)
    expect(store.removeCardButton(column.id, 0)).toBe(false) // not an mj-text
  })
})
