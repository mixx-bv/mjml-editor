<script setup lang="ts">
import { useEditorStore } from '../../stores/editor'
import { useUiStore } from '../../stores/ui'
import AppModal from '../app/AppModal.vue'
import AppField from '../app/AppField.vue'
import AppInput from '../app/AppInput.vue'
import AppTextarea from '../app/AppTextarea.vue'
import AppButton from '../app/AppButton.vue'

const store = useEditorStore()
const ui = useUiStore()

function close() {
  ui.settingsOpen = false
}
</script>

<template>
  <AppModal :open="ui.settingsOpen" title="Email settings" width="540px" @close="close">
    <div class="settings__body">
      <AppField variant="plain">
        <template #label>Title <em>(mj-title — shown in some clients as email subject when not provided)</em></template>
        <AppInput v-model="store.head.title" type="text" placeholder="e.g. Weekly Newsletter" />
      </AppField>

      <AppField variant="plain">
        <template #label>Preview text <em>(mj-preview — preheader shown in inbox after the subject)</em></template>
        <AppTextarea
          v-model="store.head.preview"
          :rows="3"
          placeholder="Short text that teases what the email is about"
        />
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
