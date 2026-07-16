<script setup lang="ts">
import AttrField from '../fields/AttrField.vue'
import BoxField from '../fields/BoxField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'
import { ALIGN_OPTIONS } from '../fieldOptions'
</script>

<template>
  <div>
    <AttrField attr-key="border-color" label="Line color" type="color" />
    <NumberUnitField attr-key="border-width" label="Line thickness" :units="['px']" />
    <AttrField
      attr-key="border-style"
      label="Line style"
      type="select"
      :options="[
        { value: 'solid', label: 'Solid' },
        { value: 'dashed', label: 'Dashed' },
        { value: 'dotted', label: 'Dotted' },
      ]"
    />
    <NumberUnitField attr-key="width" label="Width" :units="['%', 'px']" />
    <AttrField attr-key="align" label="Align" type="select" :options="ALIGN_OPTIONS" />
    <BoxField attr-key="padding" label="Padding" />
  </div>
</template>
