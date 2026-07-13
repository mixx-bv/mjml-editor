import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useEditorStore } from '../stores/editor'

/**
 * Two-way binding to an attribute of the selected node. The properties panel
 * only mounts fields for `store.selected`, so the getter reads that already-
 * resolved node — one cached tree-walk shared by every field — instead of
 * re-finding the node per field on each keystroke (M5 + M7).
 */
export function useNodeAttr(nodeId: MaybeRefOrGetter<string>, attrKey: MaybeRefOrGetter<string>) {
  const store = useEditorStore()
  const value = computed<string>({
    get: () => store.selected?.attrs[toValue(attrKey)] ?? '',
    set: (v) => store.updateAttr(toValue(nodeId), toValue(attrKey), v),
  })
  return { value, onFocus: () => store.beginEdit() }
}

/** Like {@link useNodeAttr} but bound to a leaf node's text content. */
export function useNodeContent(nodeId: MaybeRefOrGetter<string>) {
  const store = useEditorStore()
  const value = computed<string>({
    get: () => {
      const n = store.selected
      return (n && 'content' in n ? n.content : '') ?? ''
    },
    set: (v) => store.updateContent(toValue(nodeId), v),
  })
  return { value, onFocus: () => store.beginEdit() }
}
