import type { MjmlNode, MjmlNodeType } from '../types/mjml'

/**
 * Human labels for node types. Shared by the properties panel and the selection
 * toolbar / delete confirmations so the naming can't drift between surfaces.
 */
export const NODE_LABELS: Record<MjmlNodeType, string> = {
  'mj-body': 'Body',
  'mj-wrapper': 'Wrapper',
  'mj-section': 'Section',
  'mj-group': 'Group',
  'mj-column': 'Column',
  'mj-text': 'Text',
  'mj-image': 'Image',
  'mj-button': 'Button',
  'mj-divider': 'Divider',
  'mj-spacer': 'Spacer',
  'mj-raw': 'Raw HTML',
}

/**
 * Label for any node, including a preserved passthrough element (which has no
 * entry in NODE_LABELS) — falls back to its original tag name.
 */
export function nodeLabel(node: MjmlNode): string {
  return node.type === 'passthrough' ? node.tag : NODE_LABELS[node.type]
}
