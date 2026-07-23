// Message protocol between the parent (useCanvasBridge) and the sandboxed preview
// iframe (bridgeSrcdoc). One source of truth for the message names and payloads so
// the two sides can't drift, and so the parent side type-checks instead of poking
// at `any` (T1). The srcdoc itself is an inlined string and can't import this, so
// it mirrors the same literal names by hand — keep them in sync.

/** Message-name constants shared across the bridge. */
export const MJED = {
  ready: 'mjed:ready',
  select: 'mjed:select',
  textEdit: 'mjed:text-edit',
  editState: 'mjed:edit-state',
  highlight: 'mjed:highlight',
  dragState: 'mjed:drag-state',
  render: 'mjed:render',
  insertVariable: 'mjed:insert-variable',
} as const

/** Messages the iframe sends up to the parent. */
export type BridgeInbound =
  | { type: typeof MJED.ready }
  | { type: typeof MJED.select; id: string }
  | { type: typeof MJED.textEdit; id: string; content: string }
  // Inline rich-text editing started/stopped — lets the parent offer variable
  // insertion into the live editor only while it is open.
  | { type: typeof MJED.editState; editing: boolean; id: string | null }

/** Messages the parent posts down into the iframe. */
export type BridgeOutbound =
  | { type: typeof MJED.highlight; id: string | null }
  | { type: typeof MJED.dragState; dragging: boolean }
  | { type: typeof MJED.render; styles: string; bodyStyle: string; bodyHTML: string; bodyClass: string }
  // Insert a personalization token at the inline editor's saved caret.
  | { type: typeof MJED.insertVariable; token: string }
