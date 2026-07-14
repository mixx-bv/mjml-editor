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
  const headStr = parts.length ? `<mj-head>\n${parts.join('\n')}\n</mj-head>\n` : ''
  return `<mjml>\n${headStr}${serializeNode(body, includeEditorIds)}\n</mjml>`
}
