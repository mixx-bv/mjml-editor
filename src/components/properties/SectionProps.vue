<script setup lang="ts">
import AttrField from './AttrField.vue'
import ImageField from './ImageField.vue'
import BoxField from './BoxField.vue'
import NumberUnitField from './NumberUnitField.vue'

defineProps<{ nodeId: string }>()
</script>

<template>
  <div>
    <AttrField :node-id="nodeId" attr-key="background-color" label="Background color" type="color" />
    <ImageField :node-id="nodeId" attr-key="background-url" label="Background image" />
    <BoxField :node-id="nodeId" attr-key="padding" label="Padding" />
    <AttrField
      :node-id="nodeId"
      attr-key="text-align"
      label="Text align"
      type="select"
      :options="[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]"
    />
    <AttrField :node-id="nodeId" attr-key="border" label="Border" placeholder="1px solid #ccc" />
    <NumberUnitField :node-id="nodeId" attr-key="border-radius" label="Border radius" :units="['px', '%']" />
  </div>
</template>
