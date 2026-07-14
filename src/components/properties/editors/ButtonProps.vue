<script setup lang="ts">
import AttrField from '../fields/AttrField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'
import BoxField from '../fields/BoxField.vue'
import { ALIGN_OPTIONS, WEIGHT_OPTIONS } from '../fieldOptions'

</script>

<template>
  <div>
    <AttrField label="Button label" bind="content" />
    <AttrField attr-key="href" label="Link URL" type="url" placeholder="https://…" />
    <AttrField attr-key="background-color" label="Background color" type="color" />
    <AttrField attr-key="color" label="Text color" type="color" />
    <NumberUnitField
      attr-key="border-radius"
      label="Border radius"
      :units="['px', '%']"
    />
    <NumberUnitField
      attr-key="font-size"
      label="Font size"
      :units="['px', 'em', 'rem']"
    />
    <AttrField
      attr-key="font-weight"
      label="Weight"
      type="select"
      :options="WEIGHT_OPTIONS"
    />
    <AttrField
      attr-key="align"
      label="Align"
      type="select"
      :options="ALIGN_OPTIONS"
    />
    <BoxField attr-key="padding" label="Padding" />
    <BoxField attr-key="inner-padding" label="Inner padding" />
  </div>
</template>
