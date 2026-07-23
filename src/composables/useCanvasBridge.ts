import { onMounted, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { editorClass } from '../utils/mjedMarker'
import { sanitizeMjTextHtml, flattenParagraphs, stripDangerousHtml } from '../utils/sanitize'
import { MJED, type BridgeInbound, type BridgeOutbound } from '../types/bridge'
import { useUiStore } from '../stores/ui'
import type { useEditorStore } from '../stores/editor'

type EditorStore = ReturnType<typeof useEditorStore>

// The srcdoc iframe runs allow-same-origin, so it shares the host page's origin;
// target that instead of the '*' wildcard when handing document HTML across (S2).
const IFRAME_ORIGIN = window.location.origin

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
  const ui = useUiStore()

  function extractRender(html: string): { styles: string; bodyStyle: string; bodyHTML: string; bodyClass: string } {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const styleNodes = Array.from(doc.head.querySelectorAll('style'))
    const styles = styleNodes.map((s) => s.textContent || '').join('\n')
    const bodyClassBase = doc.body.className || ''
    const bodyClass = `${bodyClassBase} ${editorClass(store.tree.id, 'mj-body')}`.trim()
    // mjml puts `mj-body background-color` (and word-spacing) on the compiled
    // <body>'s inline style, not in a <style> rule — carry it across too so the
    // canvas shows the email background, matching the full-document source preview
    // instead of falling back to the iframe's white default.
    const bodyStyle = doc.body.getAttribute('style') || ''
    // bodyHTML is assigned via innerHTML in an allow-same-origin iframe, so strip
    // script-capable markup before it can run in the host origin (C2).
    stripDangerousHtml(doc.body)
    return { styles, bodyStyle, bodyHTML: doc.body.innerHTML, bodyClass }
  }

  function postToIframe(msg: BridgeOutbound) {
    iframeRef.value?.contentWindow?.postMessage(msg, IFRAME_ORIGIN)
  }

  function render() {
    if (!iframeReady.value || !compiledHtml.value) return
    postToIframe({ type: MJED.render, ...extractRender(compiledHtml.value) })
    postToIframe({ type: MJED.highlight, id: store.selectedId })
  }

  function onMessage(e: MessageEvent) {
    // Only trust messages from our own preview iframe (M12).
    if (e.source !== iframeRef.value?.contentWindow) return
    const data = e.data as BridgeInbound | undefined
    if (!data) return
    if (data.type === MJED.ready) {
      iframeReady.value = true
      render()
    } else if (data.type === MJED.select) {
      store.select(data.id)
    } else if (data.type === MJED.textEdit) {
      store.beginEdit()
      store.updateContent(data.id, sanitizeMjTextHtml(flattenParagraphs(data.content)))
    } else if (data.type === MJED.editState) {
      ui.setEditingNode(data.editing ? data.id : null)
    }
  }

  onMounted(() => {
    window.addEventListener('message', onMessage)
    // Route panel-initiated variable inserts down into the live inline editor.
    ui.onInsertVariable((token) => postToIframe({ type: MJED.insertVariable, token }))
  })
  onBeforeUnmount(() => {
    window.removeEventListener('message', onMessage)
    ui.onInsertVariable(null)
    ui.setEditingNode(null)
  })

  watch(compiledHtml, render)
  watch(
    () => store.selectedId,
    (id) => postToIframe({ type: MJED.highlight, id }),
  )
  watch(dragActive, (active) => postToIframe({ type: MJED.dragState, dragging: active }))

  return { iframeReady }
}
