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
