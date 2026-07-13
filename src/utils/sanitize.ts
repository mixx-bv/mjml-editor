const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'A', 'BR', 'P',
  'UL', 'OL', 'LI', 'SPAN',
])
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(['href', 'target', 'rel']),
  SPAN: new Set(['style']),
}
const ALLOWED_STYLE_PROPS = new Set(['color', 'background-color'])

const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:'])

// Strip control chars (and spaces) so a scheme can't hide behind them, e.g.
// "java\tscript:" or " javascript:". Kept ASCII-safe on purpose.
function stripControlChars(value: string): string {
  let out = ''
  for (const ch of value) if (ch.charCodeAt(0) > 0x20) out += ch
  return out
}

/**
 * Returns the URL unchanged if it uses a safe scheme (http/https/mailto/tel) or
 * is relative/anchor/protocol-relative; otherwise returns '' (blocks
 * `javascript:`, `vbscript:`, `data:`, …). Use for link hrefs the user controls.
 */
export function sanitizeUrl(value: string): string {
  const raw = (value ?? '').trim()
  if (!raw) return ''
  const probe = stripControlChars(raw)
  const m = probe.match(/^([a-z][a-z0-9+.-]*):/i)
  if (!m) return raw // no scheme → relative / anchor / query, safe
  return SAFE_URL_SCHEMES.has(m[1].toLowerCase() + ':') ? raw : ''
}

function isScriptUrl(value: string): boolean {
  const probe = stripControlChars(value ?? '').toLowerCase()
  return probe.startsWith('javascript:') || probe.startsWith('vbscript:')
}

const DANGEROUS_TAGS = new Set([
  'SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'BASE', 'META', 'LINK', 'FORM', 'NOSCRIPT',
])
const URL_ATTRS = new Set([
  'href', 'src', 'srcset', 'background', 'action', 'formaction', 'poster', 'xlink:href',
])

/**
 * In-place hardening for compiled email HTML before it's assigned via innerHTML
 * in the preview iframe. Strips script-capable tags, inline event handlers, and
 * `javascript:`/`vbscript:` URLs, while preserving table layout, styling,
 * `data:` images, and the mjed-* selection classes.
 */
export function stripDangerousHtml(root: ParentNode): void {
  for (const el of Array.from(root.querySelectorAll('*'))) {
    if (DANGEROUS_TAGS.has(el.tagName)) {
      el.remove()
      continue
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      else if (URL_ATTRS.has(name) && isScriptUrl(attr.value)) el.removeAttribute(attr.name)
    }
  }
}

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
    if (el.tagName === 'A') sanitizeAnchor(el)
  }
}

// Block javascript:-style hrefs and force rel=noopener on target=_blank links
// (reverse-tabnabbing) for user-authored inline links.
function sanitizeAnchor(el: Element) {
  const href = el.getAttribute('href')
  if (href !== null) {
    const safe = sanitizeUrl(href)
    if (safe) el.setAttribute('href', safe)
    else el.removeAttribute('href')
  }
  if (el.getAttribute('target') === '_blank') {
    const rel = new Set((el.getAttribute('rel') || '').split(/\s+/).filter(Boolean))
    rel.add('noopener')
    rel.add('noreferrer')
    el.setAttribute('rel', Array.from(rel).join(' '))
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
