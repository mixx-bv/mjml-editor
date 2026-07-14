import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadPersistedDocument, setPersistenceEnabled } from './documentPersistence'

const KEY = 'mjed:document'

// Node 22 ships an experimental global `localStorage` that shadows jsdom's and
// throws without a backing file, so back these tests with a plain in-memory stub.
function stubLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  })
}

describe('loadPersistedDocument (T4 validation + S4 re-sanitize)', () => {
  beforeEach(stubLocalStorage)

  it('rejects a document whose root is not mj-body (T4)', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ v: 1, tree: { type: 'mj-section', children: [] }, head: {} }),
    )
    expect(loadPersistedDocument()).toBeNull()
  })

  it('rejects a wrong storage version (T4)', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ v: 99, tree: { type: 'mj-body', children: [] }, head: {} }),
    )
    expect(loadPersistedDocument()).toBeNull()
  })

  it('re-sanitizes mj-text content restored from storage (S4)', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        v: 1,
        tree: {
          id: 'body-1',
          type: 'mj-body',
          attrs: {},
          children: [
            { id: 'txt-1', type: 'mj-text', attrs: {}, content: 'hi<script>alert(1)</script>' },
          ],
        },
        head: { title: '', preview: '' },
      }),
    )
    const loaded = loadPersistedDocument()
    expect(loaded).not.toBeNull()
    const leaf = loaded!.tree.children[0]
    const content = 'content' in leaf ? (leaf.content ?? '') : ''
    expect(content).not.toContain('<script')
  })
})

describe('persistence opt-out (H)', () => {
  beforeEach(stubLocalStorage)
  // Flag is module-global; restore the default so other suites stay unaffected.
  afterEach(() => setPersistenceEnabled(true))

  it('skips restore when disabled, even with a valid stored document', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        v: 1,
        tree: { id: 'body-1', type: 'mj-body', attrs: {}, children: [] },
        head: { title: '', preview: '' },
      }),
    )

    setPersistenceEnabled(false)
    expect(loadPersistedDocument()).toBeNull()

    setPersistenceEnabled(true)
    expect(loadPersistedDocument()).not.toBeNull()
  })
})
