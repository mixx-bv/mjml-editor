import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ContainerNode, HeadFields, MjmlNode, MjmlNodeType } from '../types/mjml'
import { isContainer, VALID_PARENT } from '../types/mjml'
import { cloneNode, createInitialTree } from '../utils/nodeFactory'
import { serializeTree } from '../utils/serialize'
import { sanitizeUrl } from '../utils/sanitize'
import { documentToMjmlJson, parseMjmlString } from '../utils/mjmlJson'
import { removeCardButtonHtml } from '../utils/cardButtons'
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
  const head = ref<HeadFields>({
    title: persisted?.head?.title ?? '',
    preview: persisted?.head?.preview ?? '',
    attributes: persisted?.head?.attributes ?? {},
    attributesRaw: persisted?.head?.attributesRaw ?? '',
    styles: persisted?.head?.styles ?? '',
    rawExtra: persisted?.head?.rawExtra ?? '',
  })

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

  function loadDocument(doc: { tree: ContainerNode; head?: Partial<HeadFields> }): boolean {
    if (!doc.tree || doc.tree.type !== 'mj-body') return false
    tree.value = doc.tree
    head.value = {
      title: doc.head?.title ?? '',
      preview: doc.head?.preview ?? '',
      attributes: doc.head?.attributes ?? {},
      attributesRaw: doc.head?.attributesRaw ?? '',
      styles: doc.head?.styles ?? '',
      rawExtra: doc.head?.rawExtra ?? '',
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
    head.value = parsed.head
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
    // Passthrough nodes only ever come from the parser, never inserted/dragged.
    if (node.type === 'passthrough') return null
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

  // Insert a deep copy (fresh ids) right after the original, mirroring
  // insertNode's snapshot/selection handling. mj-body has no parent → no-op.
  function duplicateNode(id: string): MjmlNode | null {
    const hit = findNode(tree.value, id)
    if (!hit || !hit.parent) return null
    snapshot()
    const copy = cloneNode(hit.node)
    hit.parent.children.splice(hit.index + 1, 0, copy)
    selectedId.value = copy.id
    return copy
  }

  // Remove a single button from a card-style mj-text (imported raw HTML nesting a
  // heading, paragraphs and buttons) by its index, keeping the block whole so its
  // exact styling stays 1:1. Returns false (a no-op) when the node isn't an mj-text
  // or the index is out of range. Snapshots first, so a removal is one undo step.
  function removeCardButton(id: string, index: number): boolean {
    const hit = findNode(tree.value, id)
    if (!hit || hit.node.type !== 'mj-text') return false
    const next = removeCardButtonHtml(hit.node.content ?? '', index)
    if (next == null) return false
    snapshot()
    hit.node.content = next
    return true
  }

  // Reorder a node among its siblings. Cross-parent moves are out of scope here;
  // an out-of-range target (already first/last) is a no-op that doesn't snapshot,
  // so undo history stays clean.
  function moveNode(id: string, direction: 'up' | 'down') {
    const hit = findNode(tree.value, id)
    if (!hit || !hit.parent) return
    const siblings = hit.parent.children
    const target = direction === 'up' ? hit.index - 1 : hit.index + 1
    if (target < 0 || target >= siblings.length) return
    snapshot()
    const [node] = siblings.splice(hit.index, 1)
    siblings.splice(target, 0, node)
  }

  // Position of a node among its siblings, for enabling/disabling move controls.
  // Null when the node has no parent (mj-body) or isn't found.
  function siblingInfo(id: string): { index: number; count: number } | null {
    const hit = findNode(tree.value, id)
    if (!hit || !hit.parent) return null
    return { index: hit.index, count: hit.parent.children.length }
  }

  function updateAttr(id: string, key: string, value: string) {
    const hit = findNode(tree.value, id)
    // Passthrough nodes are opaque (raw HTML, no modelled attrs) — nothing to set.
    if (!hit || hit.node.type === 'passthrough') return
    // Block javascript:-style link URLs at the source so every export stays
    // clean (M13). Non-URL attrs pass through untouched.
    const safe = key === 'href' ? sanitizeUrl(value) : value
    hit.node.attrs = { ...hit.node.attrs, [key]: safe }
  }

  function updateContent(id: string, content: string) {
    const hit = findNode(tree.value, id)
    if (!hit || isContainer(hit.node) || hit.node.type === 'passthrough') return
    hit.node.content = content
  }

  // The properties panel always edits the current selection, so these wrappers let
  // the field composables bind to it symmetrically (read + write both go through
  // the selected node) instead of taking a nodeId that must equal selectedId (A1).
  function updateSelectedAttr(key: string, value: string) {
    if (selectedId.value) updateAttr(selectedId.value, key, value)
  }

  function updateSelectedContent(content: string) {
    if (selectedId.value) updateContent(selectedId.value, content)
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
    duplicateNode,
    removeCardButton,
    moveNode,
    siblingInfo,
    updateAttr,
    updateContent,
    updateSelectedAttr,
    updateSelectedContent,
    beginEdit,
    undo,
    redo,
  }
})
