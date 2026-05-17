<script setup lang="ts">
import AttrField from './AttrField.vue'
import ImageField from './ImageField.vue'
import NumberUnitField from './NumberUnitField.vue'
import BoxField from './BoxField.vue'

defineProps<{ nodeId: string }>()
</script>

<template>
  <div>
    <ImageField :node-id="nodeId" attr-key="src" label="Image" />
    <AttrField :node-id="nodeId" attr-key="alt" label="Alt text" placeholder="Description" />
    <AttrField :node-id="nodeId" attr-key="href" label="Link URL" type="url" placeholder="https://…" />
    <NumberUnitField :node-id="nodeId" attr-key="width" label="Width" :units="['px', '%']" />
    <NumberUnitField :node-id="nodeId" attr-key="height" label="Height" :units="['px']" />
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
    <AttrField :node-id="nodeId" attr-key="border" label="Border" placeholder="0" />
    <AttrField
      :node-id="nodeId"
      attr-key="fluid-on-mobile"
      label="Fluid on mobile"
      type="select"
      :options="[
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ]"
    />
  </div>
</template>
