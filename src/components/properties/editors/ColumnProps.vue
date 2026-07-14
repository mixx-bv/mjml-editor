<script setup lang="ts">
import AttrField from '../fields/AttrField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'
import BoxField from '../fields/BoxField.vue'

</script>

<template>
  <div>
    <NumberUnitField attr-key="width" label="Width" :units="['%', 'px']" />
    <AttrField attr-key="background-color" label="Background color" type="color" />
    <BoxField attr-key="padding" label="Padding" />
    <AttrField
      attr-key="vertical-align"
      label="Vertical align"
      type="select"
      :options="[
        { value: 'top', label: 'Top' },
        { value: 'middle', label: 'Middle' },
        { value: 'bottom', label: 'Bottom' },
      ]"
    />
    <AttrField attr-key="border" label="Border" placeholder="1px solid #ccc" />
  </div>
</template>
