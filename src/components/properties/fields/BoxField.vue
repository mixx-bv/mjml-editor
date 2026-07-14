<script setup lang="ts">
import { ref, watch } from 'vue'
import NumberUnit from './NumberUnit.vue'
import AppField from '../../app/AppField.vue'
import { useNodeAttr } from '../../../composables/useNodeAttr'

const props = withDefaults(
  defineProps<{
    attrKey: string
    label: string
    units?: string[]
  }>(),
  { units: () => ['px', '%'] },
)

const { value: rawValue, onFocus } = useNodeAttr(() => props.attrKey)

const linked = ref(true)

function parseShorthand(v: string): { top: string; right: string; bottom: string; left: string } {
  const parts = v.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { top: '', right: '', bottom: '', left: '' }
  if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] }
  if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] }
  if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] }
  return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] }
}

function toShorthand(t: string, r: string, b: string, l: string): string {
  if (!t && !r && !b && !l) return ''
  const T = t || '0'
  const R = r || '0'
  const B = b || '0'
  const L = l || '0'
  if (T === R && T === B && T === L) return T
  if (T === B && R === L) return `${T} ${R}`
  if (R === L) return `${T} ${R} ${B}`
  return `${T} ${R} ${B} ${L}`
}

const top = ref('')
const right = ref('')
const bottom = ref('')
const left = ref('')

watch(
  rawValue,
  (v) => {
    const p = parseShorthand(v)
    top.value = p.top
    right.value = p.right
    bottom.value = p.bottom
    left.value = p.left
    if (p.top === p.right && p.right === p.bottom && p.bottom === p.left) linked.value = true
    else linked.value = false
  },
  { immediate: true },
)

function updateSide(side: 'top' | 'right' | 'bottom' | 'left', v: string) {
  if (linked.value) {
    top.value = right.value = bottom.value = left.value = v
  } else {
    if (side === 'top') top.value = v
    if (side === 'right') right.value = v
    if (side === 'bottom') bottom.value = v
    if (side === 'left') left.value = v
  }
  rawValue.value = toShorthand(top.value, right.value, bottom.value, left.value)
}

function toggleLink() {
  linked.value = !linked.value
  if (linked.value) {
    const v = top.value || right.value || bottom.value || left.value
    updateSide('top', v)
  }
}
</script>

<template>
  <AppField class="box">
    <template #label>
      <span class="box__header">
        {{ label }}
        <button
          type="button"
          class="box__link"
          :class="{ 'is-active': linked }"
          :title="linked ? 'Sides linked' : 'Sides independent'"
          @click="toggleLink"
        >
          {{ linked ? '⤴ linked' : '↔ free' }}
        </button>
      </span>
    </template>

    <div v-if="linked" class="box__single">
      <NumberUnit
        :model-value="top"
        :units="units"
        @update:model-value="(v) => updateSide('top', v)"
        @focus="onFocus"
      />
    </div>

    <div v-else class="box__grid">
      <label class="box__side">
        <span>Top</span>
        <NumberUnit
          :model-value="top"
          :units="units"
          @update:model-value="(v) => updateSide('top', v)"
          @focus="onFocus"
        />
      </label>
      <label class="box__side">
        <span>Right</span>
        <NumberUnit
          :model-value="right"
          :units="units"
          @update:model-value="(v) => updateSide('right', v)"
          @focus="onFocus"
        />
      </label>
      <label class="box__side">
        <span>Bottom</span>
        <NumberUnit
          :model-value="bottom"
          :units="units"
          @update:model-value="(v) => updateSide('bottom', v)"
          @focus="onFocus"
        />
      </label>
      <label class="box__side">
        <span>Left</span>
        <NumberUnit
          :model-value="left"
          :units="units"
          @update:model-value="(v) => updateSide('left', v)"
          @focus="onFocus"
        />
      </label>
    </div>
  </AppField>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables' as *;

.box {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__link {
    border: 1px solid $color-border;
    background: $color-panel;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    color: $color-muted;

    &.is-active {
      background: $color-accent-soft;
      border-color: $color-accent;
      color: $color-accent;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  &__side {
    display: grid;
    gap: 3px;

    span {
      font-size: 10px;
      color: $color-muted;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
  }
}
</style>
