<script setup lang="ts">
import AttrField from '../fields/AttrField.vue'
import NumberUnitField from '../fields/NumberUnitField.vue'

</script>

<template>
  <div>
    <AttrField attr-key="background-color" label="Background color" type="color" />
    <NumberUnitField attr-key="width" label="Email width" :units="['px']" />
  </div>
</template>
