<script setup lang="ts">
import AppField from '../../app/AppField.vue'
import AppTextarea from '../../app/AppTextarea.vue'
import { useNodeContent } from '../../../composables/useNodeAttr'

// mj-raw holds arbitrary HTML / template code (Twig, Blade, conditional
// comments), so it is edited as raw text rather than through the WYSIWYG canvas.
const { value, onFocus } = useNodeContent()
</script>

<template>
  <AppField label="Raw HTML / template code">
    <AppTextarea v-model="value" :rows="10" placeholder="<p>Your HTML…</p>" @focus="onFocus" />
  </AppField>
</template>
