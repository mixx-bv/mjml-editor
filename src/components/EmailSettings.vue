<script setup lang="ts">
import { useEditorStore } from '../stores/editor'

const store = useEditorStore()

function close() {
  store.settingsOpen = false
}
</script>

<template>
  <div v-if="store.settingsOpen" class="settings" @click.self="close">
    <div class="settings__dialog">
      <header class="settings__header">
        <h3>Email settings</h3>
        <button class="settings__close" @click="close">×</button>
      </header>

      <div class="settings__body">
        <label class="settings__field">
          <span>Title <em>(mj-title — shown in some clients as email subject when not provided)</em></span>
          <input v-model="store.head.title" type="text" placeholder="e.g. Weekly Newsletter" />
        </label>

        <label class="settings__field">
          <span>Preview text <em>(mj-preview — preheader shown in inbox after the subject)</em></span>
          <textarea
            v-model="store.head.preview"
            rows="3"
            placeholder="Short text that teases what the email is about"
          />
        </label>
      </div>

      <footer class="settings__footer">
        <button class="settings__btn" @click="close">Done</button>
      </footer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.settings {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;

  &__dialog {
    background: $color-panel;
    width: min(540px, 90vw);
    border-radius: $radius-md;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid $color-border;

    h3 {
      margin: 0;
      font-size: 14px;
    }
  }

  &__close {
    border: 0;
    background: transparent;
    font-size: 22px;
    color: $color-muted;
    line-height: 1;
    padding: 0 4px;
  }

  &__body {
    padding: 18px;
    display: grid;
    gap: 14px;
  }

  &__field {
    display: grid;
    gap: 6px;

    span {
      font-size: 12px;
      color: $color-text;
      font-weight: 600;

      em {
        font-style: normal;
        font-weight: 400;
        color: $color-muted;
      }
    }

    input,
    textarea {
      padding: 7px 9px;
      border: 1px solid $color-border;
      border-radius: $radius-sm;
      background: $color-panel;
      font-family: inherit;
      resize: vertical;

      &:focus {
        outline: 2px solid $color-accent-soft;
        border-color: $color-accent;
      }
    }
  }

  &__footer {
    padding: 12px 18px;
    border-top: 1px solid $color-border;
    display: flex;
    justify-content: flex-end;
    background: $color-bg;
  }

  &__btn {
    padding: 6px 16px;
    border: 1px solid $color-accent;
    background: $color-accent;
    color: #fff;
    border-radius: $radius-sm;
    font-weight: 600;
  }
}
</style>
