import { ref, watch } from 'vue'
import { compileMjml as defaultCompile } from '../utils/compileMjml'
import { stripEditorMarkers } from '../utils/stripEditorMarkers'
import type { DocumentSnapshot } from '../utils/hostChange'
import type { useEditorStore } from '../stores/editor'

type EditorStore = ReturnType<typeof useEditorStore>
type Compile = (mjml: string) => Promise<{ html: string; error: string | null }>

/**
 * Single debounced, sequence-guarded MJML compile shared by the canvas preview
 * and the host change-emit, so a visual edit runs mjml2html once instead of twice
 * (review P2). It compiles the marker-tagged `editorMjml` the canvas needs, then
 * derives the clean `emailHtml` for the host by stripping those markers — and
 * snapshots the matching `mjml`/`json` at compile time so all fields describe one
 * document. `compile` is injectable for tests.
 */
export function useDocumentCompiler(
  store: EditorStore,
  delay = 250,
  compile: Compile = defaultCompile,
) {
  const snapshot = ref<DocumentSnapshot | null>(null)
  let seq = 0
  let timer: number | undefined
  let lastEditorHtml = ''

  watch(
    () => store.editorMjml,
    () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(async () => {
        const mine = ++seq
        // Snapshot the source triple before the async compile so a newer edit
        // can't desync mjml/json from the html we are about to produce.
        const mjml = store.mjmlString
        const json = store.mjmlJson
        const editorMjml = store.editorMjml
        const { html, error } = await compile(editorMjml)
        if (mine !== seq) {
          return
        }
        // Keep the last good marked HTML so a transient error never blanks the
        // canvas preview (mirrors the previous useMjmlCompiler behaviour).
        if (html) {
          lastEditorHtml = html
        }
        snapshot.value = {
          mjml,
          json,
          editorHtml: lastEditorHtml,
          emailHtml: html ? stripEditorMarkers(html) : '',
          error,
        }
      }, delay)
    },
    { immediate: true },
  )

  return { snapshot }
}
