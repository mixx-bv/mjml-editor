import { describe, it, expect } from 'vitest'
import { sanitizeMjTextHtml, stripDangerousHtml, sanitizeUrl } from './sanitize'

// Run the compiled-email hardening the way the bridge does (parse → strip → read).
function strip(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  stripDangerousHtml(doc.body)
  return doc.body.innerHTML
}

describe('sanitizeMjTextHtml (mj-text boundary)', () => {
  it('removes <script> while keeping formatting', () => {
    const out = sanitizeMjTextHtml('<b>hi</b><script>alert(1)</script>')
    expect(out).toContain('<b>hi</b>')
    expect(out).not.toContain('<script')
  })

  it('keeps table/div/img email layout while stripping event handlers', () => {
    const out = sanitizeMjTextHtml(
      '<table role="presentation" style="border-collapse:collapse;"><tr><td onclick="bad()"><div style="color:#3129d6;">{{attendee.email}}</div></td></tr></table><img src="https://x.test/a.png" alt="">',
    )
    expect(out).toContain('<table')
    expect(out).toContain('<img')
    expect(out).toContain('{{attendee.email}}')
    expect(out).toContain('style="border-collapse:collapse;"')
    expect(out).not.toContain('onclick')
  })

  it('drops javascript: hrefs on links', () => {
    const out = sanitizeMjTextHtml('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('javascript:')
  })
})

describe('stripDangerousHtml (compiled-email boundary, S1)', () => {
  it('removes <script> tags', () => {
    expect(strip('<div>ok</div><script>bad()</script>')).not.toContain('<script')
  })

  it('removes SVG-namespaced <script> via case-insensitive tag match', () => {
    // Foreign-content tagName stays lowercase; the pre-fix uppercase set missed it.
    expect(strip('<svg><script>bad()</script></svg>')).not.toContain('bad()')
  })

  it('strips inline event handlers', () => {
    expect(strip('<td onclick="bad()">x</td>')).not.toContain('onclick')
  })

  it('drops javascript: navigational hrefs but keeps http links', () => {
    expect(strip('<a href="javascript:bad()">x</a>')).not.toContain('javascript:')
    expect(strip('<a href="https://example.com">x</a>')).toContain('https://example.com')
  })

  it('keeps data: image sources (legit inline images survive)', () => {
    expect(strip('<img src="data:image/png;base64,iVBORw0KGgo=">')).toContain('data:image/png')
  })
})

describe('sanitizeUrl', () => {
  it('blocks script and data schemes, allows http/mailto/relative', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
    expect(sanitizeUrl('data:text/html,<script>')).toBe('')
    expect(sanitizeUrl('https://x.com')).toBe('https://x.com')
    expect(sanitizeUrl('mailto:a@b.com')).toBe('mailto:a@b.com')
    expect(sanitizeUrl('/relative/path')).toBe('/relative/path')
  })
})
