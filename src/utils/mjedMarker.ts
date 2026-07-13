import type { MjmlNodeType } from '../types/mjml'

// The editor tags every serialized node with
// `css-class="mjed-<id> mjed-t-<type>"` so clicks/selection in the compiled
// preview can be mapped back to tree nodes. These helpers are the single source
// for producing and reading that marker (the sandboxed iframe keeps its own copy
// since it can't import — see EditorCanvas BRIDGE_SRCDOC).
const ID_RE = /mjed-([a-z]+-[a-z0-9]+-[a-z0-9]+)/
const TYPE_RE = /mjed-t-(mj-[a-z]+)/

export function editorClass(id: string, type: string): string {
  return `mjed-${id} mjed-t-${type}`
}

export function parseEditorClass(cls: string): { id: string; type: MjmlNodeType | null } | null {
  const idM = cls.match(ID_RE)
  if (!idM) return null
  const typeM = cls.match(TYPE_RE)
  return { id: idM[1], type: (typeM?.[1] as MjmlNodeType) ?? null }
}

export function markerSelector(id: string): string {
  return `.mjed-${id}`
}
