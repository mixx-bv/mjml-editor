import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ContainerNode, MjmlNode, MjmlNodeType } from '../types/mjml'
import { isContainer, VALID_PARENT } from '../types/mjml'
import { createInitialTree } from '../utils/nodeFactory'
import { serializeTree } from '../utils/serialize'
import { sanitizeUrl } from '../utils/sanitize'
import { documentToMjmlJson, parseMjmlString } from '../utils/mjmlJson'
import { loadPersistedDocument, persistDocument } from '../utils/documentPersistence'
import { useHistory } from '../composables/useHistory'

interface NodeSearchHit {
  node: MjmlNode
  parent: ContainerNode | null
  index: number
}

function findNode(root: MjmlNode, id: string, parent: ContainerNode | null = null, index = -1): NodeSearchHit | null {
  if (root.id === id) return { node: root, parent, index }
  if (!isContainer(root)) return null
  for (let i = 0; i < root.children.length; i++) {
    const hit = findNode(root.children[i], id, root, i)
    if (hit) return hit
  }
  return null
}

export const useEditorStore = defineStore('editor', () => {
  const persisted = loadPersistedDocument()
  const tree = ref<ContainerNode>(persisted?.tree ?? createInitialTree())
  const selectedId = ref<string | null>(null)
  const head = ref(persisted?.head ?? { title: '', preview: '' })

  const { snapshot, undo, redo, reset: resetHistory, canUndo, canRedo } = useHistory(tree)

  const selected = computed<MjmlNode | null>(() => {
    if (!selectedId.value) return null
    return findNode(tree.value, selectedId.value)?.node ?? null
  })

  const ancestors = computed<MjmlNode[]>(() => {
    if (!selectedId.value) return []
    const chain: MjmlNode[] = []
    function walk(node: MjmlNode, path: MjmlNode[]): boolean {
      const next = [...path, node]
      if (node.id === selectedId.value) {
        chain.push(...next)
        return true
      }
      if (isContainer(node)) {
        for (const c of node.children) if (walk(c, next)) return true
      }
      return false
    }
    walk(tree.value, [])
    return chain
  })

  // Public/clean MJML (no editor-internal css-class IDs).
  // Used by source view, export modal, send-test, and external consumers.
  const mjmlString = computed(() => serializeTree(tree.value, head.value))

  // MJML with editor css-class injected (mjed-{id} markers).
  // Used by the visual EditorCanvas iframe to wire clicks back to tree nodes.
  const editorMjml = computed(() =>
    serializeTree(tree.value, head.value, { includeEditorIds: true }),
  )

  const mjmlJson = computed(() => documentToMjmlJson(tree.value, head.value))

  // Persist off the serialized signal (defined above), not a deep tree watch (M9).
  persistDocument(tree, head, mjmlString)

  function loadDocument(doc: { tree: ContainerNode; head?: { title?: string; preview?: string } }): boolean {
    if (!doc.tree || doc.tree.type !== 'mj-body') return false
    tree.value = doc.tree
    head.value = {
      title: doc.head?.title ?? '',
      preview: doc.head?.preview ?? '',
    }
    selectedId.value = null
    resetHistory()
    return true
  }

  function loadMjml(mjml: string): boolean {
    const parsed = parseMjmlString(mjml)
    if (!parsed) return false
    return loadDocument({ tree: parsed.body, head: parsed.head })
  }

  // Like loadMjml, but preserves undo history (snapshots first). Use for
  // continuous source-mode edits where the user expects undo to work.
  function applyMjml(mjml: string): boolean {
    const parsed = parseMjmlString(mjml)
    if (!parsed) return false
    snapshot()
    tree.value = parsed.body
    head.value = { title: parsed.head.title, preview: parsed.head.preview }
    return true
  }

  function select(id: string | null) {
    selectedId.value = id
  }

  function canAcceptChild(parentType: MjmlNodeType, childType: MjmlNodeType): boolean {
    return VALID_PARENT[childType]?.includes(parentType) ?? false
  }

  function insertNode(parentId: string, node: MjmlNode, index?: number): MjmlNode | null {
    const hit = findNode(tree.value, parentId)
    if (!hit || !isContainer(hit.node)) return null
    if (!canAcceptChild(hit.node.type, node.type)) return null
    snapshot()
    const insertAt = index ?? hit.node.children.length
    hit.node.children.splice(insertAt, 0, node)
    selectedId.value = node.id
    return node
  }

  function removeNode(id: string) {
    const hit = findNode(tree.value, id)
    if (!hit || !hit.parent) return
    snapshot()
    const parentId = hit.parent.id
    hit.parent.children.splice(hit.index, 1)
    if (selectedId.value === id) selectedId.value = parentId
  }

  function updateAttr(id: string, key: string, value: string) {
    const hit = findNode(tree.value, id)
    if (!hit) return
    // Block javascript:-style link URLs at the source so every export stays
    // clean (M13). Non-URL attrs pass through untouched.
    const safe = key === 'href' ? sanitizeUrl(value) : value
    hit.node.attrs = { ...hit.node.attrs, [key]: safe }
  }

  function updateContent(id: string, content: string) {
    const hit = findNode(tree.value, id)
    if (!hit || isContainer(hit.node)) return
    hit.node.content = content
  }

  function beginEdit() {
    snapshot()
  }

  return {
    tree,
    selected,
    selectedId,
    ancestors,
    head,
    mjmlString,
    editorMjml,
    mjmlJson,
    loadMjml,
    loadDocument,
    applyMjml,
    canUndo,
    canRedo,
    select,
    insertNode,
    removeNode,
    updateAttr,
    updateContent,
    beginEdit,
    undo,
    redo,
    findNode: (id: string) => findNode(tree.value, id),
    canAcceptChild,
  }
})
