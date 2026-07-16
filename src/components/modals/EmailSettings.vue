<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { useUiStore } from '../../stores/ui'
import { insertAtCaret } from '../../utils/caretInsert'
import AppModal from '../app/AppModal.vue'
import AppField from '../app/AppField.vue'
import AppInput from '../app/AppInput.vue'
import AppTextarea from '../app/AppTextarea.vue'
import AppButton from '../app/AppButton.vue'
import VariableMenu from '../app/VariableMenu.vue'

const store = useEditorStore()
const ui = useUiStore()

const titleRef = ref<InstanceType<typeof AppInput> | null>(null)
const previewRef = ref<InstanceType<typeof AppTextarea> | null>(null)

function insertField(
  el: HTMLInputElement | HTMLTextAreaElement | undefined,
  current: string,
  token: string,
  apply: (v: string) => void,
) {
  const start = el && typeof el.selectionStart === 'number' ? el.selectionStart : null
  const { value, caret } = insertAtCaret(current, token, start, el?.selectionEnd ?? null)
  apply(value)
  if (el) nextTick(() => { el.focus(); el.setSelectionRange(caret, caret) })
}

function insertTitle(token: string) {
  insertField(titleRef.value?.$el, store.head.title ?? '', token, (v) => (store.head.title = v))
}

function insertPreview(token: string) {
  insertField(previewRef.value?.$el, store.head.preview ?? '', token, (v) => (store.head.preview = v))
}

function close() {
  ui.settingsOpen = false
}
</script>

<template>
  <AppModal :open="ui.settingsOpen" title="Email settings" width="540px" @close="close">
    <div class="settings__body">
      <AppField variant="plain">
        <template #label>Title <em>(mj-title — shown in some clients as email subject when not provided)</em></template>
        <div class="settings__row">
          <AppInput ref="titleRef" v-model="store.head.title" type="text" placeholder="e.g. Weekly Newsletter" />
          <VariableMenu :variables="ui.variables" @insert="insertTitle" />
        </div>
      </AppField>

      <AppField variant="plain">
        <template #label>Preview text <em>(mj-preview — preheader shown in inbox after the subject)</em></template>
        <div class="settings__row settings__row--top">
          <AppTextarea
            ref="previewRef"
            v-model="store.head.preview"
            :rows="3"
            placeholder="Short text that teases what the email is about"
          />
          <VariableMenu :variables="ui.variables" @insert="insertPreview" />
        </div>
      </AppField>
    </div>

    <footer class="settings__footer">
      <AppButton variant="primary" @click="close">Done</AppButton>
    </footer>
  </AppModal>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.settings {
  &__body {
    padding: 18px;
    display: grid;
    gap: 14px;
    overflow-y: auto;
  }

  &__row {
    display: flex;
    gap: 6px;
    align-items: center;

    &--top {
      align-items: flex-start;
    }

    :deep(.app-input),
    :deep(.app-textarea) {
      flex: 1 1 auto;
      min-width: 0;
    }
  }

  &__footer {
    padding: 12px 18px;
    border-top: 1px solid $color-border;
    display: flex;
    justify-content: flex-end;
    background: $color-bg;
    flex-shrink: 0;
  }
}
</style>
