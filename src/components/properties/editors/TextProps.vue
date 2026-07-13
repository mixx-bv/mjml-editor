<script setup lang="ts">
import AttrField from '../fields/AttrField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'
import BoxField from '../fields/BoxField.vue'

defineProps<{ nodeId: string }>()
</script>

<template>
  <div>
    <NumberUnitField
      :node-id="nodeId"
      attr-key="font-size"
      label="Font size"
      :units="['px', 'em', 'rem']"
    />
    <AttrField :node-id="nodeId" attr-key="color" label="Color" type="color" />
    <AttrField
      :node-id="nodeId"
      attr-key="align"
      label="Align"
      type="select"
      :options="[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
        { value: 'justify', label: 'Justify' },
      ]"
    />
    <AttrField
      :node-id="nodeId"
      attr-key="font-weight"
      label="Weight"
      type="select"
      :options="[
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Bold' },
        { value: '300', label: '300' },
        { value: '500', label: '500' },
        { value: '600', label: '600' },
        { value: '700', label: '700' },
      ]"
    />
    <NumberUnitField
      :node-id="nodeId"
      attr-key="line-height"
      label="Line height"
      :units="['', 'px', '%', 'em']"
      :step="0.1"
    />
    <BoxField :node-id="nodeId" attr-key="padding" label="Padding" />
    <AttrField :node-id="nodeId" attr-key="font-family" label="Font family" placeholder="Arial, sans-serif" />
  </div>
</template>
