import { isContainer, nonEmptyAttrs, type HeadFields, type MjmlNode } from '../types/mjml'
import { editorClass } from './mjedMarker'

const escapeAttr = (v: string) => v.replace(/"/g, '&quot;')
const escapeText = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function serializeAttrs(
  attrs: Record<string, string>,
  id: string,
  type: string,
  includeEditorIds: boolean,
): string {
  const pairs = nonEmptyAttrs(attrs).map(([k, v]) => `${k}="${escapeAttr(v)}"`)
  if (includeEditorIds) pairs.push(`css-class="${editorClass(id, type)}"`)
  return pairs.length ? ' ' + pairs.join(' ') : ''
}

export function serializeNode(node: MjmlNode, includeEditorIds: boolean): string {
  // Preserved unknown elements are emitted exactly as they were parsed, so
  // mjml-browser re-renders them unchanged. They carry no css-class marker, so
  // they aren't selectable in the canvas until a first-class node type exists.
  if (node.type === 'passthrough') return node.raw
  if (node.type === 'mj-raw') {
    // mjml-browser drops css-class off mj-raw, so the compiled output carries no
    // selection marker. For the editor canvas only, wrap the raw content in a
    // marker <div> so the block is click-selectable; the saved mjml stays a clean
    // <mj-raw> so the sent email is untouched.
    const rawAttrs = serializeAttrs(node.attrs, node.id, node.type, false)
    const rawContent = node.content ?? ''
    return includeEditorIds
      ? `<mj-raw${rawAttrs}><div class="${editorClass(node.id, 'mj-raw')}">${rawContent}</div></mj-raw>`
      : `<mj-raw${rawAttrs}>${rawContent}</mj-raw>`
  }
  const attrStr = serializeAttrs(node.attrs, node.id, node.type, includeEditorIds)
  if (isContainer(node)) {
    const inner = node.children.map((c) => serializeNode(c, includeEditorIds)).join('\n')
    return `<${node.type}${attrStr}>\n${inner}\n</${node.type}>`
  }
  // mj-text holds sanitized inline HTML (must pass through verbatim); mj-button
  // is a plain-text label, so a stray `<`/`&` there must be escaped to stay
  // valid markup for mjml2html.
  const raw = node.content ?? ''
  const content = node.type === 'mj-button' ? escapeText(raw) : raw
  return `<${node.type}${attrStr}>${content}</${node.type}>`
}

export function serializeTree(
  body: MjmlNode,
  head?: HeadFields,
  options: { includeEditorIds?: boolean } = {},
): string {
  const includeEditorIds = options.includeEditorIds ?? false
  const parts: string[] = []
  if (head?.title?.trim()) parts.push(`<mj-title>${escapeText(head.title.trim())}</mj-title>`)
  if (head?.preview?.trim()) parts.push(`<mj-preview>${escapeText(head.preview.trim())}</mj-preview>`)
  // Rebuild ONE mj-attributes from the structured mj-all defaults plus any
  // preserved per-component children, so nothing duplicates or drops.
  const mjAllAttrs = head ? nonEmptyAttrs(head.attributes) : []
  const attributesRaw = head?.attributesRaw?.trim() ?? ''
  if (mjAllAttrs.length || attributesRaw) {
    const allPairs = mjAllAttrs.map(([k, v]) => `${k}="${escapeAttr(v)}"`).join(' ')
    const allTag = allPairs ? `<mj-all ${allPairs} />` : ''
    parts.push(`<mj-attributes>${allTag}${attributesRaw}</mj-attributes>`)
  }
  if (head?.styles?.trim()) parts.push(`<mj-style>${head.styles.trim()}</mj-style>`)
  // Anything not modelled above (mj-font, mj-breakpoint, …) is markup, re-emitted
  // untouched so it survives the round-trip.
  if (head?.rawExtra?.trim()) parts.push(head.rawExtra.trim())
  const headStr = parts.length ? `<mj-head>\n${parts.join('\n')}\n</mj-head>\n` : ''
  return `<mjml>\n${headStr}${serializeNode(body, includeEditorIds)}\n</mjml>`
}
