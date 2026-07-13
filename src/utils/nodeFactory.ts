import type { MjmlNode, MjmlNodeType, ContainerNode, LeafNode } from '../types/mjml'

let counter = 0
export const uid = (prefix = 'n') => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

export function createNode(type: MjmlNodeType): MjmlNode {
  // Return the literal node type per branch so TypeScript infers Container/Leaf
  // structurally (a forgotten `children`/`content` would now be a type error)
  // instead of being silenced by an `as` assertion.
  switch (type) {
    case 'mj-body':
      return { id: uid('body'), type: 'mj-body', attrs: { 'background-color': '#f4f4f4' }, children: [] }
    case 'mj-section':
      return { id: uid('sec'), type: 'mj-section', attrs: { 'background-color': '#ffffff', padding: '20px 0' }, children: [] }
    case 'mj-column':
      return { id: uid('col'), type: 'mj-column', attrs: {}, children: [] }
    case 'mj-text':
      return { id: uid('txt'), type: 'mj-text', attrs: { 'font-size': '14px', color: '#333333', 'line-height': '1.5' }, content: 'Edit this text' }
    case 'mj-image':
      return { id: uid('img'), type: 'mj-image', attrs: { src: 'https://placehold.co/600x200?text=Image', alt: '' } }
    case 'mj-button':
      return { id: uid('btn'), type: 'mj-button', attrs: { href: '#', 'background-color': '#2563eb', color: '#ffffff', 'border-radius': '4px' }, content: 'Click me' }
  }
}

export function createInitialTree(): ContainerNode {
  const body = createNode('mj-body') as ContainerNode
  body.children.push(createLayoutSection(1))
  return body
}

export function createLayoutSection(columnCount: 1 | 2 | 3): ContainerNode {
  const section = createNode('mj-section') as ContainerNode
  const widths = columnCount === 1 ? ['100%'] : columnCount === 2 ? ['50%', '50%'] : ['33%', '33%', '34%']
  for (let i = 0; i < columnCount; i++) {
    const column = createNode('mj-column') as ContainerNode
    if (columnCount > 1) column.attrs = { ...column.attrs, width: widths[i] }
    const text = createNode('mj-text') as LeafNode
    column.children.push(text)
    section.children.push(column)
  }
  return section
}
