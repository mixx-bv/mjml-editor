import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Device = 'desktop' | 'tablet' | 'mobile'
export type ViewMode = 'visual' | 'source'

export interface MediaAsset {
  url: string
  label?: string
  thumbnail?: string
}

/**
 * A personalization token the host offers for insertion (e.g. Twig merge fields).
 * `value` is the full, operator-free token inserted verbatim (`{{ attendee.name }}`),
 * `label` the friendly name shown in the picker. The editor never builds Twig
 * syntax itself — it just inserts what the host provides.
 */
export interface VariableItem {
  label: string
  value: string
}

/**
 * Transient editor UI state and host-provided config, kept out of the document
 * store: viewport device, view mode, modal flags, the media library, the
 * send-test endpoint, and the image-picker request promise.
 */
export const useUiStore = defineStore('ui', () => {
  const device = ref<Device>('desktop')
  const viewMode = ref<ViewMode>('visual')
  const pickerOpen = ref(false)
  const settingsOpen = ref(false)
  const exportOpen = ref(false)
  const mediaLibrary = ref<MediaAsset[]>([])
  const variables = ref<VariableItem[]>([])
  // Empty by default so the host opts in to the built-in test-send by passing a
  // `send-test-url`. No url → the TopBar hides the button (a Filament host uses
  // its own server-side test action instead).
  const sendTestUrl = ref<string>('')
  // Id of the node whose inline rich-text editor is currently open (null when
  // none). Drives whether the properties panel offers variable insertion.
  const editingNodeId = ref<string | null>(null)
  let pickerResolve: ((url: string | null) => void) | null = null
  // The canvas bridge registers a function here that posts a token into the live
  // inline editor; the properties panel calls insertVariable() to invoke it,
  // decoupled from the iframe (same indirection as pickerResolve).
  let insertVariableHandler: ((token: string) => void) | null = null

  function setMediaLibrary(assets: MediaAsset[]) {
    mediaLibrary.value = assets
  }

  function setVariables(items: VariableItem[]) {
    variables.value = items
  }

  function setEditingNode(id: string | null) {
    editingNodeId.value = id
  }

  function onInsertVariable(handler: ((token: string) => void) | null) {
    insertVariableHandler = handler
  }

  function insertVariable(token: string) {
    insertVariableHandler?.(token)
  }

  function setSendTestUrl(url: string) {
    if (url) sendTestUrl.value = url
  }

  function openPicker(): Promise<string | null> {
    // If a picker request is still pending, settle it with null before replacing
    // its resolver — otherwise that first `await openPicker()` hangs forever (R1).
    if (pickerResolve) pickerResolve(null)
    pickerOpen.value = true
    return new Promise((resolve) => {
      pickerResolve = resolve
    })
  }

  function closePicker(url: string | null) {
    pickerOpen.value = false
    if (pickerResolve) {
      pickerResolve(url)
      pickerResolve = null
    }
  }

  return {
    device,
    viewMode,
    pickerOpen,
    settingsOpen,
    exportOpen,
    mediaLibrary,
    variables,
    editingNodeId,
    sendTestUrl,
    setMediaLibrary,
    setVariables,
    setEditingNode,
    onInsertVariable,
    insertVariable,
    setSendTestUrl,
    openPicker,
    closePicker,
  }
})
