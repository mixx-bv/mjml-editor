import { onMounted, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { editorClass } from '../utils/mjedMarker'
import { sanitizeInlineHtml, flattenParagraphs, stripDangerousHtml } from '../utils/sanitize'
import type { useEditorStore } from '../stores/editor'

type EditorStore = ReturnType<typeof useEditorStore>

/**
 * Parent side of the preview-iframe message protocol: hands compiled HTML into
 * the iframe (`mjed:render`), relays selection highlight and drag state, and
 * receives select / inline text-edit events back. Sanitizes compiled HTML before
 * it crosses into the iframe (C2) and inbound edits before they reach the store.
 */
export function useCanvasBridge(
  iframeRef: Ref<HTMLIFrameElement | null>,
  store: EditorStore,
  compiledHtml: Ref<string>,
  dragActive: Ref<boolean>,
) {
  const iframeReady = ref(false)

  function extractRender(html: string): { styles: string; bodyHTML: string; bodyClass: string } {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const styleNodes = Array.from(doc.head.querySelectorAll('style'))
    const styles = styleNodes.map((s) => s.textContent || '').join('\n')
    const bodyClassBase = doc.body.className || ''
    const bodyClass = `${bodyClassBase} ${editorClass(store.tree.id, 'mj-body')}`.trim()
    // bodyHTML is assigned via innerHTML in an allow-same-origin iframe, so strip
    // script-capable markup before it can run in the host origin (C2).
    stripDangerousHtml(doc.body)
    return { styles, bodyHTML: doc.body.innerHTML, bodyClass }
  }

  function postToIframe(msg: unknown) {
    iframeRef.value?.contentWindow?.postMessage(msg, '*')
  }

  function render() {
    if (!iframeReady.value || !compiledHtml.value) return
    postToIframe({ type: 'mjed:render', ...extractRender(compiledHtml.value) })
    postToIframe({ type: 'mjed:highlight', id: store.selectedId })
  }

  function onMessage(e: MessageEvent) {
    // Only trust messages from our own preview iframe (M12).
    if (e.source !== iframeRef.value?.contentWindow) return
    const data = e.data
    if (!data) return
    if (data.type === 'mjed:ready') {
      iframeReady.value = true
      render()
    } else if (data.type === 'mjed:select') {
      store.select(data.id)
    } else if (data.type === 'mjed:text-edit') {
      store.beginEdit()
      store.updateContent(data.id, sanitizeInlineHtml(flattenParagraphs(data.content)))
    }
  }

  onMounted(() => window.addEventListener('message', onMessage))
  onBeforeUnmount(() => window.removeEventListener('message', onMessage))

  watch(compiledHtml, render)
  watch(
    () => store.selectedId,
    (id) => postToIframe({ type: 'mjed:highlight', id }),
  )
  watch(dragActive, (active) => postToIframe({ type: 'mjed:drag-state', dragging: active }))

  return { iframeReady }
}
