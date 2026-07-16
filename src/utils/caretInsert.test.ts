import { describe, it, expect } from 'vitest'
import { insertAtCaret } from './caretInsert'

describe('insertAtCaret', () => {
  it('inserts at the caret and reports the position just after the token', () => {
    expect(insertAtCaret('Hallo ', '{{ naam }}', 6, 6)).toEqual({
      value: 'Hallo {{ naam }}',
      caret: 16,
    })
  })

  it('replaces the current selection', () => {
    expect(insertAtCaret('Hi X', '{{ n }}', 3, 4)).toEqual({ value: 'Hi {{ n }}', caret: 10 })
  })

  it('appends when there is no reachable caret (start null)', () => {
    expect(insertAtCaret('abc', '{{ x }}', null, null)).toEqual({ value: 'abc{{ x }}', caret: 10 })
  })

  it('treats a missing end as a collapsed caret', () => {
    expect(insertAtCaret('ab', 'Z', 1, null)).toEqual({ value: 'aZb', caret: 2 })
  })
})
