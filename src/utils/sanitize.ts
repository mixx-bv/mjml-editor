const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'A', 'BR', 'P',
  'UL', 'OL', 'LI', 'SPAN',
])
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(['href', 'target', 'rel']),
  SPAN: new Set(['style']),
}
const ALLOWED_STYLE_PROPS = new Set(['color', 'background-color'])

export function sanitizeInlineHtml(html: string): string {
  const tmpl = document.createElement('template')
  tmpl.innerHTML = html
  walk(tmpl.content)
  return tmpl.innerHTML.trim()
}

function walk(root: Node) {
  const children = Array.from(root.childNodes)
  for (const node of children) {
    if (node.nodeType === Node.TEXT_NODE) continue
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node)
      continue
    }
    const el = node as Element
    walk(el)

    if (!ALLOWED_TAGS.has(el.tagName)) {
      const parent = el.parentNode
      if (!parent) continue
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
      continue
    }

    const allowed = ALLOWED_ATTRS[el.tagName] || EMPTY
    for (const attr of Array.from(el.attributes)) {
      if (!allowed.has(attr.name)) el.removeAttribute(attr.name)
    }
    if (el.tagName === 'SPAN') sanitizeStyle(el as HTMLElement)
  }
}

function sanitizeStyle(el: HTMLElement) {
  const raw = el.getAttribute('style')
  if (!raw) return
  const kept: string[] = []
  for (const decl of raw.split(';')) {
    const idx = decl.indexOf(':')
    if (idx === -1) continue
    const prop = decl.slice(0, idx).trim().toLowerCase()
    const value = decl.slice(idx + 1).trim()
    if (!prop || !value) continue
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue
    if (/[<>"`]/.test(value)) continue
    kept.push(`${prop}: ${value}`)
  }
  if (kept.length) el.setAttribute('style', kept.join('; '))
  else el.removeAttribute('style')
}

const EMPTY: Set<string> = new Set()

/**
 * Convert <p>…</p> blocks to <br>-joined inline content. Preserves <ul>/<ol>
 * and other block siblings. An empty paragraph becomes an extra <br>.
 */
export function flattenParagraphs(html: string): string {
  const tmpl = document.createElement('template')
  tmpl.innerHTML = html
  const nodes = Array.from(tmpl.content.childNodes)
  const parts: string[] = []
  nodes.forEach((node, i) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node as Text).textContent ?? ''
      if (t) parts.push(t)
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as Element
    if (el.tagName === 'P') {
      let inner = el.innerHTML.trim()
      if (inner === '<br>' || inner === '<br/>' || inner === '<br />') inner = ''
      parts.push(inner)
      if (i < nodes.length - 1) parts.push('<br>')
    } else {
      parts.push(el.outerHTML)
    }
  })
  return parts.join('')
}
