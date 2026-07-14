import { describe, it, expect } from 'vitest'
import { parseMjmlString } from './mjmlJson'
import { serializeTree } from './serialize'
import { isContainer, type MjmlNode } from '../types/mjml'

function findFirst(node: MjmlNode, type: string): MjmlNode | null {
  if (node.type === type) return node
  if (isContainer(node)) {
    for (const child of node.children) {
      const hit = findFirst(child, type)
      if (hit) return hit
    }
  }
  return null
}

const wrap = (leaf: string) =>
  `<mjml><mj-body><mj-section><mj-column>${leaf}</mj-column></mj-section></mj-body></mjml>`

describe('MJML button label round-trip (M1)', () => {
  it('decodes button entities on parse so the tree holds plain text', () => {
    const parsed = parseMjmlString(wrap('<mj-button>Terms &amp; Conditions</mj-button>'))
    expect(parsed).not.toBeNull()
    const button = findFirst(parsed!.body, 'mj-button')
    expect(button?.content).toBe('Terms & Conditions')
  })

  it('is stable across parse → serialize → parse (no &amp; stacking)', () => {
    const first = serializeTree(parseMjmlString(wrap('<mj-button>Buy &amp; Save</mj-button>'))!.body)
    // Exactly one level of escaping — valid MJML, and no doubled entity.
    expect(first).toContain('Buy &amp; Save')
    expect(first).not.toContain('&amp;amp;')
    // A second round-trip must be a fixed point.
    const second = serializeTree(parseMjmlString(first)!.body)
    expect(second).toBe(first)
  })

  it('escapes < and > in button labels so the MJML stays valid', () => {
    const out = serializeTree(parseMjmlString(wrap('<mj-button>A &lt; B &gt; C</mj-button>'))!.body)
    expect(out).toContain('A &lt; B &gt; C')
  })

  it('keeps mj-text inline formatting through a round-trip', () => {
    const out = serializeTree(parseMjmlString(wrap('<mj-text>Hello <b>world</b></mj-text>'))!.body)
    expect(out).toContain('Hello <b>world</b>')
  })
})
