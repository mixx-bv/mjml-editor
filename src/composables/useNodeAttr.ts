import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useEditorStore } from '../stores/editor'

/**
 * Two-way binding to an attribute of the selected node. The properties panel only
 * mounts fields for `store.selected`, so both sides target that node: the getter
 * reads the already-resolved `store.selected` (one cached tree-walk shared by
 * every field, M5 + M7) and the setter routes through `updateSelectedAttr`, so
 * read and write stay symmetric without a nodeId argument (A1).
 */
export function useNodeAttr(attrKey: MaybeRefOrGetter<string>) {
  const store = useEditorStore()
  const value = computed<string>({
    get: () => {
      const n = store.selected
      return (n && 'attrs' in n ? n.attrs[toValue(attrKey)] : '') ?? ''
    },
    set: (v) => store.updateSelectedAttr(toValue(attrKey), v),
  })
  return { value, onFocus: () => store.beginEdit() }
}

/** Like {@link useNodeAttr} but bound to the selected leaf node's text content. */
export function useNodeContent() {
  const store = useEditorStore()
  const value = computed<string>({
    get: () => {
      const n = store.selected
      return (n && 'content' in n ? n.content : '') ?? ''
    },
    set: (v) => store.updateSelectedContent(v),
  })
  return { value, onFocus: () => store.beginEdit() }
}
