<template>
  <Teleport to="body">
    <div
      v-if="isPageActive"
      class="floating-search"
      :class="{ active: showInput }"
      :style="{ top: top }"
    >
      <button
        class="floating-search-toggle"
        type="button"
        :aria-label="placeholder"
        @click="open"
      ><InlineIcon icon="🔍" /></button>
      <input
        v-if="showInput"
        ref="inputRef"
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        class="floating-search-input"
        @input="$emit('update:modelValue', $event.target.value)"
        @keydown.esc="close"
      />
      <button
        v-if="showInput"
        class="floating-search-clear"
        type="button"
        :aria-label="closeLabel"
        @click="close"
      >×</button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick, onActivated, onDeactivated } from 'vue'
import InlineIcon from '@/components/common/InlineIcon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  top: { type: String, default: '16dvh' },
  closeLabel: { type: String, default: 'Close' },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const inputRef = ref(null)
const isPageActive = ref(true)

onActivated(() => { isPageActive.value = true })
onDeactivated(() => { isPageActive.value = false })

const showInput = computed(() => {
  return isOpen.value || props.modelValue.trim().length > 0
})

const open = async () => {
  isOpen.value = true
  await nextTick()
  inputRef.value?.focus()
}

const close = () => {
  isOpen.value = false
  emit('update:modelValue', '')
}
</script>

<style scoped lang="scss">
.floating-search {
  position: fixed;
  top: 16dvh;
  left: 12px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  background: var(--glass-70);
  border: 1px solid var(--glass-70);
  border-radius: var(--radius-pill);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  box-shadow:
    0 8px 22px rgba(var(--color-primary-rgb), 0.12),
    inset 0 0 0.5px var(--glass-60);
  transition:
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.2s ease,
    box-shadow 0.2s ease;

  &.active {
    width: min(320px, calc(100% - 24px));
    background: var(--glass-90);
    box-shadow:
      0 10px 26px rgba(var(--color-primary-rgb), 0.16),
      inset 0 0 0.5px var(--glass-70);
  }
}

.floating-search-toggle {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 16px;
  line-height: 1;
  color: var(--color-primary);
  cursor: pointer;
  background: transparent;
  border: none;
}

.floating-search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 8px 0 0;
  font-size: 13px;
  color: var(--text-deep);
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: rgba(var(--text-slate-rgb), 0.72);
  }
}

.floating-search-clear {
  flex: 0 0 36px;
  width: 36px;
  height: 40px;
  padding: 0;
  font-size: 18px;
  line-height: 1;
  color: var(--text-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  transition: color 0.15s;

  &:hover {
    color: var(--text-primary);
  }
}
</style>
