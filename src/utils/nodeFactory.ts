import type { MjmlNode, MjmlNodeType, ContainerNode, LeafNode } from '../types/mjml'

let counter = 0
export const uid = (prefix = 'n') => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

/**
 * Node-type → id-prefix map. Single source shared by createNode (fresh nodes) and
 * mjmlJson.ts (ids for parsed/imported nodes) so the two can't drift apart (D4).
 */
export const ID_PREFIX: Record<MjmlNodeType, string> = {
  'mj-body': 'body',
  'mj-section': 'sec',
  'mj-column': 'col',
  'mj-text': 'txt',
  'mj-image': 'img',
  'mj-button': 'btn',
}

// Overloads so callers get the precise node kind back and no longer need an
// `as ContainerNode`/`as LeafNode` cast at every call site (T5).
export function createNode(type: 'mj-body' | 'mj-section' | 'mj-column'): ContainerNode
export function createNode(type: 'mj-text' | 'mj-image' | 'mj-button'): LeafNode
export function createNode(type: MjmlNodeType): MjmlNode
export function createNode(type: MjmlNodeType): MjmlNode {
  // Return the literal node type per branch so TypeScript infers Container/Leaf
  // structurally (a forgotten `children`/`content` would now be a type error)
  // instead of being silenced by an `as` assertion.
  switch (type) {
    case 'mj-body':
      return { id: uid(ID_PREFIX['mj-body']), type: 'mj-body', attrs: { 'background-color': '#f4f4f4' }, children: [] }
    case 'mj-section':
      return { id: uid(ID_PREFIX['mj-section']), type: 'mj-section', attrs: { 'background-color': '#ffffff', padding: '20px 0' }, children: [] }
    case 'mj-column':
      return { id: uid(ID_PREFIX['mj-column']), type: 'mj-column', attrs: {}, children: [] }
    case 'mj-text':
      return { id: uid(ID_PREFIX['mj-text']), type: 'mj-text', attrs: { 'font-size': '14px', color: '#333333', 'line-height': '1.5' }, content: 'Edit this text' }
    case 'mj-image':
      return { id: uid(ID_PREFIX['mj-image']), type: 'mj-image', attrs: { src: 'https://placehold.co/600x200?text=Image', alt: '' } }
    case 'mj-button':
      return { id: uid(ID_PREFIX['mj-button']), type: 'mj-button', attrs: { href: '#', 'background-color': '#2563eb', color: '#ffffff', 'border-radius': '4px' }, content: 'Click me' }
  }
}

export function createInitialTree(): ContainerNode {
  const body = createNode('mj-body')
  body.children.push(createLayoutSection(1))
  return body
}

export function createLayoutSection(columnCount: 1 | 2 | 3): ContainerNode {
  const section = createNode('mj-section')
  const widths = columnCount === 1 ? ['100%'] : columnCount === 2 ? ['50%', '50%'] : ['33%', '33%', '34%']
  for (let i = 0; i < columnCount; i++) {
    const column = createNode('mj-column')
    if (columnCount > 1) column.attrs = { ...column.attrs, width: widths[i] }
    const text = createNode('mj-text')
    column.children.push(text)
    section.children.push(column)
  }
  return section
}
