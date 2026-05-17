<script setup lang="ts">
import AttrField from './AttrField.vue'
import NumberUnitField from './NumberUnitField.vue'

defineProps<{ nodeId: string }>()
</script>

<template>
  <div>
    <AttrField :node-id="nodeId" attr-key="background-color" label="Background color" type="color" />
    <NumberUnitField :node-id="nodeId" attr-key="width" label="Email width" :units="['px']" />
    <AttrField :node-id="nodeId" attr-key="lang" label="Language code" placeholder="en" />
  </div>
</template>
