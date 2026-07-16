import { describe, it, expect } from 'vitest'
import { cloneNode, createLayoutSection, createNode } from './nodeFactory'
import { isContainer, type MjmlNode } from '../types/mjml'

function collectIds(node: MjmlNode, out: string[] = []): string[] {
  out.push(node.id)
  if (isContainer(node)) node.children.forEach((c) => collectIds(c, out))
  return out
}

function firstLeaf(node: MjmlNode): MjmlNode {
  return isContainer(node) ? firstLeaf(node.children[0]) : node
}

describe('cloneNode', () => {
  it('assigns a fresh, unique id to every node in the subtree', () => {
    const section = createLayoutSection(2) // section > 2 columns > text each
    const copy = cloneNode(section)

    const origIds = collectIds(section)
    const copyIds = collectIds(copy)

    expect(copyIds).toHaveLength(origIds.length)
    // No id is shared between the original and its clone.
    expect(copyIds.filter((id) => origIds.includes(id))).toEqual([])
    // Clone ids are internally unique too.
    expect(new Set(copyIds).size).toBe(copyIds.length)
  })

  it('copies attrs by value so mutating the clone leaves the original untouched', () => {
    const image = createNode('mj-image')
    const copy = cloneNode(image)
    copy.attrs.src = 'https://example.com/other.png'
    expect(image.attrs.src).not.toBe('https://example.com/other.png')
  })

  it('deep-copies nested content independently', () => {
    const section = createLayoutSection(1) // section > column > text
    const copy = cloneNode(section)
    const copyText = firstLeaf(copy) as { content?: string }
    copyText.content = 'changed'
    const origText = firstLeaf(section) as { content?: string }
    expect(origText.content).not.toBe('changed')
  })
})
