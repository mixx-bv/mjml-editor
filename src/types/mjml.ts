export type MjmlNodeType =
  | 'mj-body'
  | 'mj-wrapper'
  | 'mj-section'
  | 'mj-group'
  | 'mj-column'
  | 'mj-text'
  | 'mj-image'
  | 'mj-button'
  | 'mj-divider'
  | 'mj-spacer'
  | 'mj-raw'

export type Attrs = Record<string, string>

export interface BaseNode {
  id: string
  type: MjmlNodeType
  attrs: Attrs
}

export interface ContainerNode extends BaseNode {
  type: 'mj-body' | 'mj-wrapper' | 'mj-section' | 'mj-group' | 'mj-column'
  children: MjmlNode[]
}

export interface LeafNode extends BaseNode {
  type: 'mj-text' | 'mj-image' | 'mj-button' | 'mj-divider' | 'mj-spacer' | 'mj-raw'
  content?: string
}

/**
 * A verbatim-preserved element the editor has no first-class node for yet
 * (mj-wrapper, mj-raw, mj-social, mj-table, …). Captured straight from its
 * original `outerHTML` and re-serialized untouched, so unknown MJML is never
 * dropped on load: it still compiles and renders through mjml-browser, it just
 * isn't block-editable until a dedicated node type lands for it.
 */
export interface PassthroughNode {
  id: string
  type: 'passthrough'
  tag: string
  raw: string
}

export type MjmlNode = ContainerNode | LeafNode | PassthroughNode

export const CONTAINER_TYPES: MjmlNodeType[] = ['mj-body', 'mj-wrapper', 'mj-section', 'mj-group', 'mj-column']

export const isContainer = (n: MjmlNode): n is ContainerNode =>
  CONTAINER_TYPES.includes(n.type as MjmlNodeType)

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
  /** Global defaults from `<mj-attributes><mj-all …>` (font, size, color, …). */
  attributes: Record<string, string>
  /**
   * Other `<mj-attributes>` children (per-component defaults like
   * `<mj-text color="…" />`), kept verbatim and re-nested next to `<mj-all>` so a
   * single `<mj-attributes>` block is rebuilt without duplication.
   */
  attributesRaw: string
  /** Custom CSS from the first `<mj-style>` block. */
  styles: string
  /**
   * Everything else inside <mj-head> (mj-font, mj-breakpoint, extra
   * mj-style/mj-attributes blocks), kept verbatim so nothing is dropped.
   */
  rawExtra: string
}

export const VALID_PARENT: Record<MjmlNodeType, MjmlNodeType[]> = {
  'mj-body': [],
  // A wrapper groups sections and only lives directly in the body (MJML forbids
  // nesting a wrapper in a wrapper); a section may now sit in either.
  'mj-wrapper': ['mj-body'],
  'mj-section': ['mj-body', 'mj-wrapper'],
  // A group keeps its columns side-by-side; it lives in a section, and a column
  // may now sit directly in a section or inside a group.
  'mj-group': ['mj-section'],
  'mj-column': ['mj-section', 'mj-group'],
  'mj-text': ['mj-column'],
  'mj-image': ['mj-column'],
  'mj-button': ['mj-column'],
  'mj-divider': ['mj-column'],
  'mj-spacer': ['mj-column'],
  // Raw HTML is valid at several levels in MJML; allow the ones real templates
  // use (directly in the body, or inside a section/column).
  'mj-raw': ['mj-body', 'mj-section', 'mj-column'],
}
