<script setup lang="ts">
import AttrField from '../fields/AttrField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'
import BoxField from '../fields/BoxField.vue'
import { TEXT_ALIGN_OPTIONS, TEXT_WEIGHT_OPTIONS } from '../fieldOptions'

</script>

<template>
  <div>
    <NumberUnitField
      attr-key="font-size"
      label="Font size"
      :units="['px', 'em', 'rem']"
    />
    <AttrField attr-key="color" label="Color" type="color" />
    <AttrField
      attr-key="align"
      label="Align"
      type="select"
      :options="TEXT_ALIGN_OPTIONS"
    />
    <AttrField
      attr-key="font-weight"
      label="Weight"
      type="select"
      :options="TEXT_WEIGHT_OPTIONS"
    />
    <NumberUnitField
      attr-key="line-height"
      label="Line height"
      :units="['', 'px', '%', 'em']"
      :step="0.1"
    />
    <BoxField attr-key="padding" label="Padding" />
    <AttrField attr-key="font-family" label="Font family" placeholder="Arial, sans-serif" />
  </div>
</template>
