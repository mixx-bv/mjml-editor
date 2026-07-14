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
  // Empty by default so the host opts in to the built-in test-send by passing a
  // `send-test-url`. No url → the TopBar hides the button (a Filament host uses
  // its own server-side test action instead).
  const sendTestUrl = ref<string>('')
  let pickerResolve: ((url: string | null) => void) | null = null

  function setMediaLibrary(assets: MediaAsset[]) {
    mediaLibrary.value = assets
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
    sendTestUrl,
    setMediaLibrary,
    setSendTestUrl,
    openPicker,
    closePicker,
  }
})
