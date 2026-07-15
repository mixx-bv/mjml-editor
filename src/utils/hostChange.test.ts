import { describe, it, expect } from 'vitest'
import { shouldEmitChange } from './hostChange'

describe('shouldEmitChange', () => {
  it('does not emit a transient uncompilable source (empty html) — keeps the host triple (L1)', () => {
    expect(shouldEmitChange('<mjml>edited</mjml>', '', '<mjml>old</mjml>')).toBe(false)
  })

  it('does not emit a document the host already holds — no write-on-load (M1)', () => {
    const loaded = '<mjml>edited</mjml>'
    expect(shouldEmitChange(loaded, '<html>x</html>', loaded)).toBe(false)
  })

  it('emits when the document actually changed and compiled', () => {
    expect(shouldEmitChange('<mjml>new</mjml>', '<html>x</html>', '<mjml>old</mjml>')).toBe(true)
  })
})
