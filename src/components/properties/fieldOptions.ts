// Shared select-option lists for the property editors so the same choice set
// isn't re-typed inline across ButtonProps/TextProps (D3). Text adds a couple of
// extra values on top of the button baseline, so the lists compose rather than
// duplicate.

export interface FieldOption {
  value: string
  label: string
}

export const ALIGN_OPTIONS: FieldOption[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

/** Align choices for mj-text, which also supports justified text. */
export const TEXT_ALIGN_OPTIONS: FieldOption[] = [
  ...ALIGN_OPTIONS,
  { value: 'justify', label: 'Justify' },
]

export const WEIGHT_OPTIONS: FieldOption[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Bold' },
]

/** Weight choices for mj-text, which exposes the numeric weights too. */
export const TEXT_WEIGHT_OPTIONS: FieldOption[] = [
  ...WEIGHT_OPTIONS,
  { value: '300', label: '300' },
  { value: '500', label: '500' },
  { value: '600', label: '600' },
  { value: '700', label: '700' },
]

/**
 * Email-safe font stacks — web-safe families that render across Outlook/Gmail/
 * Apple Mail without an @font-face download. `value` is the full fallback stack
 * written to the font-family attribute; `label` is the friendly name shown (and
 * previewed in that font) in the picker.
 */
export const FONT_FAMILY_OPTIONS: FieldOption[] = [
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: "'Trebuchet MS', Helvetica, sans-serif", label: 'Trebuchet MS' },
  { value: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif", label: 'Lucida Sans' },
  { value: "Georgia, 'Times New Roman', serif", label: 'Georgia' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", label: 'Palatino' },
  { value: "Garamond, 'Times New Roman', serif", label: 'Garamond' },
  { value: "'Courier New', Courier, monospace", label: 'Courier New' },
]
