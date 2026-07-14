<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { compileMjml } from '../../utils/compileMjml'
import AppModal from '../app/AppModal.vue'
import AppSegmented from '../app/AppSegmented.vue'
import AppButton from '../app/AppButton.vue'
import AppBanner from '../app/AppBanner.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const store = useEditorStore()

type Tab = 'html' | 'mjml' | 'json'
const TAB_META: Record<Tab, { ext: string; mime: string }> = {
  html: { ext: 'html', mime: 'text/html' },
  mjml: { ext: 'mjml', mime: 'text/xml' },
  json: { ext: 'json', mime: 'application/json' },
}
const tabs: { value: Tab; label: string }[] = [
  { value: 'html', label: 'HTML' },
  { value: 'mjml', label: 'MJML' },
  { value: 'json', label: 'JSON' },
]
const tab = ref<Tab>('html')
const copied = ref(false)

const mjmlString = computed(() => store.mjmlString)

const jsonString = computed(() => JSON.stringify(store.mjmlJson, null, 2))

const htmlString = ref('')
const compileError = ref<string | null>(null)

async function compileHtml() {
  const { html, error } = await compileMjml(mjmlString.value)
  htmlString.value = html
  compileError.value = error
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
  return `${base}.${TAB_META[tab.value].ext}`
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
  const blob = new Blob([current.value], { type: TAB_META[tab.value].mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.value
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <AppModal :open="open" title="Export" width="900px" @close="emit('close')">
    <AppSegmented
      class="export-modal__tabs"
      variant="tabs"
      :model-value="tab"
      :options="tabs"
      @update:model-value="(v) => (tab = v)"
    />

    <AppBanner v-if="tab === 'html' && compileError" class="export-modal__error">
      <strong>MJML compile error</strong>
      <pre>{{ compileError }}</pre>
    </AppBanner>

    <pre class="export-modal__code"><code>{{ current }}</code></pre>

    <footer class="export-modal__footer">
      <span class="export-modal__hint">{{ filename }}</span>
      <div class="export-modal__actions">
        <AppButton @click="onCopy">{{ copied ? 'Copied ✓' : 'Copy' }}</AppButton>
        <AppButton variant="primary" @click="onDownload">Download</AppButton>
      </div>
    </footer>
  </AppModal>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.export-modal {
  &__tabs {
    padding: 8px 18px 0;
    flex-shrink: 0;
  }

  &__error {
    margin: 12px 18px 0;
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
    flex-shrink: 0;
  }

  &__hint {
    font-size: 12px;
    color: $color-muted;
    font-family: ui-monospace, monospace;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}
</style>
