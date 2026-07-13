<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useSendTest } from '../../composables/useSendTest'
import AppButton from '../app/AppButton.vue'
import AppInput from '../app/AppInput.vue'
import AppBanner from '../app/AppBanner.vue'

const { testEmail, sendStatus, sendError, sendTest, resetStatus } = useSendTest()
const open = ref(false)

function toggle() {
  open.value = !open.value
  if (open.value) resetStatus()
}

async function onSend() {
  const ok = await sendTest()
  if (ok) {
    window.setTimeout(() => {
      if (sendStatus.value === 'sent') open.value = false
    }, 1500)
  }
}

function onDocumentClick(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Element
  if (!target.closest?.('.topbar__send-wrap')) open.value = false
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div class="topbar__send-wrap">
    <AppButton @click.stop="toggle">Send test</AppButton>
    <div v-if="open" class="topbar__popover" @click.stop>
      <label class="topbar__popover-label">Send test email to:</label>
      <AppInput
        v-model="testEmail"
        type="email"
        placeholder="you@example.com"
        @keydown.enter="onSend"
      />
      <AppButton
        variant="primary"
        class="topbar__popover-send"
        :disabled="!testEmail || sendStatus === 'sending'"
        @click="onSend"
      >
        {{ sendStatus === 'sending' ? 'Sending…' : sendStatus === 'sent' ? 'Sent ✓' : 'Send' }}
      </AppButton>
      <AppBanner v-if="sendStatus === 'error'" class="topbar__popover-error">
        {{ sendError }}
      </AppBanner>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.topbar__send-wrap {
  position: relative;
}

.topbar__popover {
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

.topbar__popover-label {
  font-size: 12px;
  color: $color-muted;
  font-weight: 600;
}

.topbar__popover-send {
  justify-self: end;
}

.topbar__popover-error {
  word-break: break-word;
}
</style>
