export type MjmlNodeType =
  | 'mj-body'
  | 'mj-section'
  | 'mj-column'
  | 'mj-text'
  | 'mj-image'
  | 'mj-button'
  | 'mj-divider'
  | 'mj-spacer'

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
  type: 'mj-text' | 'mj-image' | 'mj-button' | 'mj-divider' | 'mj-spacer'
  content?: string
}

export type MjmlNode = ContainerNode | LeafNode

export const CONTAINER_TYPES: MjmlNodeType[] = ['mj-body', 'mj-section', 'mj-column']

export const isContainer = (n: MjmlNode): n is ContainerNode => CONTAINER_TYPES.includes(n.type)

/**
 * Attr entries with an actual value. Both exporters (serialize.ts, mjmlJson.ts)
 * drop empty-string/null attrs so the MJML and JSON output carry the same set;
 * sharing one filter keeps them from drifting apart.
 */
export const nonEmptyAttrs = (attrs: Attrs): [string, string][] =>
  Object.entries(attrs).filter(([, v]) => v !== '' && v != null)

/**
 * The head fields the editor round-trips (mj-title / mj-preview). One shared
 * shape so serialize, persistence, the store and the JSON exporter don't each
 * redeclare it (T6). Use `Partial<HeadFields>` for host-supplied input where the
 * fields may be absent.
 */
export interface HeadFields {
  title: string
  preview: string
}

export const VALID_PARENT: Record<MjmlNodeType, MjmlNodeType[]> = {
  'mj-body': [],
  'mj-section': ['mj-body'],
  'mj-column': ['mj-section'],
  'mj-text': ['mj-column'],
  'mj-image': ['mj-column'],
  'mj-button': ['mj-column'],
  'mj-divider': ['mj-column'],
  'mj-spacer': ['mj-column'],
}
