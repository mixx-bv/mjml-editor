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
    <AttrField
      attr-key="full-width"
      label="Full width"
      type="select"
      :options="[
        { value: '', label: 'No' },
        { value: 'full-width', label: 'Yes' },
      ]"
    />
    <BoxField attr-key="padding" label="Padding" />
    <AttrField attr-key="border" label="Border" placeholder="1px solid #ccc" />
    <NumberUnitField attr-key="border-radius" label="Border radius" :units="['px', '%']" />
  </div>
</template>
