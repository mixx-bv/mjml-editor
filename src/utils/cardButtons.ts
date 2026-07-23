import { sanitizeMjTextHtml } from './sanitize'

// Imported email templates routinely pack a whole "card" — heading, paragraphs and
// one or more call-to-action buttons — into a SINGLE mj-text block as raw HTML with
// nested tables. The editor keeps that card as one block so its styling stays byte
// for byte identical, but a user still needs to remove an individual button. These
// helpers operate on the stored HTML, so everything except the removed button is
// left untouched.

// Parse an inline `style="a:b;c:d"` attribute into a lowercase-keyed map.
function styleMap(el: Element): Record<string, string> {
  const out: Record<string, string> = {}
  const raw = el.getAttribute('style') || ''
  for (const decl of raw.split(';')) {
    const i = decl.indexOf(':')
    if (i === -1) continue
    const key = decl.slice(0, i).trim().toLowerCase()
    if (key) out[key] = decl.slice(i + 1).trim()
  }
  return out
}

// Collapse whitespace so a button label reads clean and a wrapper's text can be
// compared to its anchor's.
function norm(s: string | null): string {
  return (s || '').replace(/\s+/g, ' ').trim()
}

// A call-to-action anchor. Email/MJML buttons render as `display:inline-block`
// links, usually padded and sitting on a background-coloured cell — either signal
// identifies one, so a plain in-text link (no padding/background) is NOT treated as
// a button.
function isButtonAnchor(el: Element): boolean {
  if (el.tagName !== 'A') return false
  const s = styleMap(el)
  if ((s['display'] || '').includes('inline-block')) return true
  const td = el.closest('td')
  const tdStyle = td ? styleMap(td) : {}
  const bg =
    s['background-color'] || s['background'] || td?.getAttribute('bgcolor') || tdStyle['background-color'] || tdStyle['background']
  return !!bg && !!s['padding']
}

function buttonAnchors(root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll('a')).filter(isButtonAnchor)
}

// The whole clickable "button unit" to remove: climb from the anchor to the highest
// ancestor whose text is still ONLY this button's label. That takes the button's box
// (its wrapping <table>/<div>) with it — and, when the button owned its whole table
// row, the empty row too — while stopping as soon as an ancestor also holds other
// content (sibling text, another button). An unlabelled (icon-only) button can't be
// disambiguated this way, so it removes just the anchor.
function buttonUnit(anchor: Element): Element {
  const label = norm(anchor.textContent)
  let el: Element = anchor
  while (label !== '' && el.parentElement && norm(el.parentElement.textContent) === label) {
    el = el.parentElement
  }
  return el
}

/**
 * Labels of the buttons found inside a card mj-text, in document order. The index
 * of a label is the index removeCardButtonHtml expects. Empty when the block holds
 * no buttons (so the caller shows nothing).
 */
export function listCardButtons(html: string): string[] {
  const tmpl = document.createElement('template')
  tmpl.innerHTML = html
  return buttonAnchors(tmpl.content).map((a) => norm(a.textContent) || 'Button')
}

/**
 * Remove the index-th button from a card mj-text's HTML, returning the new HTML with
 * everything else byte-for-byte intact (sanitized at the mj-text boundary, same as
 * import). Returns null — a no-op for the caller — when the index is out of range.
 */
export function removeCardButtonHtml(html: string, index: number): string | null {
  const tmpl = document.createElement('template')
  tmpl.innerHTML = html
  const anchor = buttonAnchors(tmpl.content)[index]
  if (!anchor) return null
  buttonUnit(anchor).remove()
  return sanitizeMjTextHtml(tmpl.innerHTML.trim())
}
