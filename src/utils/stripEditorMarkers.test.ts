import { describe, it, expect } from 'vitest'
import { stripEditorMarkers } from './stripEditorMarkers'

// The canvas compiles MJML tagged with `css-class="mjed-<id> mjed-t-<type>"`
// markers (serialize.ts includeEditorIds). Those must never reach the stored /
// sent email body, so the change-emit strips them from the shared compile output
// (review P2). This pins that the strip removes every marker and nothing else.
describe('stripEditorMarkers', () => {
  it('removes mjed-* tokens but keeps real classes', () => {
    const html = '<td class="foo mjed-col-a1b2-c3d4 bar mjed-t-mj-column">x</td>'
    expect(stripEditorMarkers(html)).toBe('<td class="foo bar">x</td>')
  })

  it('drops the class attribute entirely when only markers remain', () => {
    const html = '<div class="mjed-sec-a1b2-c3d4 mjed-t-mj-section">x</div>'
    expect(stripEditorMarkers(html)).toBe('<div>x</div>')
  })

  it('leaves markup without a class attribute untouched', () => {
    const html = '<a href="{{ order_edit_url(order.id) }}">Wijzig</a>'
    expect(stripEditorMarkers(html)).toBe(html)
  })

  it('strips markers across a multi-element document', () => {
    const html =
      '<body class="mjed-bod-x1y2-z3w4 mjed-t-mj-body">' +
      '<table class="mjed-sec-a1b2-c3d4 mjed-t-mj-section wrap"><tr>' +
      '<td class="mjed-col-e5f6-g7h8 mjed-t-mj-column">hi</td>' +
      '</tr></table></body>'
    const out = stripEditorMarkers(html)
    expect(out).not.toContain('mjed-')
    expect(out).toContain('<table class="wrap">')
    expect(out).toContain('<td>hi</td>')
    expect(out).toContain('<body>')
  })

  it('never touches non-class occurrences of the token text', () => {
    const html = '<p>the mjed-col-a1b2-c3d4 marker is documented here</p>'
    expect(stripEditorMarkers(html)).toBe(html)
  })
})
