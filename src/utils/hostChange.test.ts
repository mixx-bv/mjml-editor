import { describe, it, expect } from 'vitest'
import { nextHostChange, type DocumentSnapshot } from './hostChange'
import type { MjmlJsonDocument } from './mjmlJson'

const json = { tagName: 'mjml', children: [] } as unknown as MjmlJsonDocument

const snapshot = (over: Partial<DocumentSnapshot> = {}): DocumentSnapshot => ({
  mjml: '<mjml>edited</mjml>',
  json,
  editorHtml: '<div class="mjed-x">e</div>',
  emailHtml: '<div>e</div>',
  error: null,
  ...over,
})

describe('nextHostChange', () => {
  it('returns null when there is no snapshot yet', () => {
    expect(nextHostChange(null, '<mjml>anything</mjml>')).toBeNull()
  })

  it('returns null for a transient uncompilable source (empty emailHtml) — keeps the host triple (L1)', () => {
    expect(nextHostChange(snapshot({ emailHtml: '' }), '<mjml>old</mjml>')).toBeNull()
  })

  it('returns null when the document equals what the host already holds (M1 — no write-on-load)', () => {
    const loaded = '<mjml>edited</mjml>'
    expect(nextHostChange(snapshot({ mjml: loaded }), loaded)).toBeNull()
  })

  it('emits the {mjml, html, json} triple when the document actually changed', () => {
    expect(nextHostChange(snapshot(), '<mjml>previous</mjml>')).toEqual({
      mjml: '<mjml>edited</mjml>',
      html: '<div>e</div>',
      json,
    })
  })
})
