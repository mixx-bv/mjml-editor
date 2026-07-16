import type { MjmlNodeType } from '../types/mjml'

/**
 * Human labels for node types. Shared by the properties panel and the selection
 * toolbar / delete confirmations so the naming can't drift between surfaces.
 */
export const NODE_LABELS: Record<MjmlNodeType, string> = {
  'mj-body': 'Body',
  'mj-section': 'Section',
  'mj-column': 'Column',
  'mj-text': 'Text',
  'mj-image': 'Image',
  'mj-button': 'Button',
  'mj-divider': 'Divider',
  'mj-spacer': 'Spacer',
}
