<script setup lang="ts">
import AttrField from '../fields/AttrField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'
</script>

<template>
  <div>
    <NumberUnitField attr-key="width" label="Width" :units="['%', 'px']" />
    <AttrField attr-key="background-color" label="Background color" type="color" />
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
    <AttrField
      attr-key="direction"
      label="Direction"
      type="select"
      :options="[
        { value: 'ltr', label: 'Left to right' },
        { value: 'rtl', label: 'Right to left' },
      ]"
    />
  </div>
</template>
