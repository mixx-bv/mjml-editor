<script setup lang="ts">
import { computed } from 'vue'
import AttrField from './AttrField.vue'
import NumberUnitField from './NumberUnitField.vue'
import BoxField from './BoxField.vue'
import { useEditorStore } from '../../stores/editor'

const props = defineProps<{ nodeId: string }>()
const store = useEditorStore()

const label = computed({
  get: () => {
    const n = store.findNode(props.nodeId)?.node
    return (n && 'content' in n ? n.content : '') ?? ''
  },
  set: (v: string) => store.updateContent(props.nodeId, v),
})
</script>

<template>
  <div>
    <label class="inline-field">
      <span>Button label</span>
      <input v-model="label" @focus="store.beginEdit()" />
    </label>
    <AttrField :node-id="nodeId" attr-key="href" label="Link URL" type="url" placeholder="https://…" />
    <AttrField :node-id="nodeId" attr-key="background-color" label="Background color" type="color" />
    <AttrField :node-id="nodeId" attr-key="color" label="Text color" type="color" />
    <NumberUnitField
      :node-id="nodeId"
      attr-key="border-radius"
      label="Border radius"
      :units="['px', '%']"
    />
    <NumberUnitField
      :node-id="nodeId"
      attr-key="font-size"
      label="Font size"
      :units="['px', 'em', 'rem']"
    />
    <AttrField
      :node-id="nodeId"
      attr-key="font-weight"
      label="Weight"
      type="select"
      :options="[
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Bold' },
      ]"
    />
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
    <BoxField :node-id="nodeId" attr-key="inner-padding" label="Inner padding" />
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.inline-field {
  display: grid;
  gap: 4px;
  margin-bottom: 10px;

  span {
    font-size: 11px;
    color: $color-muted;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  input {
    padding: 6px 8px;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    background: $color-panel;
    color: $color-text;

    &:focus {
      outline: 2px solid $color-accent-soft;
      border-color: $color-accent;
    }
  }
}
</style>
