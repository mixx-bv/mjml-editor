<script setup lang="ts">
import AttrField from '../fields/AttrField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'
import BoxField from '../fields/BoxField.vue'

defineProps<{ nodeId: string }>()
</script>

<template>
  <div>
    <AttrField :node-id="nodeId" label="Button label" bind="content" />
    <AttrField :node-id="nodeId" attr-key="href" label="Link URL" type="url" placeholder="https://…" />
    <AttrField :node-id="nodeId" attr-key="background-color" label="Background color" type="color" />
    <AttrField :node-id="nodeId" attr-key="color" label="Text color" type="color" />
    <NumberUnitField
      :node-id="nodeId"
      attr-key="border-radius"
      label="Border radius"
      :units="['px', '%']"
    />
    <NumberUnitField
      :node-id="nodeId"
      attr-key="font-size"
      label="Font size"
      :units="['px', 'em', 'rem']"
    />
    <AttrField
      :node-id="nodeId"
      attr-key="font-weight"
      label="Weight"
      type="select"
      :options="[
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Bold' },
      ]"
    />
    <AttrField
      :node-id="nodeId"
      attr-key="align"
      label="Align"
      type="select"
      :options="[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]"
    />
    <BoxField :node-id="nodeId" attr-key="padding" label="Padding" />
    <BoxField :node-id="nodeId" attr-key="inner-padding" label="Inner padding" />
  </div>
</template>
