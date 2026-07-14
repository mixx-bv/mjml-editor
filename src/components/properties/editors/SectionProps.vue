<script setup lang="ts">
import AttrField from '../fields/AttrField.vue'
import ImageField from '../fields/ImageField.vue'
import BoxField from '../fields/BoxField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'

</script>

<template>
  <div>
    <AttrField attr-key="background-color" label="Background color" type="color" />
    <ImageField attr-key="background-url" label="Background image" />
    <BoxField attr-key="padding" label="Padding" />
    <AttrField
      attr-key="text-align"
      label="Text align"
      type="select"
      :options="[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]"
    />
    <AttrField attr-key="border" label="Border" placeholder="1px solid #ccc" />
    <NumberUnitField attr-key="border-radius" label="Border radius" :units="['px', '%']" />
  </div>
</template>
