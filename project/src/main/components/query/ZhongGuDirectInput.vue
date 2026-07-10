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
        :class="{ 'input-error': hasPositionError, 'input-warning': !hasPositionError && hasPositionWarning }"
        :placeholder="$t('query.components.zhongguDirectInput.positionPlaceholder')"
        rows="2"
        :disabled="isLoading"
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
          <template v-else-if="err.message === 'tooManyTokens'">
            {{ $t('query.components.zhongguDirectInput.tooManyTokens', { count: err.payload.count, limit: err.payload.limit }) }}
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

    <ZhongGuSelector
      ref="innerSelectorRef"
      :path-strings="_pathStrings"
      :is-dropdown-open="false"
      selected-card="結果"
      :exclude-columns="excludeColumns"
      :table-name="tableName"
      @update:runDisabled="emit('update:runDisabled', $event)"
    />

     <div class="input-section" style="margin-top: 12px;">
      <label class="input-label">{{ $t('query.components.zhongguDirectInput.charLabel') }}</label>
      <input
        v-model="charInput"
        class="main-input-field"
        type="text"
        maxlength="500"
        :placeholder="$t('query.components.zhongguDirectInput.charPlaceholder')"
      />
    </div>

    <ZhongGuInputHelpModal
      :visible="isHelpModalOpen"
      :table-name="tableName"
      @close="isHelpModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ZhongGuSelector from '@/main/components/query/ZhongGuSelector.vue'
import ZhongGuInputHelpModal from '@/main/components/popup/query/ZhongGuInputHelpModal.vue'
import { validateAll, parseTokens, tokensToPathStrings } from '@/main/utils/query/zhongguDirectInputValidator.js'
import { ROLE_LIMITS } from '@/main/config/constants.js'
import { userStore } from '@/main/store/store.js'

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

const isLoading = computed(() => innerSelectorRef.value?.loading || false)
const hasPositionError = computed(() => positionErrors.value.length > 0)
const hasPositionWarning = computed(() => positionWarnings.value.length > 0)

const _pathStrings = computed(() => {
  if (parsedResults.value.length === 0) return null
  return tokensToPathStrings(parsedResults.value, props.tableName)
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
    const tokens = parseTokens(positionInput.value)
    const limits = ROLE_LIMITS[userStore.role] || ROLE_LIMITS.anonymous

    if (tokens.length > limits.MAX_RESULTS) {
      positionErrors.value = [{
        token: '',
        message: 'tooManyTokens',
        payload: { count: tokens.length, limit: limits.MAX_RESULTS }
      }]
      positionWarnings.value = []
      parsedResults.value = []
      return
    }

    const validation = validateAll(positionInput.value, props.tableName)

    positionErrors.value = validation.errors
    positionWarnings.value = validation.warnings

    parsedResults.value = validation.errors.length === 0 ? validation.results : []
  }, 600)
}

watch(chars, (newVal) => {
  if (positionErrors.value.length > 0) return
  if (parsedResults.value.length === 0) {
    emit('update:runDisabled', !(newVal && newVal.length > 0))
  }
})

defineExpose({ pathStrings, chars, positionInput, charInput })
</script>

<style lang="scss" scoped>
$primary-color: var(--color-blue-custom, #007aff);
$text-medium-color: var(--text-medium, #555);
$error-color: #ff3b30;
$warning-color: #ff9500;
$transition-duration: 0.2s;

@mixin status-message {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

@mixin status-item($color) {
  color: $color;
  font-size: 12px;
  line-height: 1.4;
}

.zhonggu-direct-input {
  position: relative;
  left: 50%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 80dvw;
  max-width: 600px;
  margin: 10px 0;
  padding: 12px;
  background: none;
  transform: translateX(-50%);

  @media (max-aspect-ratio: 1/1) {
    gap: 0;
    padding: 8px;
  }
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label-row {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.input-label {
  color: $text-medium-color;
  font-size: 14px;
  font-weight: 600;
}

.help-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: $primary-color;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: transparent;
  border: 1.5px solid $primary-color;
  border-radius: 50%;
  transition: all $transition-duration;

  &:hover {
    color: #fff;
    background: $primary-color;
  }
}

textarea {
  height: auto;
  min-height: 56px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;

  &:focus {
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
  }

  &.input-error {
    border-color: $error-color;
    box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.12);
  }

  &.input-warning {
    border-color: $warning-color;
    box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.12);
  }
}

.error-message {
  @include status-message;
}

.error-item {
  @include status-item($error-color);
}

.warning-message {
  @include status-message;
}

.warning-item {
  @include status-item($warning-color);
}
</style>