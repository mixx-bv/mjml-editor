<script setup lang="ts">
import { ref } from 'vue'
import { useUiStore } from '../../stores/ui'
import AppModal from '../app/AppModal.vue'
import AppCard from '../app/AppCard.vue'
import AppInput from '../app/AppInput.vue'
import AppButton from '../app/AppButton.vue'

const ui = useUiStore()
const customUrl = ref('')

function pick(url: string) {
  ui.closePicker(url)
}

function cancel() {
  ui.closePicker(null)
}

function useCustom() {
  const v = customUrl.value.trim()
  if (v) {
    ui.closePicker(v)
    customUrl.value = ''
  }
}
</script>

<template>
  <AppModal :open="ui.pickerOpen" title="Choose an image" width="720px" @close="cancel">
    <div v-if="ui.mediaLibrary.length === 0" class="picker__empty">
      No images in the library yet. Paste a URL below.
    </div>

    <div v-else class="picker__grid">
      <AppCard
        v-for="asset in ui.mediaLibrary"
        :key="asset.url"
        as="button"
        hoverable
        class="picker__item"
        @click="pick(asset.url)"
      >
        <img :src="asset.thumbnail || asset.url" :alt="asset.label || ''" />
        <span v-if="asset.label" class="picker__label">{{ asset.label }}</span>
      </AppCard>
    </div>

    <footer class="picker__footer">
      <label class="picker__custom">
        <span>Or paste a URL</span>
        <div class="picker__custom-row">
          <AppInput
            v-model="customUrl"
            type="url"
            placeholder="https://…"
            @keydown.enter.prevent="useCustom"
          />
          <AppButton variant="primary" :disabled="!customUrl.trim()" @click="useCustom">Use</AppButton>
        </div>
      </label>
    </footer>
  </AppModal>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.picker {
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
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    img {
      width: 100%;
      height: 100px;
      object-fit: cover;
      display: block;
      background: $color-bg;
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
    flex-shrink: 0;
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
  }
}
</style>
