import { ref } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useUiStore } from '../stores/ui'
import { compileMjml } from '../utils/compileMjml'

const STORAGE_KEY_EMAIL = 'mjed:test-email'

// Pragmatic client-side check; the host endpoint remains the authority.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    if (sendStatus.value === 'sending') return false
    const to = testEmail.value.trim()
    if (!EMAIL_RE.test(to)) {
      sendStatus.value = 'error'
      sendError.value = 'Enter a valid email address.'
      return false
    }
    sendStatus.value = 'sending'
    sendError.value = ''
    try {
      const { html, error } = await compileMjml(store.mjmlString)
      if (!html) throw new Error(error || 'MJML compiled to empty HTML')
      // Collapse CR/LF so the title can't smuggle extra headers if the host builds
      // the message from these fields (defense in depth — the endpoint must
      // sanitize headers too) (S3).
      const subject = (store.head.title || 'Test email').replace(/[\r\n]+/g, ' ').trim()
      const response = await fetch(ui.sendTestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`)
      localStorage.setItem(STORAGE_KEY_EMAIL, to)
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
