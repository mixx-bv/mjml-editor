<script setup lang="ts">
import AttrField from '../fields/AttrField.vue'
import ImageField from '../fields/ImageField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'
import BoxField from '../fields/BoxField.vue'

</script>

<template>
  <div>
    <ImageField attr-key="src" label="Image" />
    <AttrField attr-key="alt" label="Alt text" placeholder="Description" />
    <AttrField attr-key="href" label="Link URL" type="url" placeholder="https://…" />
    <NumberUnitField attr-key="width" label="Width" :units="['px', '%']" />
    <NumberUnitField attr-key="height" label="Height" :units="['px']" />
    <AttrField
      attr-key="align"
      label="Align"
      type="select"
      :options="[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]"
    />
    <BoxField attr-key="padding" label="Padding" />
    <AttrField attr-key="border" label="Border" placeholder="0" />
    <AttrField
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
