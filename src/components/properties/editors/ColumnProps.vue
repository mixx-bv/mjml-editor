<script setup lang="ts">
import AttrField from '../fields/AttrField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'
import BoxField from '../fields/BoxField.vue'

defineProps<{ nodeId: string }>()
</script>

<template>
  <div>
    <NumberUnitField :node-id="nodeId" attr-key="width" label="Width" :units="['%', 'px']" />
    <AttrField :node-id="nodeId" attr-key="background-color" label="Background color" type="color" />
    <BoxField :node-id="nodeId" attr-key="padding" label="Padding" />
    <AttrField
      :node-id="nodeId"
      attr-key="vertical-align"
      label="Vertical align"
      type="select"
      :options="[
        { value: 'top', label: 'Top' },
        { value: 'middle', label: 'Middle' },
        { value: 'bottom', label: 'Bottom' },
      ]"
    />
    <AttrField :node-id="nodeId" attr-key="border" label="Border" placeholder="1px solid #ccc" />
  </div>
</template>
