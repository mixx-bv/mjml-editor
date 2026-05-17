import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ContainerNode, MjmlNode, MjmlNodeType } from '../types/mjml'
import { isContainer, VALID_PARENT } from '../types/mjml'
import { createInitialTree, createNode } from '../utils/nodeFactory'
import { serializeTree } from '../utils/serialize'

export type Device = 'desktop' | 'tablet' | 'mobile'

export interface MediaAsset {
  url: string
  label?: string
  thumbnail?: string
}

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

const MAX_HISTORY = 50

export const useEditorStore = defineStore('editor', () => {
  const tree = ref<ContainerNode>(createInitialTree())
  const selectedId = ref<string | null>(null)
  const device = ref<Device>('desktop')
  const history = ref<string[]>([])
  const future = ref<string[]>([])
  const mediaLibrary = ref<MediaAsset[]>([])
  const pickerOpen = ref(false)
  const sourceVisible = ref(false)
  const settingsOpen = ref(false)
  const head = ref({ title: '', preview: '' })
  let pickerResolve: ((url: string | null) => void) | null = null

  function setMediaLibrary(assets: MediaAsset[]) {
    mediaLibrary.value = assets
  }

  function openPicker(): Promise<string | null> {
    pickerOpen.value = true
    return new Promise((resolve) => {
      pickerResolve = resolve
    })
  }

  function closePicker(url: string | null) {
    pickerOpen.value = false
    if (pickerResolve) {
      pickerResolve(url)
      pickerResolve = null
    }
  }

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

  const mjmlString = computed(() => serializeTree(tree.value, head.value))

  function snapshot() {
    history.value.push(JSON.stringify(tree.value))
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

  function select(id: string | null) {
    selectedId.value = id
  }

  function canAcceptChild(parentType: MjmlNodeType, childType: MjmlNodeType): boolean {
    return VALID_PARENT[childType]?.includes(parentType) ?? false
  }

  function insertInto(parentId: string, childType: MjmlNodeType, index?: number): MjmlNode | null {
    const hit = findNode(tree.value, parentId)
    if (!hit || !isContainer(hit.node)) return null
    if (!canAcceptChild(hit.node.type, childType)) return null
    snapshot()
    const child = createNode(childType)
    const insertAt = index ?? hit.node.children.length
    hit.node.children.splice(insertAt, 0, child)
    selectedId.value = child.id
    return child
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

  function moveNode(id: string, targetParentId: string, index: number) {
    const hit = findNode(tree.value, id)
    if (!hit || !hit.parent) return
    const target = findNode(tree.value, targetParentId)
    if (!target || !isContainer(target.node)) return
    if (!canAcceptChild(target.node.type, hit.node.type)) return
    snapshot()
    hit.parent.children.splice(hit.index, 1)
    const safeIndex = hit.parent === target.node && index > hit.index ? index - 1 : index
    target.node.children.splice(safeIndex, 0, hit.node)
  }

  function updateAttr(id: string, key: string, value: string) {
    const hit = findNode(tree.value, id)
    if (!hit) return
    hit.node.attrs = { ...hit.node.attrs, [key]: value }
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
    device,
    mediaLibrary,
    pickerOpen,
    sourceVisible,
    settingsOpen,
    head,
    setMediaLibrary,
    openPicker,
    closePicker,
    mjmlString,
    canUndo: computed(() => history.value.length > 0),
    canRedo: computed(() => future.value.length > 0),
    select,
    insertInto,
    insertNode,
    removeNode,
    moveNode,
    updateAttr,
    updateContent,
    beginEdit,
    undo,
    redo,
    findNode: (id: string) => findNode(tree.value, id),
    canAcceptChild,
  }
})
