export interface CaretInsertResult {
  value: string
  caret: number
}

/**
 * Splice `token` into `current` at the [start, end] selection, returning the new
 * string plus the caret position just after the inserted token. When `start` is
 * null (the input element is unreachable) it appends. Pure — the caller applies
 * the value and restores the caret — so it is trivially unit-testable.
 */
export function insertAtCaret(
  current: string,
  token: string,
  start: number | null,
  end: number | null,
): CaretInsertResult {
  if (start == null) {
    const value = current + token
    return { value, caret: value.length }
  }
  const e = end ?? start
  const value = current.slice(0, start) + token + current.slice(e)
  return { value, caret: start + token.length }
}
