import { computed, ref } from 'vue'
import { useEditorStore } from '../stores/editor'
import { VALID_PARENT, isContainer } from '../types/mjml'
import type { MjmlNode, MjmlNodeType } from '../types/mjml'

export interface DragBlock {
  id: string
  label: string
  nodeType: MjmlNodeType
  create: () => MjmlNode
}

export interface DropSlot {
  parentId: string
  parentType: MjmlNodeType
  childType: MjmlNodeType
  index: number
  childrenCount: number
  // Ids of the parent's current children, so the overlay can resolve child rects
  // without re-walking the tree per slot (M10).
  childIds: string[]
}

export function slotKey(s: DropSlot): string {
  return `${s.parentId}:${s.index}`
}

const draggedBlock = ref<DragBlock | null>(null)

export function useDnd() {
  const store = useEditorStore()

  const dragType = computed<MjmlNodeType | null>(() => draggedBlock.value?.nodeType ?? null)

  const validSlots = computed<DropSlot[]>(() => {
    const t = dragType.value
    if (!t) return []
    const validParents = VALID_PARENT[t]
    if (!validParents.length) return []
    // Capture the narrowed (non-null) type so it survives into the nested
    // `walk` closure — TS drops control-flow narrowing across function bounds.
    const childType = t
    const out: DropSlot[] = []
    function walk(node: MjmlNode) {
      if (!isContainer(node)) return
      if (validParents.includes(node.type)) {
        const count = node.children.length
        const childIds = node.children.map((c) => c.id)
        for (let i = 0; i <= count; i++) {
          out.push({
            parentId: node.id,
            parentType: node.type,
            childType,
            index: i,
            childrenCount: count,
            childIds,
          })
        }
      }
      node.children.forEach(walk)
    }
    walk(store.tree)
    return out
  })

  function startDrag(block: DragBlock) {
    draggedBlock.value = block
  }

  function endDrag() {
    if (draggedBlock.value !== null) draggedBlock.value = null
  }

  function drop(slot: DropSlot) {
    const block = draggedBlock.value
    if (!block) return
    const node = block.create()
    store.insertNode(slot.parentId, node, slot.index)
    endDrag()
  }

  return { dragType, draggedBlock, validSlots, startDrag, endDrag, drop }
}
