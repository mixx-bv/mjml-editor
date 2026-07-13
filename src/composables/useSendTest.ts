import { ref } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useUiStore } from '../stores/ui'
import { compileMjml } from '../utils/compileMjml'

const STORAGE_KEY_EMAIL = 'mjed:test-email'

export type SendStatus = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Compile the current document and POST it to the host's send-test endpoint.
 * Owns the send state machine and remembers the last-used address. Returns true
 * on success so the caller can dismiss its UI.
 */
export function useSendTest() {
  const store = useEditorStore()
  const ui = useUiStore()

  const testEmail = ref(localStorage.getItem(STORAGE_KEY_EMAIL) || '')
  const sendStatus = ref<SendStatus>('idle')
  const sendError = ref('')

  async function sendTest(): Promise<boolean> {
    if (!testEmail.value || sendStatus.value === 'sending') return false
    sendStatus.value = 'sending'
    sendError.value = ''
    try {
      const { html, error } = await compileMjml(store.mjmlString)
      if (!html) throw new Error(error || 'MJML compiled to empty HTML')
      const response = await fetch(ui.sendTestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail.value,
          subject: store.head.title || 'Test email',
          html,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`)
      localStorage.setItem(STORAGE_KEY_EMAIL, testEmail.value)
      sendStatus.value = 'sent'
      return true
    } catch (err) {
      sendStatus.value = 'error'
      sendError.value = err instanceof Error ? err.message : String(err)
      return false
    }
  }

  function resetStatus() {
    sendStatus.value = 'idle'
    sendError.value = ''
  }

  return { testEmail, sendStatus, sendError, sendTest, resetStatus }
}
