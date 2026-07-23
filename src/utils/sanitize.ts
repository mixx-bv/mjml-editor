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
// Navigational URLs go through the strict allowlist (also blocks `data:` and
// `vbscript:`); media URLs keep `data:` so inline data:-image sources survive but
// still drop script schemes (S1).
const NAV_URL_ATTRS = new Set(['href', 'action', 'formaction', 'xlink:href'])
const MEDIA_URL_ATTRS = new Set(['src', 'srcset', 'background', 'poster'])

/**
 * In-place hardening for compiled email HTML before it's assigned via innerHTML
 * in the preview iframe. Strips script-capable tags, inline event handlers, and
 * dangerous URL schemes, while preserving table layout, styling, `data:` images,
 * and the mjed-* selection classes. Deliberately NOT a tag allowlist: the input
 * is full mjml2html output including Outlook VML fallbacks, which a drop-unknown
 * allowlist would destroy.
 */
export function stripDangerousHtml(root: ParentNode): void {
  for (const el of Array.from(root.querySelectorAll('*'))) {
    // Foreign-content tags (SVG/MathML) keep their original lowercase name, so an
    // <svg><script> would slip past the uppercase set — compare upper-cased (S1).
    if (DANGEROUS_TAGS.has(el.tagName.toUpperCase())) {
      el.remove()
      continue
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name)
      } else if (NAV_URL_ATTRS.has(name)) {
        if (attr.value && !sanitizeUrl(attr.value)) el.removeAttribute(attr.name)
      } else if (MEDIA_URL_ATTRS.has(name) && isScriptUrl(attr.value)) {
        el.removeAttribute(attr.name)
      }
    }
  }
}

/**
 * Sanitize the inline HTML stored for an mj-text node. Shares ONE policy with the
 * compiled-email boundary (stripDangerousHtml): a denylist that removes
 * script-capable tags, inline event handlers and dangerous URL schemes, while
 * KEEPING the table/div/img layout and inline styles that real email templates
 * routinely nest inside mj-text. This deliberately replaces an earlier strict tag
 * allowlist, which flattened those templates to plain text on import (C2). The
 * privileged preview iframe re-runs stripDangerousHtml on the compiled output, so
 * this boundary is defense-in-depth, not the sole XSS gate.
 */
export function sanitizeMjTextHtml(html: string): string {
  const tmpl = document.createElement('template')
  tmpl.innerHTML = html
  stripDangerousHtml(tmpl.content)
  return tmpl.innerHTML.trim()
}

/**
 * Convert <p>…</p> blocks to <br>-joined inline content. Preserves <ul>/<ol>
 * and other block siblings. An empty paragraph becomes an extra <br>.
 *
 * ⚠️ MUST STAY SELF-CONTAINED — DO NOT add imports, module-scope constants, or
 * helper calls here. This function is stringified via `.toString()` and injected
 * verbatim into the sandboxed preview iframe (utils/bridgeSrcdoc.ts), which has no
 * module system. It may reference only DOM globals; anything else silently breaks
 * inline text-editing at runtime (A3/T7).
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
