import { describe, it, expect, vi, afterEach } from 'vitest'
import { nextTick, reactive } from 'vue'
import { useDocumentCompiler } from './useDocumentCompiler'

type FakeStore = {
  editorMjml: string
  mjmlString: string
  mjmlJson: unknown
}

const makeStore = (over: Partial<FakeStore> = {}): FakeStore =>
  reactive({
    editorMjml: '<mjml><mj-body></mj-body></mjml>',
    mjmlString: '<mjml><mj-body></mj-body></mjml>',
    mjmlJson: { tagName: 'mjml', children: [] },
    ...over,
  })

afterEach(() => {
  vi.useRealTimers()
})

describe('useDocumentCompiler', () => {
  it('snapshots a consistent triple and strips markers from emailHtml', async () => {
    vi.useFakeTimers()
    const store = makeStore()
    const compile = vi.fn(async (mjml: string) => ({
      html: `<div class="box mjed-sec-a1b2-c3d4 mjed-t-mj-section">${mjml}</div>`,
      error: null,
    }))

    const { snapshot } = useDocumentCompiler(store as never, 250, compile)

    store.editorMjml = '<editor/>'
    store.mjmlString = '<clean/>'
    store.mjmlJson = { tagName: 'mjml', children: [{ id: 1 }] }
    await nextTick()
    await vi.runAllTimersAsync()

    expect(compile).toHaveBeenLastCalledWith('<editor/>')
    expect(snapshot.value).toEqual({
      mjml: '<clean/>',
      json: { tagName: 'mjml', children: [{ id: 1 }] },
      editorHtml: '<div class="box mjed-sec-a1b2-c3d4 mjed-t-mj-section"><editor/></div>',
      emailHtml: '<div class="box"><editor/></div>',
      error: null,
    })
  })

  it('coalesces a burst of edits into a single compile of the latest source', async () => {
    vi.useFakeTimers()
    const store = makeStore()
    const compile = vi.fn(async () => ({ html: '<i>ok</i>', error: null }))

    useDocumentCompiler(store as never, 250, compile)
    await vi.runAllTimersAsync()
    compile.mockClear()

    store.editorMjml = 'A'
    await nextTick()
    store.editorMjml = 'B'
    await nextTick()
    store.editorMjml = 'C'
    await nextTick()
    await vi.runAllTimersAsync()

    expect(compile).toHaveBeenCalledTimes(1)
    expect(compile).toHaveBeenCalledWith('C')
  })

  it('keeps the last good preview but emits empty emailHtml when a compile fails', async () => {
    vi.useFakeTimers()
    const store = makeStore()
    const compile = vi
      .fn<(mjml: string) => Promise<{ html: string; error: string | null }>>()
      .mockResolvedValueOnce({ html: '<i>good</i>', error: null })
      .mockResolvedValueOnce({ html: '', error: 'boom' })

    const { snapshot } = useDocumentCompiler(store as never, 250, compile)
    await vi.runAllTimersAsync()
    expect(snapshot.value?.editorHtml).toBe('<i>good</i>')

    store.editorMjml = '<broken/>'
    await nextTick()
    await vi.runAllTimersAsync()

    // Preview keeps the last good HTML; the host is told nothing renders (L1).
    expect(snapshot.value?.editorHtml).toBe('<i>good</i>')
    expect(snapshot.value?.emailHtml).toBe('')
    expect(snapshot.value?.error).toBe('boom')
  })
})
