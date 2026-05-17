import { isContainer, type MjmlNode } from '../types/mjml'

const escapeAttr = (v: string) => v.replace(/"/g, '&quot;')
const escapeText = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function serializeAttrs(attrs: Record<string, string>, id: string, type: string): string {
  const pairs = Object.entries(attrs)
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
  pairs.push(`css-class="mjed-${id} mjed-t-${type}"`)
  return pairs.length ? ' ' + pairs.join(' ') : ''
}

export function serializeNode(node: MjmlNode): string {
  const attrStr = serializeAttrs(node.attrs, node.id, node.type)
  if (isContainer(node)) {
    const inner = node.children.map(serializeNode).join('\n')
    return `<${node.type}${attrStr}>\n${inner}\n</${node.type}>`
  }
  const content = node.content ?? ''
  return `<${node.type}${attrStr}>${content}</${node.type}>`
}

export interface HeadFields {
  title?: string
  preview?: string
}

export function serializeTree(body: MjmlNode, head?: HeadFields): string {
  const parts: string[] = []
  if (head?.title?.trim()) parts.push(`<mj-title>${escapeText(head.title.trim())}</mj-title>`)
  if (head?.preview?.trim()) parts.push(`<mj-preview>${escapeText(head.preview.trim())}</mj-preview>`)
  const headStr = parts.length ? `<mj-head>\n${parts.join('\n')}\n</mj-head>\n` : ''
  return `<mjml>\n${headStr}${serializeNode(body)}\n</mjml>`
}
