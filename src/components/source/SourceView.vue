<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { useMjmlCompiler } from '../../composables/useMjmlCompiler'

const store = useEditorStore()

// Editable source text. Initialized from store.mjmlString and one-way-sync'd
// in two directions but with edit-priority: while the textarea is focused or
// recently edited, we don't overwrite it from the store.
const sourceText = ref('')
const userTouched = ref(false)
const parseError = ref<string | null>(null)

// Reuse the debounced, sequence-guarded compile from the visual canvas instead
// of re-implementing it here (D1). It recompiles automatically as sourceText
// changes, so onInput/onMounted no longer trigger a compile by hand.
const { compiledHtml, compileError } = useMjmlCompiler(sourceText)

onMounted(() => {
  sourceText.value = store.mjmlString
})

// When the store changes externally (e.g., user switched to visual, edited,
// came back), refresh the source unless the user is currently editing.
watch(
  () => store.mjmlString,
  (s) => {
    if (!userTouched.value && s !== sourceText.value) {
      sourceText.value = s
    }
  },
)

let applyTimer: number | undefined
function onInput() {
  userTouched.value = true
  window.clearTimeout(applyTimer)
  applyTimer = window.setTimeout(() => {
    const ok = store.applyMjml(sourceText.value)
    parseError.value = ok ? null : 'Could not parse MJML — check that <mjml> and <mj-body> exist.'
    userTouched.value = false
  }, 400)
}

const lineCount = computed(() => sourceText.value.split('\n').length)
</script>

<template>
  <div class="source-view">
    <div class="source-view__pane source-view__pane--editor">
      <header class="source-view__pane-header">
        <span class="source-view__pane-title">MJML</span>
        <span class="source-view__hint">{{ lineCount }} lines</span>
      </header>
      <textarea
        v-model="sourceText"
        class="source-view__textarea"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        @input="onInput"
      />
      <div v-if="parseError" class="source-view__error">{{ parseError }}</div>
    </div>

    <div class="source-view__pane source-view__pane--preview">
      <header class="source-view__pane-header">
        <span class="source-view__pane-title">Preview</span>
      </header>
      <iframe
        class="source-view__iframe"
        :srcdoc="compiledHtml"
        sandbox="allow-same-origin"
      />
      <div v-if="compileError" class="source-view__error">
        <strong>MJML compile error</strong>
        <pre>{{ compileError }}</pre>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.source-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
  min-height: 0;
  background: $color-bg;
}

.source-view__pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;

  &--editor {
    border-right: 1px solid $color-border;
    background: #0f172a;
  }

  &--preview {
    background: white;
  }
}

.source-view__pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: #1e293b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;

  .source-view__pane--preview & {
    background: $color-panel;
    border-bottom: 1px solid $color-border;
  }
}

.source-view__pane-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #94a3b8;

  .source-view__pane--preview & {
    color: $color-muted;
  }
}

.source-view__hint {
  font-size: 11px;
  color: #64748b;
}

.source-view__textarea {
  flex: 1;
  border: 0;
  background: #0f172a;
  color: #e2e8f0;
  font: 12px/1.55 ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace;
  padding: 12px 14px;
  resize: none;
  outline: none;
  white-space: pre;
  tab-size: 2;
  overflow: auto;
}

.source-view__iframe {
  flex: 1;
  border: 0;
  background: white;
}

.source-view__error {
  background: #fff1f2;
  border-top: 1px solid #fecaca;
  color: $color-danger;
  padding: 8px 14px;
  font-size: 12px;
  font-family: ui-monospace, monospace;
  max-height: 30%;
  overflow: auto;
  flex-shrink: 0;

  pre {
    margin: 4px 0 0;
    white-space: pre-wrap;
  }

  .source-view__pane--editor & {
    background: #2c1518;
    border-top-color: #5b1f25;
    color: #fecaca;
  }
}
</style>
