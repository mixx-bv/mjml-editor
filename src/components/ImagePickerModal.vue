<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '../stores/editor'

const store = useEditorStore()
const customUrl = ref('')

function pick(url: string) {
  store.closePicker(url)
}

function cancel() {
  store.closePicker(null)
}

function useCustom() {
  const v = customUrl.value.trim()
  if (v) {
    store.closePicker(v)
    customUrl.value = ''
  }
}
</script>

<template>
  <div v-if="store.pickerOpen" class="picker" @click.self="cancel">
    <div class="picker__dialog">
      <header class="picker__header">
        <h3>Choose an image</h3>
        <button class="picker__close" @click="cancel">×</button>
      </header>

      <div v-if="store.mediaLibrary.length === 0" class="picker__empty">
        No images in the library yet. Paste a URL below.
      </div>

      <div v-else class="picker__grid">
        <button
          v-for="asset in store.mediaLibrary"
          :key="asset.url"
          class="picker__item"
          @click="pick(asset.url)"
        >
          <img :src="asset.thumbnail || asset.url" :alt="asset.label || ''" />
          <span v-if="asset.label" class="picker__label">{{ asset.label }}</span>
        </button>
      </div>

      <footer class="picker__footer">
        <label class="picker__custom">
          <span>Or paste a URL</span>
          <div class="picker__custom-row">
            <input v-model="customUrl" type="url" placeholder="https://…" @keydown.enter.prevent="useCustom" />
            <button :disabled="!customUrl.trim()" @click="useCustom">Use</button>
          </div>
        </label>
      </footer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.picker {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;

  &__dialog {
    background: $color-panel;
    width: min(720px, 90vw);
    max-height: 80vh;
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

  &__empty {
    padding: 40px 20px;
    text-align: center;
    color: $color-muted;
    font-size: 13px;
  }

  &__grid {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  &__item {
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    background: $color-panel;
    padding: 0;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.1s, transform 0.1s;
    display: flex;
    flex-direction: column;

    img {
      width: 100%;
      height: 100px;
      object-fit: cover;
      display: block;
      background: $color-bg;
    }

    &:hover {
      border-color: $color-accent;
      transform: translateY(-1px);
    }
  }

  &__label {
    padding: 6px 8px;
    font-size: 11px;
    color: $color-muted;
    text-align: left;
    border-top: 1px solid $color-border;
    background: $color-bg;
  }

  &__footer {
    padding: 14px 18px;
    border-top: 1px solid $color-border;
    background: $color-bg;
  }

  &__custom {
    display: grid;
    gap: 6px;

    span {
      font-size: 11px;
      color: $color-muted;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
  }

  &__custom-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;

    input {
      padding: 6px 8px;
      border: 1px solid $color-border;
      border-radius: $radius-sm;
      background: $color-panel;

      &:focus {
        outline: 2px solid $color-accent-soft;
        border-color: $color-accent;
      }
    }

    button {
      padding: 6px 14px;
      border: 1px solid $color-accent;
      background: $color-accent;
      color: #fff;
      border-radius: $radius-sm;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}
</style>
