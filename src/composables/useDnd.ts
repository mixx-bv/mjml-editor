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
    const out: DropSlot[] = []
    function walk(node: MjmlNode) {
      if (!isContainer(node)) return
      if (validParents.includes(node.type)) {
        const count = node.children.length
        for (let i = 0; i <= count; i++) {
          out.push({
            parentId: node.id,
            parentType: node.type,
            childType: t,
            index: i,
            childrenCount: count,
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
