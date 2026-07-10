<template>
  <div class="query-box">
    <div class="query-header">
      <label class="query-label" for="tab3-key-input">{{ $t('query.components.yinweiSelector.label') }}</label>
      <span class="help-trigger" @click="openHelpModal">
        {{ $t('query.components.yinweiSelector.helpTrigger') }}
      </span>
    </div>

    <div class="textarea-wrapper">
      <textarea
        id="tab3-key-input"
        ref="inputEl"
        v-model="tab3KeyInput"
        :placeholder="$t('query.components.yinweiSelector.placeholder')"
        style="max-height: 5dvh"
        autocomplete="off"
        @keyup="onKeyup"
        @blur="onBlur"
      ></textarea>
      <span v-if="showSuccessCheckmark" class="success-checkmark">✓</span>
    </div>

    <Teleport to="body">
      <div
        v-if="suggestions.length"
        class="inline-suggestion"
        :style="suggestionStyle"
      >
        <div
          v-for="item in suggestions"
          :key="item"
          class="suggest-line"
          @mousedown.prevent="applySuggestion(item)"
        >
          <span class="suggest-text">{{ item }}</span>
          <span class="suggest-counts">
            <span class="suggest-count suggest-count--locations">{{ getSuggestionStats(item).locationCount }}</span>
            <span class="suggest-count suggest-count--total">{{ getSuggestionStats(item).totalCount }}</span>
          </span>
        </div>
      </div>
    </Teleport>

    <div v-if="inputLimitHint" class="input-limit-hint">
      {{ inputLimitHint }}
    </div>
  </div>

  <YinweiHelpPopup
    :visible="isHelpModalOpen"
    :has-locations="hasLocations"
    :location-list="locationList"
    :loading-states="loadingStates"
    :api-results="apiResults"
    :opening-animating="isHelpPopupOpening"
    @close="closeHelpModal"
  />
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getFeatureCounts } from '@/api'
import YinweiHelpPopup from '@/main/components/query/popups/YinweiHelpPopup.vue'
import { LOCATION_LIMITS } from '@/main/config/constants.js'
import { userStore, setTabContentDisabled } from '@/main/store/store.js'
import {
  aggregateFeatureCountsByType,
  filterYinweiSuggestions,
  getFeatureSuggestionsByCard,
  normalizeYinweiTokens
} from '@/main/utils/query/yinweiInput.js'

const { t } = useI18n()

const props = defineProps({
  locationRef: {
    type: Object,
    default: null
  },
  selectedCard: {
    type: String,
    default: '韻母'
  }
})

const emit = defineEmits(['update:runDisabled'])

const inputEl = ref(null)
const tab3KeyInput = ref('')
const isHelpModalOpen = ref(false)
const showSuccessCheckmark = ref(false)
const suggestions = ref([])
const suggestionStyle = ref({
  left: '0px',
  top: '0px',
  position: 'absolute',
  zIndex: 99999
})

const loadingStates = ref({})
const apiResults = ref({})
const inputLimitHint = ref('')
const isFetchingSuggestions = ref(false)
const isHelpPopupOpening = ref(false)
const aggregatedFeatureData = ref({})
const aggregatedCardStats = ref({})
const cardSuggestions = ref([])
const hasFetchedFeatureCounts = ref(false)
let fetchSuggestionsTimer = null
let featureRequestToken = 0
let helpPopupAnimationTimer = null

const locationList = computed(() => {
  const list = props.locationRef?.locationsResult || []
  return Array.isArray(list) ? list : []
})

const hasLocations = computed(() => locationList.value.length > 0)

const currentLocationLimit = computed(() => {
  const contextLimits = LOCATION_LIMITS.tab3 || LOCATION_LIMITS.default
  const roleLimits = contextLimits[userStore.role] || contextLimits.anonymous
  return roleLimits.MAX_LOCATIONS
})

const legalState = computed(() => normalizeYinweiTokens(tab3KeyInput.value, cardSuggestions.value, 3))

function updateDisabledState(isDisabled) {
  emit('update:runDisabled', isDisabled)
  setTabContentDisabled('query', 'tab3', isDisabled)
}

watch(legalState, (state) => {
  const isInvalid = state.legalTokens.length === 0
  if (userStore.role !== 'admin') {
    updateDisabledState(isInvalid)
  } else {
    updateDisabledState(false)
  }

  inputLimitHint.value = state.exceededLimit
    ? t('query.components.yinweiSelector.inputLimitHint', { max: 3 })
    : ''
  showSuccessCheckmark.value = state.legalTokens.length > 0
}, { immediate: true })

watch(locationList, () => {
  aggregatedFeatureData.value = {}
  aggregatedCardStats.value = {}
  cardSuggestions.value = []
  hasFetchedFeatureCounts.value = false
  suggestions.value = []
  apiResults.value = {}
}, { deep: true })

watch(() => props.selectedCard, () => {
  const nextAggregated = aggregatedFeatureData.value?.[props.selectedCard]
  aggregatedCardStats.value = nextAggregated && typeof nextAggregated === 'object' ? nextAggregated : {}
  cardSuggestions.value = getFeatureSuggestionsByCard(apiResults.value, props.selectedCard)
  const normalized = normalizeYinweiTokens(tab3KeyInput.value, cardSuggestions.value, 3)
  if (normalized.normalizedInput !== tab3KeyInput.value.trim()) {
    tab3KeyInput.value = normalized.normalizedInput
  }
  suggestions.value = []
})

async function openHelpModal() {
  isHelpPopupOpening.value = true
  clearTimeout(helpPopupAnimationTimer)
  helpPopupAnimationTimer = setTimeout(() => {
    isHelpPopupOpening.value = false
  }, 900)
  isHelpModalOpen.value = true

  if (!hasFetchedFeatureCounts.value && !isFetchingSuggestions.value) {
    await ensureFeatureCountsLoaded()
  }
}

function closeHelpModal() {
  isHelpModalOpen.value = false
  isHelpPopupOpening.value = false
  clearTimeout(helpPopupAnimationTimer)
}

async function ensureFeatureCountsLoaded() {
  if (hasFetchedFeatureCounts.value || isFetchingSuggestions.value) {
    return
  }

  if (!hasLocations.value) {
    return
  }

  if (locationList.value.length > currentLocationLimit.value) {
    return
  }

  const requestToken = ++featureRequestToken
  isFetchingSuggestions.value = true

  try {
    const data = await getFeatureCounts({ locations: locationList.value })

    if (requestToken !== featureRequestToken) {
      return
    }

    apiResults.value = data || {}
    aggregatedFeatureData.value = aggregateFeatureCountsByType(data || {})
    const nextAggregated = aggregatedFeatureData.value?.[props.selectedCard]
    aggregatedCardStats.value = nextAggregated && typeof nextAggregated === 'object' ? nextAggregated : {}
    cardSuggestions.value = getFeatureSuggestionsByCard(apiResults.value, props.selectedCard)
    hasFetchedFeatureCounts.value = true

    const normalized = normalizeYinweiTokens(tab3KeyInput.value, cardSuggestions.value, 3)
    if (normalized.normalizedInput !== tab3KeyInput.value.trim()) {
      tab3KeyInput.value = normalized.normalizedInput
    }
  } catch (error) {
    console.error(t('query.components.yinweiSelector.errorFetch'), error)
  } finally {
    if (requestToken === featureRequestToken) {
      isFetchingSuggestions.value = false
    }
  }
}

async function fetchSuggestion() {
  await ensureFeatureCountsLoaded()

  if (!cardSuggestions.value.length) {
    suggestions.value = []
    showSuccessCheckmark.value = false
    return
  }

  const { legalTokens } = legalState.value
  const rawValue = String(tab3KeyInput.value)
  const tokens = rawValue
    .split(/[\s,;，；、\n\t]+/)
    .filter(Boolean)
  const endsWithSeparator = /[\s,;，；、\n\t]$/.test(rawValue)
  const currentQuery = endsWithSeparator ? '' : (tokens.at(-1) || '')

  if (legalTokens.length >= 3 && !legalTokens.includes(currentQuery) && currentQuery) {
    suggestions.value = []
    return
  }

  suggestions.value = filterYinweiSuggestions(currentQuery, cardSuggestions.value, legalTokens, aggregatedCardStats.value).slice(0, 20)

  nextTick(() => {
    const el = inputEl.value
    if (!el) return

    const rect = el.getBoundingClientRect()
    suggestionStyle.value = {
      position: 'absolute',
      left: `${rect.left + window.scrollX}px`,
      top: `${rect.top + rect.height + 6 + window.scrollY}px`,
      zIndex: 99999,
      minWidth: `${el.offsetWidth}px`
    }
  })
}

function onKeyup() {
  showSuccessCheckmark.value = legalState.value.legalTokens.length > 0
  clearTimeout(fetchSuggestionsTimer)
  fetchSuggestionsTimer = setTimeout(() => {
    fetchSuggestion()
  }, 200)
}

function onBlur() {
  setTimeout(() => {
    suggestions.value = []
    const normalized = normalizeYinweiTokens(tab3KeyInput.value, cardSuggestions.value, 3)
    if (normalized.normalizedInput !== tab3KeyInput.value.trim()) {
      tab3KeyInput.value = normalized.normalizedInput
    }
  }, 200)
}

function applySuggestion(item) {
  const parts = String(tab3KeyInput.value)
    .split(/[\s,;，；、\n\t]+/)
    .map(part => part.trim())
    .filter(Boolean)

  const normalizedExisting = normalizeYinweiTokens(parts.slice(0, -1).join(' '), cardSuggestions.value, 3).legalTokens
  const nextRaw = [...normalizedExisting, item].join(' ')
  const normalized = normalizeYinweiTokens(nextRaw, cardSuggestions.value, 3)

  tab3KeyInput.value = normalized.normalizedInput
  suggestions.value = []

  nextTick(() => {
    const el = inputEl.value
    if (!el) return
    const pos = tab3KeyInput.value.length
    el.setSelectionRange(pos, pos)
  })
}

function getSuggestionStats(item) {
  const stats = aggregatedCardStats.value?.[item]
  return {
    locationCount: stats?.locationCount || 0,
    totalCount: stats?.totalCount || 0
  }
}

defineExpose({
  tab3KeyInput,
  legalPhoValues: computed(() => legalState.value.legalTokens),
  normalizedPhoInput: computed(() => legalState.value.normalizedInput),
  ensureReady: ensureFeatureCountsLoaded
})
</script>


$primary-blue: var(--color-primary);
$success-green: var(--color-success);
$transition-duration: 0.2s;
$glass-blur: 12px;

.query-box {
  width: 100%;
  margin: 10px auto 0;

  textarea {
    box-sizing: border-box;
    width: 100%;
    padding-right: 40px;
  }

  :deep(textarea) {
    margin-bottom: 0;
  }
}

.help-trigger {
  color: $primary-blue;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
  transition: opacity $transition-duration;

  &:hover {
    text-decoration: underline;
    opacity: 0.7;
  }
}

.textarea-wrapper {
  position: relative;
  width: 100%;
}

.success-checkmark {
  position: absolute;
  top: 50%;
  right: 12px;
  color: $success-green;
  font-size: 20px;
  font-weight: bold;
  pointer-events: none;
  transform: translateY(-50%);
}

/*
 * 该元素通过 Teleport 挂载到 body，
 * 因此不能嵌套在 .query-box 或其他组件容器选择器中。
 */
.inline-suggestion {
  position: absolute !important;
  z-index: 99999 !important;
  width: max-content;
  min-width: 140px;
  max-width: min(240px, 60vw);
  max-height: 20dvh;
  padding: 8px 12px;
  overflow-y: auto;
  color: var(--text-dark);
  font-size: 14px;
  white-space: pre-line;
  pointer-events: auto !important;
  background: var(--glass-medium2) !important;
  border: 1px solid var(--border-gray-light) !important;
  border-radius: 12px;
  box-shadow: var(--shadow-lg2);
  backdrop-filter: blur($glass-blur);
  -webkit-backdrop-filter: blur($glass-blur);
  transition: background-color $transition-duration ease;
}

.suggest-line {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color $transition-duration ease;

  &:hover {
    background-color: var(--bg-blue-hover);
  }
}

.suggest-text {
  min-width: 0;
}

.suggest-counts {
  display: inline-flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  color: var(--text-dark-medium);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.suggest-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  padding: 1px 6px;
  line-height: 1.35;
  border: 1px solid transparent;
  border-radius: 999px;
  box-shadow: var(--shadow-sm2);

  &--locations {
    color: #3d7bd9;
    background: rgba(var(--color-primary-rgb), 0.08);
    border-color: rgba(var(--color-primary-rgb), 0.14);
  }

  &--total {
    color: var(--color-primary-hover);
    background: rgba(var(--color-primary-rgb), 0.14);
    border-color: rgba(var(--color-primary-rgb), 0.22);
  }
}

.input-limit-hint {
  min-width: 80%;
  max-width: 250px;
  margin: 2px auto 0;
  padding: 4px 12px;
  color: var(--color-warning);
  font-size: 13px;
  line-height: 1.4;
  text-align: center;
  background: var(--glass-lighter2);
  border: 1px solid var(--border-gray-lighter);
  border-radius: 12px;
  box-shadow: var(--shadow-sm2);
  opacity: 0.95;
  backdrop-filter: blur($glass-blur) saturate(160%);
  -webkit-backdrop-filter: blur($glass-blur) saturate(160%);
}

