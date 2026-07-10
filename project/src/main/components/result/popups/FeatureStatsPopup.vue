<template>
  <AppModal
    :model-value="visible"
    size="sm"
    :title="modalTitle"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div v-if="loading" class="loading-state main-modal-loading-state">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <span>{{ t('result.featureStatsPopup.loading') }}</span>
    </div>

    <div v-else-if="statsData" class="stats-content">
      <div v-for="(featureName, index) in displayFeatures" :key="index" class="feature-group">
        <div class="feature-title">{{ translateResultTerm(t, featureName) }}</div>

        <div class="stats-list">
          <div
            v-for="(stat, value) in getFeatureStats(featureName)"
            :key="value"
            class="stat-item"
          >
            <div class="stat-header">
              <span class="stat-label">{{ value }}</span>
              <span class="stat-count">
                {{ t('result.featureStatsPopup.statCount', { count: stat.count, ratio: (stat.ratio * 100).toFixed(1) }) }}
              </span>
            </div>

            <div class="char-list">
              {{ getCharsString(stat.char_indices) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-state main-modal-error-state">
      <span>{{ t('result.featureStatsPopup.noData') }}</span>
    </div>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { translateResultTerm } from '@/i18n/utils/resultI18n.js';

import AppModal from '@/components/common/AppModal.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  locationName: { type: String, default: '' },
  featureKey: { type: String, default: '' },
  featureVal: { type: [String, Number], default: '' },
  statsData: { type: Object, default: null },
  charsMap: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['close']);
const { t } = useI18n();

const translatedFeatureKey = computed(() => translateResultTerm(t, props.featureKey));
const modalTitle = computed(() => `📊 ${t('result.featureStatsPopup.title', {
  location: props.locationName,
  featureKey: translatedFeatureKey.value,
  featureVal: props.featureVal
})}`)

const displayFeatures = computed(() => {
  if (!props.statsData || !props.statsData.data || !props.statsData.data[props.locationName]) {
    return [];
  }

  const locationData = props.statsData.data[props.locationName];
  return Object.keys(locationData).filter(key => key !== 'total_chars');
});

const getFeatureStats = (featureName) => {
  if (!props.statsData || !props.statsData.data || !props.statsData.data[props.locationName]) {
    return {};
  }

  const featureData = props.statsData.data[props.locationName][featureName] || {};
  const sortedEntries = Object.entries(featureData).sort((a, b) => b[1].count - a[1].count);
  return Object.fromEntries(sortedEntries);
};

const getCharsString = (charIndices) => {
  if (!charIndices || charIndices.length === 0) return '';
  return charIndices.map(idx => props.charsMap[idx]).join(' ');
};

const handleClose = () => {
  emit('close');
};
</script>


$text-main: var(--text-primary);
$text-secondary: var(--text-tertiary);

$primary: var(--color-primary);
$primary-border: rgba(0, 122, 255, 0.2);
$primary-border-hover: rgba(0, 122, 255, 0.3);
$primary-shadow: rgba(0, 122, 255, 0.1);
$primary-background-light: rgba(0, 122, 255, 0.03);

$border-color: rgba(0, 0, 0, 0.1);
$border-light: rgba(0, 0, 0, 0.05);

$card-background: rgba(255, 255, 255, 0.5);

$content-padding: 12px 16px;
$content-padding-mobile: 10px 12px;

$transition-duration: 0.2s;

.stats-content {
  font-size: 14px;
}

.feature-group {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.feature-title {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid $primary-border;
  color: $text-main;
  font-size: 16px;
  font-weight: 600;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  overflow: hidden;
  border: 1px solid $border-color;
  border-radius: 8px;
  transition:
    border-color $transition-duration ease,
    box-shadow $transition-duration ease;

  &:hover {
    border-color: $primary-border-hover;
    box-shadow: 0 2px 8px $primary-shadow;
  }
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $content-padding;
  background: $card-background;

  .stat-label {
    flex: 1;
    color: $text-main;
    font-weight: 600;
  }

  .stat-count {
    color: $text-secondary;
    font-size: 13px;
  }
}

.char-list {
  padding: $content-padding;
  background: $primary-background-light;
  border-top: 1px solid $border-light;
  color: $text-main;
  word-break: break-all;
  font-size: 14px;
  line-height: 1.8;
}

@media (max-width: 768px) {
  .stat-header,
  .char-list {
    padding: $content-padding-mobile;
  }

  .char-list {
    font-size: 13px;
  }
}

