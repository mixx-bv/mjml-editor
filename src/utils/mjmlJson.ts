import type { ContainerNode, HeadFields, MjmlNode, MjmlNodeType } from '../types/mjml'
import { CONTAINER_TYPES, isContainer, nonEmptyAttrs, VALID_PARENT } from '../types/mjml'
import { ID_PREFIX, uid } from './nodeFactory'
import { sanitizeInlineHtml } from './sanitize'
import { parseEditorClass } from './mjedMarker'

/**
 * MJML's canonical JSON format (per https://documentation.mjml.io/#using-mjml-in-json).
 * Differs from our internal shape: `tagName` instead of `type`, `attributes` instead of `attrs`,
 * no internal `id`. Leaves use `content` for text. Containers use `children`.
 */
export interface MjmlJsonNode {
  tagName: string
  attributes?: Record<string, string>
  children?: MjmlJsonNode[]
  content?: string
}

export interface MjmlJsonDocument {
  tagName: 'mjml'
  children: MjmlJsonNode[]
}

function treeToMjmlJson(node: MjmlNode): MjmlJsonNode {
  const out: MjmlJsonNode = { tagName: node.type }
  // Drop empty-string attrs so the JSON export matches the MJML export, which
  // strips them too (serialize.ts) — shared filter keeps them in lockstep.
  const attrs = Object.fromEntries(nonEmptyAttrs(node.attrs))
  if (Object.keys(attrs).length > 0) out.attributes = attrs
  if (isContainer(node)) {
    if (node.children.length > 0) out.children = node.children.map(treeToMjmlJson)
  } else if (node.content !== undefined && node.content !== '') {
    out.content = node.content
  }
  return out
}

export function documentToMjmlJson(
  body: ContainerNode,
  head: Partial<HeadFields>,
): MjmlJsonDocument {
  const headChildren: MjmlJsonNode[] = []
  if (head.title?.trim()) headChildren.push({ tagName: 'mj-title', content: head.title.trim() })
  if (head.preview?.trim()) headChildren.push({ tagName: 'mj-preview', content: head.preview.trim() })
  const children: MjmlJsonNode[] = []
  if (headChildren.length) children.push({ tagName: 'mj-head', children: headChildren })
  children.push(treeToMjmlJson(body))
  return { tagName: 'mjml', children }
}

// Derived from the single source of truth in types/mjml rather than re-listed.
const VALID_TYPES = new Set<MjmlNodeType>(Object.keys(VALID_PARENT) as MjmlNodeType[])

export interface ParsedMjmlDocument {
  body: ContainerNode
  head: HeadFields
}

// `text/html` ignores a trailing slash on non-void elements, so `<mj-image />`
// stays open and swallows following siblings. Expand self-closing mj-* tags to
// explicit open/close pairs first. The quoted-string alternatives let a `>`
// inside an attribute value pass through without ending the match early.
function normalizeSelfClosing(mjml: string): string {
  return mjml.replace(/<(mj-[a-z-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)\/>/gi, '<$1$2></$1>')
}

/**
 * Parse an MJML XML string into our internal tree. Returns null if no valid
 * `<mjml>` root with `<mj-body>` is found. Unknown attrs are passed through.
 * `css-class` is stripped (it's our internal annotation).
 */
export function parseMjmlString(mjml: string): ParsedMjmlDocument | null {
  if (typeof mjml !== 'string' || !mjml.trim()) return null
  const parser = new DOMParser()
  const doc = parser.parseFromString(normalizeSelfClosing(mjml), 'text/html')
  const root = doc.querySelector('mjml')
  if (!root) return null

  const head = { title: '', preview: '' }
  const mjHead = root.querySelector('mj-head')
  if (mjHead) {
    const title = mjHead.querySelector('mj-title')
    if (title?.textContent) head.title = title.textContent.trim()
    const preview = mjHead.querySelector('mj-preview')
    if (preview?.textContent) head.preview = preview.textContent.trim()
  }

  const mjBody = root.querySelector('mj-body')
  if (!mjBody) return null
  const body = elementToInternal(mjBody)
  if (!body || body.type !== 'mj-body' || !isContainer(body)) return null
  return { body, head }
}

// mj-text content is inline HTML and must be sanitized at the boundary (C2);
// other leaves carry plain text that is escaped at serialize time.
function leafContent(type: MjmlNodeType, raw: string): string {
  return type === 'mj-text' ? sanitizeInlineHtml(raw) : raw
}

function elementToInternal(el: Element): MjmlNode | null {
  const type = el.tagName.toLowerCase() as MjmlNodeType
  if (!VALID_TYPES.has(type)) return null
  const attrs: Record<string, string> = {}
  let preservedId: string | undefined
  for (const attr of Array.from(el.attributes)) {
    if (attr.name === 'css-class') {
      preservedId = parseEditorClass(attr.value)?.id
      continue
    }
    attrs[attr.name] = attr.value
  }
  const base = { id: preservedId ?? uid(ID_PREFIX[type]), type, attrs }
  if (CONTAINER_TYPES.includes(type)) {
    const children: MjmlNode[] = []
    for (const child of Array.from(el.children)) {
      const node = elementToInternal(child)
      if (node) children.push(node)
    }
    return { ...base, children } as ContainerNode
  }
  // mj-text keeps its inline HTML (sanitized in leafContent); every other leaf is
  // a plain-text label, so read the *decoded* text (textContent). serialize.ts
  // re-escapes `&`/`<`/`>` on export, making this the exact inverse — without it,
  // innerHTML re-encodes `&`→`&amp;` and each round-trip stacks another `amp;` (M1).
  const raw = type === 'mj-text' ? el.innerHTML.trim() : (el.textContent ?? '').trim()
  return { ...base, content: leafContent(type, raw) } as MjmlNode
}
