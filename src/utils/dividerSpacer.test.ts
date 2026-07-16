import { describe, it, expect } from 'vitest'
import { parseMjmlString } from './mjmlJson'
import { serializeTree } from './serialize'
import { compileMjml } from './compileMjml'
import { createNode } from './nodeFactory'
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

const wrapNode = (leaf: string) =>
  `<mjml><mj-body><mj-section><mj-column>${leaf}</mj-column></mj-section></mj-body></mjml>`

describe('divider + spacer blocks', () => {
  it('createNode produces attribute-only leaf nodes with sensible defaults', () => {
    const divider = createNode('mj-divider')
    expect(divider.type).toBe('mj-divider')
    expect(divider.attrs['border-color']).toBe('#cccccc')

    const spacer = createNode('mj-spacer')
    expect(spacer.type).toBe('mj-spacer')
    expect(spacer.attrs.height).toBe('20px')
  })

  it('round-trips a self-closing divider through parse → serialize with attrs intact', () => {
    const parsed = parseMjmlString(
      wrapNode('<mj-divider border-color="#ff0000" border-width="2px" />'),
    )!
    const divider = findFirst(parsed.body, 'mj-divider')
    expect(divider).not.toBeNull()
    expect(divider!.attrs['border-color']).toBe('#ff0000')
    expect(divider!.attrs['border-width']).toBe('2px')

    // A second pass over the re-serialized output is a fixed point.
    const reparsed = parseMjmlString(serializeTree(parsed.body))!
    expect(findFirst(reparsed.body, 'mj-divider')?.attrs['border-color']).toBe('#ff0000')
  })

  it('round-trips a spacer with its height', () => {
    const parsed = parseMjmlString(wrapNode('<mj-spacer height="40px" />'))!
    expect(findFirst(parsed.body, 'mj-spacer')?.attrs.height).toBe('40px')
    expect(serializeTree(parsed.body)).toContain('<mj-spacer height="40px">')
  })

  it('compiles divider + spacer to email HTML without errors', async () => {
    const { html, error } = await compileMjml(
      wrapNode('<mj-divider border-color="#ff0000" /><mj-spacer height="40px" />'),
    )
    expect(error).toBeNull()
    expect(html).toContain('40px') // spacer height rendered
    expect(html.toLowerCase()).toContain('border-top') // divider line rendered
  })
})
