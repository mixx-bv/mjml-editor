import { describe, it, expect } from 'vitest'
import { parseMjmlString } from './mjmlJson'
import { serializeTree } from './serialize'
import { VALID_PARENT, type ContainerNode } from '../types/mjml'

// mjml-browser compiles every standard MJML tag; elements only broke because the
// editor tree dropped the ones it had no node for before re-serializing. These
// cover the fix: unknown elements + head config are now preserved verbatim.

describe('unknown-element preservation (never drop MJML)', () => {
  it('parses mj-wrapper as a first-class, editable container (not a raw blob)', () => {
    const src =
      '<mjml><mj-body><mj-wrapper background-color="#fff"><mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section></mj-wrapper></mj-body></mjml>'
    const parsed = parseMjmlString(src)!
    const body = parsed.body as ContainerNode
    expect(body.children).toHaveLength(1)

    // The wrapper is a real container; its section/column/text are selectable
    // tree nodes rather than being swallowed into one opaque passthrough blob.
    const wrapper = body.children[0] as ContainerNode
    expect(wrapper.type).toBe('mj-wrapper')
    const section = wrapper.children[0] as ContainerNode
    expect(section.type).toBe('mj-section')
    expect(section.children[0].type).toBe('mj-column')

    const out = serializeTree(parsed.body, parsed.head)
    expect(out).toContain('<mj-wrapper')
    expect(out).toContain('background-color="#fff"')
    expect(out).toContain('<mj-text>Hi</mj-text>')
  })

  it('allows a section inside both the body and a wrapper (DnD parent rules)', () => {
    expect(VALID_PARENT['mj-section']).toContain('mj-body')
    expect(VALID_PARENT['mj-section']).toContain('mj-wrapper')
    expect(VALID_PARENT['mj-wrapper']).toEqual(['mj-body'])
  })

  it('parses mj-group as a first-class container holding its columns', () => {
    const src =
      '<mjml><mj-body><mj-section><mj-group><mj-column><mj-text>A</mj-text></mj-column><mj-column><mj-text>B</mj-text></mj-column></mj-group></mj-section></mj-body></mjml>'
    const parsed = parseMjmlString(src)!
    const section = (parsed.body as ContainerNode).children[0] as ContainerNode
    const group = section.children[0] as ContainerNode
    expect(group.type).toBe('mj-group')
    expect(group.children.map((c) => c.type)).toEqual(['mj-column', 'mj-column'])

    const out = serializeTree(parsed.body, parsed.head)
    expect(out).toContain('<mj-group')
    expect(out).toContain('<mj-text>A</mj-text>')
    expect(out).toContain('<mj-text>B</mj-text>')
  })

  it('allows a column inside both a section and a group (DnD parent rules)', () => {
    expect(VALID_PARENT['mj-column']).toContain('mj-section')
    expect(VALID_PARENT['mj-column']).toContain('mj-group')
    expect(VALID_PARENT['mj-group']).toEqual(['mj-section'])
  })

  it('preserves an unknown element sitting next to a supported one, in order', () => {
    const src =
      '<mjml><mj-body><mj-section><mj-column><mj-text>Before</mj-text><mj-social><mj-social-element name="facebook" /></mj-social><mj-text>After</mj-text></mj-column></mj-section></mj-body></mjml>'
    const parsed = parseMjmlString(src)!
    const column = (parsed.body as ContainerNode).children[0] as ContainerNode
    const columnLeaf = column.children[0] as ContainerNode
    // mj-column → its children: text, passthrough (mj-social), text — order kept.
    expect(columnLeaf.children.map((c) => c.type)).toEqual(['mj-text', 'passthrough', 'mj-text'])

    const out = serializeTree(parsed.body, parsed.head)
    expect(out).toContain('<mj-social')
    expect(out.indexOf('Before')).toBeLessThan(out.indexOf('mj-social'))
    expect(out.indexOf('mj-social')).toBeLessThan(out.indexOf('After'))
  })

  it('parses mj-raw as a first-class leaf, verbatim, with an editor-only marker', () => {
    const src =
      '<mjml><mj-body><mj-section><mj-column><mj-raw><!-- keep --><span>{{ order.uuid }}</span></mj-raw></mj-column></mj-section></mj-body></mjml>'
    const parsed = parseMjmlString(src)!
    const section = (parsed.body as ContainerNode).children[0] as ContainerNode
    const column = section.children[0] as ContainerNode
    const raw = column.children[0]
    expect(raw.type).toBe('mj-raw')
    const content = 'content' in raw ? raw.content : undefined
    expect(content).toContain('{{ order.uuid }}')

    // Clean output: content verbatim, no selection marker.
    const clean = serializeTree(parsed.body, parsed.head)
    expect(clean).toContain('<!-- keep -->')
    expect(clean).toContain('{{ order.uuid }}')
    expect(clean).not.toContain('mjed-t-mj-raw')

    // Editor output: a marker <div> makes the raw block click-selectable.
    const editor = serializeTree(parsed.body, parsed.head, { includeEditorIds: true })
    expect(editor).toContain('mjed-t-mj-raw')
    expect(editor).toContain('{{ order.uuid }}')
  })

  it('lifts mj-all defaults + mj-style into structured head fields, preserving the rest', () => {
    const src =
      '<mjml><mj-head><mj-title>Subject</mj-title><mj-attributes><mj-all font-family="Arial" /><mj-text color="#555" /></mj-attributes><mj-style>.b{font-weight:bold}</mj-style></mj-head><mj-body><mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section></mj-body></mjml>'
    const parsed = parseMjmlString(src)!
    expect(parsed.head.title).toBe('Subject')
    // mj-all becomes structured global defaults...
    expect(parsed.head.attributes['font-family']).toBe('Arial')
    // ...its per-component sibling is kept verbatim to re-nest on export...
    expect(parsed.head.attributesRaw).toContain('mj-text')
    // ...and mj-style becomes the structured CSS field.
    expect(parsed.head.styles).toContain('.b{font-weight:bold}')

    const out = serializeTree(parsed.body, parsed.head)
    expect(out).toContain('<mj-title>Subject</mj-title>')
    expect(out).toContain('font-family="Arial"')
    expect(out).toContain('<mj-text color="#555"')
    expect(out).toContain('.b{font-weight:bold}')
    // Exactly one mj-attributes block — no duplication on rebuild.
    expect(out.match(/<mj-attributes>/g)?.length).toBe(1)
  })

  it('is a fixed point across a second round-trip', () => {
    const src =
      '<mjml><mj-head><mj-attributes><mj-all font-family="Arial" /></mj-attributes></mj-head><mj-body><mj-wrapper><mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section></mj-wrapper></mj-body></mjml>'
    const first = (() => {
      const p = parseMjmlString(src)!
      return serializeTree(p.body, p.head)
    })()
    const second = (() => {
      const p = parseMjmlString(first)!
      return serializeTree(p.body, p.head)
    })()
    expect(second).toBe(first)
  })
})
