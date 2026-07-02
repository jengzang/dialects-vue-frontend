<template>
  <div class="zhonggu-direct-input glass-card">
    <div class="input-section">
      <div class="input-label-row">
        <label class="input-label">{{ $t('query.components.zhongguDirectInput.positionLabel') }}</label>
        <button class="help-btn" @click="isHelpModalOpen = true" :aria-label="$t('query.components.zhongguDirectInput.helpButton')">
          ?
        </button>
      </div>
      <textarea
        ref="positionInputRef"
        v-model="positionInput"
        class="position-textarea"
        :class="{ 'input-error': hasPositionError, 'input-warning': !hasPositionError && hasPositionWarning }"
        :placeholder="$t('query.components.zhongguDirectInput.positionPlaceholder')"
        rows="2"
        @input="onPositionInput"
      />
      <div v-if="hasPositionError" class="error-message">
        <span v-for="(err, idx) in positionErrors" :key="idx" class="error-item">
          <template v-if="err.message === 'unknownValue'">
            {{ $t('query.components.zhongguDirectInput.unknownValueError', { value: err.payload.value }) }}
          </template>
          <template v-else-if="err.message === 'unknownCategory'">
            {{ $t('query.components.zhongguDirectInput.unknownCategoryError', { category: err.payload.category }) }}
          </template>
        </span>
      </div>
      <div v-if="!hasPositionError && hasPositionWarning" class="warning-message">
        <span v-for="(warn, idx) in positionWarnings" :key="idx" class="warning-item">
          <template v-if="warn.message === 'duplicateValue'">
            {{ $t('query.components.zhongguDirectInput.duplicateValueError', { value: warn.payload.value, categories: warn.payload.categories ? warn.payload.categories.join('、') : '' }) }}
          </template>
        </span>
      </div>
    </div>

    <div class="input-section">
      <label class="input-label">{{ $t('query.components.zhongguDirectInput.charLabel') }}</label>
      <input
        v-model="charInput"
        class="char-input"
        type="text"
        :placeholder="$t('query.components.zhongguDirectInput.charPlaceholder')"
      />
    </div>

    <ZhongGuSelector
      ref="innerSelectorRef"
      :path-strings="_pathStrings"
      :is-dropdown-open="false"
      selected-card="結果"
      :exclude-columns="excludeColumns"
      :table-name="tableName"
      @update:runDisabled="emit('update:runDisabled', $event)"
    />

    <ZhongGuInputHelpModal
      :visible="isHelpModalOpen"
      @close="isHelpModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ZhongGuSelector from '@/main/components/query/ZhongGuSelector.vue'
import ZhongGuInputHelpModal from '@/main/components/popup/query/ZhongGuInputHelpModal.vue'
import { validateAll, tokensToPathStrings } from '@/main/utils/zhongguDirectInputValidator.js'

const emit = defineEmits(['update:runDisabled'])

const props = defineProps({
  excludeColumns: { type: Array, default: () => [] },
  tableName: { type: String, default: 'characters' }
})

const positionInput = ref('')
const charInput = ref('')
const positionErrors = ref([])
const positionWarnings = ref([])
const isHelpModalOpen = ref(false)
const innerSelectorRef = ref(null)
const parsedResults = ref([])
let debounceTimer = null

const hasPositionError = computed(() => positionErrors.value.length > 0)
const hasPositionWarning = computed(() => positionWarnings.value.length > 0)

const _pathStrings = computed(() => {
  if (parsedResults.value.length === 0) return null
  return tokensToPathStrings(parsedResults.value)
})

const pathStrings = computed(() => {
  return innerSelectorRef.value?.combinations || []
})

const chars = computed(() => {
  if (!charInput.value.trim()) return ''
  return [...charInput.value.trim()].filter(ch => /\p{Script=Han}/u.test(ch))
})

function onPositionInput() {
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    const validation = validateAll(positionInput.value)

    positionErrors.value = validation.errors
    positionWarnings.value = validation.warnings

    parsedResults.value = validation.errors.length === 0 ? validation.results : []
  }, 300)
}

watch(chars, (newVal) => {
  if (positionErrors.value.length > 0) return
  if (parsedResults.value.length === 0) {
    emit('update:runDisabled', !(newVal && newVal.length > 0))
  }
})

defineExpose({ pathStrings, chars })
</script>

<style scoped>
.zhonggu-direct-input {
  background: none;
  width: 80dvw;
  max-width: 600px;
  margin: 10px 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap:16px;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-medium, #555);
}

.help-btn {
  width: 24px;
  height: 24px;
  border: 1.5px solid var(--color-blue-custom, #007aff);
  border-radius: 50%;
  background: transparent;
  color: var(--color-blue-custom, #007aff);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.help-btn:hover {
  background: var(--color-blue-custom, #007aff);
  color: #fff;
}

.position-textarea {
  width: 100%;
  max-width: 600px;
  min-height: 56px;
  padding: 10px 12px;
  border: 1.5px solid var(--border-medium, #ddd);
  border-radius: 10px;
  background: var(--glass-lighter, rgba(255,255,255,0.6));
  color: var(--text-dark, #333);
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s;
  box-sizing: border-box;
}

.position-textarea:focus {
  border-color: var(--color-blue-custom, #007aff);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
}

.position-textarea.input-error {
  border-color: #ff3b30;
  box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.12);
}

.position-textarea.input-warning {
  border-color: #ff9500;
  box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.12);
}

.char-input {
  width: 100%;
  max-width: 600px;
  padding: 10px 12px;
  border: 1.5px solid var(--border-medium, #ddd);
  border-radius: 10px;
  background: var(--glass-lighter, rgba(255,255,255,0.6));
  color: var(--text-dark, #333);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s;
  box-sizing: border-box;
}

.char-input:focus {
  border-color: var(--color-blue-custom, #007aff);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
}

.error-message {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.error-item {
  color: #ff3b30;
  font-size: 12px;
  line-height: 1.4;
}

.warning-message {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.warning-item {
  color: #ff9500;
  font-size: 12px;
  line-height: 1.4;
}
</style>
