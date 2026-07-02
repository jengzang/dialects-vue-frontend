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

    <div v-if="hasSelection" class="info-header">
      <div class="info-text">
        <span class="info-icon">ℹ️</span>
        <span>
          {{ $t('query.components.zhongguDirectInput.possibleCombinations', { count: pathStrings.length }) }}
          <span v-if="!loading && results.length >= 0" class="fade-in">
          {{ $t('query.components.zhongguDirectInput.actualMatches', { count: results.length }) }}
          </span>
        </span>
      </div>

      <button
        v-if="!loading && results.length > 0"
        class="global-expand-btn"
        @click="isModalOpen = true"
      >
        {{ $t('query.components.zhongguDirectInput.detailsButton') }}
      </button>
    </div>

    <div v-if="limitHint" class="limit-warning">
      ⚠️ {{ limitHint }}
    </div>

    <div v-if="loading" class="status-msg loading">
      <span class="ui-loading--inline" aria-hidden="true">↻</span> {{ $t('query.components.zhongguDirectInput.querying') }}
    </div>

    <div v-else-if="!results || results.length === 0" class="status-msg empty">
      {{ hasSelection ? $t('query.components.zhongguDirectInput.noMatches') : $t('query.components.zhongguDirectInput.pleaseSelect') }}
    </div>

    <div v-else class="compact-grid">
      <div v-for="item in results" :key="item.query" class="compact-item">
        <span class="compact-title">{{ formatTitle(item.query) }}</span>
        <span class="compact-count">({{ item['char_count'] }})</span>
        <span class="compact-preview">
          {{ (item['chars'] || []).slice(0, 8).join('') }}{{ (item['chars'] || []).length > 8 ? '...' : '' }}
        </span>
      </div>
    </div>

    <ZhongguDetailsPopup
      :visible="isModalOpen"
      :results="results"
      :format-title="formatTitle"
      @close="isModalOpen = false"
    />

    <ZhongGuInputHelpModal
      :visible="isHelpModalOpen"
      @close="isHelpModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getCharList } from '@/api'
import ZhongguDetailsPopup from '@/main/components/popup/query/ZhongguDetailsPopup.vue'
import ZhongGuInputHelpModal from '@/main/components/popup/query/ZhongGuInputHelpModal.vue'
import { userStore } from '@/main/store/store.js'
import { ROLE_LIMITS, QUERY_CONFIG } from '@/main/config/constants.js'
import { parseTokens, validateToken, validateAll, tokensToPathStrings } from '@/main/utils/zhongguDirectInputValidator.js'

const emit = defineEmits(['update:runDisabled'])

function updateDisabledState(isDisabled) {
  emit('update:runDisabled', isDisabled)
}

const props = defineProps({
  excludeColumns: { type: Array, default: () => [] },
  tableName: { type: String, default: 'characters' }
})

const positionInput = ref('')
const charInput = ref('')
const positionErrors = ref([])
const positionWarnings = ref([])
const loading = ref(false)
const results = ref([])
const limitHint = ref('')
const isModalOpen = ref(false)
const isHelpModalOpen = ref(false)
let debounceTimer = null

const hasPositionError = computed(() => positionErrors.value.length > 0)
const hasPositionWarning = computed(() => positionWarnings.value.length > 0)

const pathStrings = computed(() => {
  if (!positionInput.value.trim()) return []

  const tokens = parseTokens(positionInput.value)
  const parsedResults = []

  for (const token of tokens) {
    const result = validateToken(token)
    if (result.valid && result.parsed) {
      parsedResults.push(result.parsed)
    }
  }

  return tokensToPathStrings(parsedResults)
})

const chars = computed(() => {
  if (!charInput.value.trim()) return ''
  return [...charInput.value.trim()].filter(ch => /\p{Script=Han}/u.test(ch))
})

const hasSelection = computed(() => pathStrings.value.length > 0)

const positionInputRef = ref(null)

function onPositionInput() {
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    const validation = validateAll(positionInput.value)

    positionErrors.value = validation.errors
    positionWarnings.value = validation.warnings

    if (validation.errors.length === 0 && hasSelection.value) {
      fetchData(pathStrings.value)
    } else if (validation.errors.length > 0) {
      results.value = []
    }
  }, QUERY_CONFIG.DEBOUNCE_DELAY)
}

watch(() => props.excludeColumns, () => {
  if (hasSelection.value && positionErrors.value.length === 0) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      fetchData(pathStrings.value)
    }, QUERY_CONFIG.DEBOUNCE_DELAY)
  }
}, { deep: true })

watch(pathStrings, (newVal, oldVal) => {
  if (JSON.stringify(newVal) === JSON.stringify(oldVal)) return

  if (newVal.length === 0) {
    results.value = []
    return
  }
})

async function fetchData(pathStringsData) {
  loading.value = true
  limitHint.value = ''
  results.value = []

  updateDisabledState(true)

  try {
    const data = await getCharList({
      path_strings: pathStringsData,
      combine_query: false,
      exclude_columns: props.excludeColumns,
      table_name: props.tableName
    })
    results.value = Array.isArray(data) ? data : []

    validateResultLimit(results.value.length)
  } catch (e) {
    console.error('Direct input fetch error:', e)
    limitHint.value = 'queryFailed'
    results.value = []
    updateDisabledState(true)
  } finally {
    loading.value = false
  }
}

function validateResultLimit(count) {
  const limits = ROLE_LIMITS[userStore.role] || ROLE_LIMITS.anonymous

  if (count > limits.MAX_RESULTS) {
    limitHint.value = userStore.role === 'anonymous'
      ? `查詢結果過多(${count}>${limits.MAX_RESULTS})，登錄可查詢更多組合`
      : `查詢結果過多(${count}>${limits.MAX_RESULTS})，請減少組合`
    updateDisabledState(true)
  } else {
    limitHint.value = ''
    updateDisabledState(false)
  }
}

function formatTitle(queryStr) {
  if (!queryStr) return ''
  const matches = [...queryStr.matchAll(/\[(.*?)]\{(.*?)\}/g)]
  if (matches.length > 0) {
    const removeKeys = ['清濁', '入', '部位', '方式', '調']
    return matches.map(m => {
      let key = m[2]
      if (removeKeys.includes(key)) key = ''
      return `${m[1]}${key}`
    }).join('·')
  }
  return queryStr
}

defineExpose({ pathStrings, chars })
</script>

<style scoped>
.zhonggu-direct-input {
  margin: 10px 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light, #eee);
  color: var(--text-medium, #555);
  font-size: 13px;
}

.global-expand-btn {
  background: var(--color-blue-custom-light, rgba(0,122,255,0.1));
  color: var(--color-blue-custom, #007aff);
  border: none;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  white-space: nowrap;
}

.global-expand-btn:hover {
  background: var(--color-blue-custom, #007aff);
  color: #fff;
}

.status-msg {
  text-align: center;
  color: var(--text-muted, #999);
  font-size: 14px;
  width: 100%;
}

.compact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px;
  width: 100%;
}

.compact-item {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  font-size: 14px;
  padding: 8px;
  border-radius: 8px;
  background: var(--glass-lighter);
  transition: background 0.2s;
}

.compact-item:hover {
  background: var(--glass-medium-strong);
}

.compact-title {
  font-weight: bold;
  color: var(--text-dark);
  margin-right: 4px;
}

.compact-count {
  color: var(--color-blue-custom, #007aff);
  font-size: 0.9em;
  margin-right: 8px;
  font-weight: 600;
}

.compact-preview {
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.limit-warning {
  padding: 12px;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  color: var(--color-error);
  border-radius: 12px;
  font-size: 14px;
  text-align: center;
  font-weight: 600;
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
