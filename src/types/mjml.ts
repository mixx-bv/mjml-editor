export type MjmlNodeType =
  | 'mj-body'
  | 'mj-section'
  | 'mj-column'
  | 'mj-text'
  | 'mj-image'
  | 'mj-button'

export type Attrs = Record<string, string>

export interface BaseNode {
  id: string
  type: MjmlNodeType
  attrs: Attrs
}

export interface ContainerNode extends BaseNode {
  type: 'mj-body' | 'mj-section' | 'mj-column'
  children: MjmlNode[]
}

export interface LeafNode extends BaseNode {
  type: 'mj-text' | 'mj-image' | 'mj-button'
  content?: string
}

export type MjmlNode = ContainerNode | LeafNode

export const isContainer = (n: MjmlNode): n is ContainerNode =>
  n.type === 'mj-body' || n.type === 'mj-section' || n.type === 'mj-column'

export const LEAF_TYPES: MjmlNodeType[] = ['mj-text', 'mj-image', 'mj-button']

export const VALID_PARENT: Record<MjmlNodeType, MjmlNodeType[]> = {
  'mj-body': [],
  'mj-section': ['mj-body'],
  'mj-column': ['mj-section'],
  'mj-text': ['mj-column'],
  'mj-image': ['mj-column'],
  'mj-button': ['mj-column'],
}
