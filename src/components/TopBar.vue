<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import mjml2html from 'mjml-browser'
import { useEditorStore } from '../stores/editor'
import type { Device } from '../stores/editor'

const store = useEditorStore()

const devices: { id: Device; label: string }[] = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'mobile', label: 'Mobile' },
]

function setVisual() {
  store.viewMode = 'visual'
}
function setSource() {
  store.viewMode = 'source'
}

const STORAGE_KEY_EMAIL = 'mjed:test-email'

const showSendPopover = ref(false)
const testEmail = ref(localStorage.getItem(STORAGE_KEY_EMAIL) || '')
const sendStatus = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const sendError = ref<string>('')

function toggleSendPopover() {
  showSendPopover.value = !showSendPopover.value
  if (showSendPopover.value) {
    sendStatus.value = 'idle'
    sendError.value = ''
  }
}

async function sendTest() {
  if (!testEmail.value || sendStatus.value === 'sending') return
  sendStatus.value = 'sending'
  sendError.value = ''
  try {
    const result: any = await mjml2html(store.mjmlString, { validationLevel: 'soft' })
    const html: string = result.html || ''
    if (!html) throw new Error('MJML compiled to empty HTML')
    const response = await fetch(store.sendTestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: testEmail.value,
        subject: store.head.title || 'Test email',
        html,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.error || `HTTP ${response.status}`)
    }
    localStorage.setItem(STORAGE_KEY_EMAIL, testEmail.value)
    sendStatus.value = 'sent'
    window.setTimeout(() => {
      if (sendStatus.value === 'sent') showSendPopover.value = false
    }, 1500)
  } catch (err) {
    sendStatus.value = 'error'
    sendError.value = err instanceof Error ? err.message : String(err)
  }
}

function onDocumentClick(e: MouseEvent) {
  if (!showSendPopover.value) return
  const target = e.target as Element
  if (!target.closest?.('.topbar__send-wrap')) showSendPopover.value = false
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <header class="topbar">
    <div class="topbar__brand">MJML Editor</div>

    <div class="topbar__devices">
      <button
        v-for="d in devices"
        :key="d.id"
        class="topbar__device"
        :class="{ 'is-active': store.device === d.id }"
        @click="store.device = d.id"
      >
        {{ d.label }}
      </button>
    </div>

    <div class="topbar__actions">
      <button :disabled="!store.canUndo" @click="store.undo()">Undo</button>
      <button :disabled="!store.canRedo" @click="store.redo()">Redo</button>
      <button @click="store.settingsOpen = true">Settings</button>
      <button @click="store.exportOpen = true">Export</button>

      <div class="topbar__send-wrap">
        <button @click.stop="toggleSendPopover">Send test</button>
        <div v-if="showSendPopover" class="topbar__popover" @click.stop>
          <label class="topbar__popover-label">Send test email to:</label>
          <input
            v-model="testEmail"
            type="email"
            placeholder="you@example.com"
            class="topbar__popover-input"
            @keydown.enter="sendTest"
          />
          <button
            class="topbar__popover-send"
            :disabled="!testEmail || sendStatus === 'sending'"
            @click="sendTest"
          >
            {{ sendStatus === 'sending' ? 'Sending…' : sendStatus === 'sent' ? 'Sent ✓' : 'Send' }}
          </button>
          <div v-if="sendStatus === 'error'" class="topbar__popover-error">
            {{ sendError }}
          </div>
        </div>
      </div>

      <div class="topbar__view-toggle">
        <button
          class="topbar__view-btn"
          :class="{ 'is-active': store.viewMode === 'visual' }"
          @click="setVisual"
        >
          Visual
        </button>
        <button
          class="topbar__view-btn"
          :class="{ 'is-active': store.viewMode === 'source' }"
          @click="setSource"
        >
          Source
        </button>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.topbar {
  height: $topbar-height;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: $color-panel;
  border-bottom: 1px solid $color-border;
  gap: 16px;

  &__brand {
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  &__devices {
    display: flex;
    margin-left: auto;
    gap: 4px;
    background: $color-bg;
    padding: 3px;
    border-radius: $radius-md;
  }

  &__device {
    border: 0;
    background: transparent;
    padding: 5px 12px;
    border-radius: $radius-sm;
    color: $color-muted;

    &.is-active {
      background: $color-panel;
      color: $color-text;
      box-shadow: $shadow-sm;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;

    button {
      border: 1px solid $color-border;
      background: $color-panel;
      padding: 6px 12px;
      border-radius: $radius-sm;
      color: $color-text;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }

  &__primary {
    background: $color-accent !important;
    color: #fff !important;
    border-color: $color-accent !important;
  }

  &__view-toggle {
    display: flex;
    gap: 2px;
    background: $color-bg;
    padding: 3px;
    border-radius: $radius-md;
  }

  &__view-btn {
    border: 0 !important;
    background: transparent !important;
    padding: 5px 14px !important;
    border-radius: $radius-sm;
    color: $color-muted !important;
    font-weight: 600;
    font-size: 12px;

    &.is-active {
      background: $color-panel !important;
      color: $color-text !important;
      box-shadow: $shadow-sm;
    }
  }

  &__send-wrap {
    position: relative;
  }

  &__popover {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: $color-panel;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    padding: 12px;
    display: grid;
    gap: 8px;
    width: 280px;
    z-index: 100;
  }

  &__popover-label {
    font-size: 12px;
    color: $color-muted;
    font-weight: 600;
  }

  &__popover-input {
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    padding: 7px 10px;
    font-size: 13px;
    width: 100%;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: $color-accent;
    }
  }

  &__popover-send {
    background: $color-accent !important;
    color: #fff !important;
    border-color: $color-accent !important;
    justify-self: end;
    padding: 6px 14px !important;
  }

  &__popover-error {
    font-size: 12px;
    color: $color-danger;
    background: #fff1f2;
    border: 1px solid #fecaca;
    border-radius: $radius-sm;
    padding: 6px 8px;
    word-break: break-word;
  }
}
</style>
