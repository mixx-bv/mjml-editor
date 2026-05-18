<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import mjml2html from 'mjml-browser'
import { useEditorStore } from '../stores/editor'
import { documentToMjmlJson } from '../utils/mjmlJson'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const store = useEditorStore()

type Tab = 'html' | 'mjml' | 'json'
const tab = ref<Tab>('html')
const copied = ref(false)

const mjmlString = computed(() => store.mjmlString)

const jsonString = computed(() =>
  JSON.stringify(documentToMjmlJson(store.tree, store.head), null, 2),
)

const htmlString = ref('')
const compileError = ref<string | null>(null)

async function compileHtml() {
  try {
    const result: any = await mjml2html(mjmlString.value, { validationLevel: 'soft' })
    htmlString.value = result.html || ''
    compileError.value = result.errors?.length
      ? result.errors.map((e: any) => e.formattedMessage).join('\n')
      : null
  } catch (err: any) {
    compileError.value = err?.message || String(err)
    htmlString.value = ''
  }
}

watch(
  [() => props.open, mjmlString],
  ([isOpen]) => {
    if (isOpen) compileHtml()
  },
  { immediate: true },
)

const current = computed(() => {
  if (tab.value === 'html') return htmlString.value
  if (tab.value === 'mjml') return mjmlString.value
  return jsonString.value
})

const filename = computed(() => {
  const base = (store.head.title || 'email').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'email'
  if (tab.value === 'html') return `${base}.html`
  if (tab.value === 'mjml') return `${base}.mjml`
  return `${base}.json`
})

async function onCopy() {
  try {
    await navigator.clipboard.writeText(current.value)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1500)
  } catch {
    // ignore
  }
}

function onDownload() {
  const blob = new Blob([current.value], {
    type:
      tab.value === 'html' ? 'text/html' : tab.value === 'json' ? 'application/json' : 'text/xml',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.value
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function onBackdrop(e: MouseEvent) {
  if ((e.target as Element).classList.contains('export-modal')) emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <div
    v-if="open"
    class="export-modal"
    role="dialog"
    aria-modal="true"
    @click="onBackdrop"
    @keydown="onKeydown"
    tabindex="-1"
  >
    <div class="export-modal__panel">
      <header class="export-modal__header">
        <h2 class="export-modal__title">Export</h2>
        <button class="export-modal__close" @click="emit('close')" aria-label="Close">×</button>
      </header>

      <nav class="export-modal__tabs">
        <button
          v-for="t in (['html', 'mjml', 'json'] as Tab[])"
          :key="t"
          class="export-modal__tab"
          :class="{ 'is-active': tab === t }"
          @click="tab = t"
        >
          {{ t.toUpperCase() }}
        </button>
      </nav>

      <div v-if="tab === 'html' && compileError" class="export-modal__error">
        <strong>MJML compile error</strong>
        <pre>{{ compileError }}</pre>
      </div>

      <pre class="export-modal__code"><code>{{ current }}</code></pre>

      <footer class="export-modal__footer">
        <span class="export-modal__hint">{{ filename }}</span>
        <div class="export-modal__actions">
          <button @click="onCopy">{{ copied ? 'Copied ✓' : 'Copy' }}</button>
          <button class="export-modal__primary" @click="onDownload">Download</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.export-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;

  &__panel {
    background: $color-panel;
    border-radius: $radius-md;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
    width: min(900px, 100%);
    max-height: calc(100vh - 48px);
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid $color-border;
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  &__close {
    border: 0;
    background: transparent;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    color: $color-muted;
    padding: 0 4px;

    &:hover {
      color: $color-text;
    }
  }

  &__tabs {
    display: flex;
    gap: 4px;
    padding: 8px 18px 0;
    border-bottom: 1px solid $color-border;
  }

  &__tab {
    border: 0;
    background: transparent;
    padding: 8px 14px;
    border-bottom: 2px solid transparent;
    color: $color-muted;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.4px;
    cursor: pointer;
    margin-bottom: -1px;

    &.is-active {
      color: $color-accent;
      border-bottom-color: $color-accent;
    }
  }

  &__error {
    margin: 12px 18px 0;
    background: #fff1f2;
    border: 1px solid #fecaca;
    color: $color-danger;
    padding: 8px 12px;
    border-radius: $radius-sm;
    font-size: 12px;

    pre {
      margin: 4px 0 0;
      white-space: pre-wrap;
    }
  }

  &__code {
    margin: 12px 18px;
    flex: 1;
    overflow: auto;
    background: #0f172a;
    color: #e2e8f0;
    border-radius: $radius-sm;
    padding: 12px 14px;
    font: 12px/1.5 ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    white-space: pre;

    code {
      font: inherit;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    border-top: 1px solid $color-border;
  }

  &__hint {
    font-size: 12px;
    color: $color-muted;
    font-family: ui-monospace, monospace;
  }

  &__actions {
    display: flex;
    gap: 8px;

    button {
      border: 1px solid $color-border;
      background: $color-panel;
      padding: 7px 14px;
      border-radius: $radius-sm;
      cursor: pointer;
      font-size: 13px;
    }
  }

  &__primary {
    background: $color-accent !important;
    color: #fff !important;
    border-color: $color-accent !important;
  }
}
</style>
