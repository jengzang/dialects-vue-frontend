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
      <span>{{ t('result.locationDetailPopup.loading') }}</span>
    </div>

    <div v-else-if="data && data.data && data.data.length > 0" class="location-content">
      <div class="info-section">
        <div class="info-title">{{ data.data[0]['語言'] || locationName }}</div>

        <div class="info-item">
          <span class="info-label">{{ t('result.locationDetailPopup.fields.mapPartition') }}</span>
          <span class="info-value">{{ data.data[0]['地圖集二分區'] || t('result.terms.none') }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">{{ t('result.locationDetailPopup.fields.yindianPartition') }}</span>
          <span class="info-value">{{ data.data[0]['音典分區'] || t('result.terms.none') }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">{{ t('result.locationDetailPopup.fields.source') }}</span>
          <span class="info-value">{{ data.data[0]['字表來源（母本）'] || t('result.terms.none') }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">{{ t('result.locationDetailPopup.fields.coordinates') }}</span>
          <span class="info-value">{{ formatCoordinates(data.data[0]['經緯度']) }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">{{ t('result.locationDetailPopup.fields.region') }}</span>
          <span class="info-value">{{ formatAdministrativeRegion(data.data[0]) }}</span>
        </div>
      </div>

      <div class="tone-section" v-if="getToneData(data.data[0]).length > 0">
        <div class="section-title">{{ t('result.locationDetailPopup.toneSection.title') }}</div>
        <table class="tone-table">
          <thead>
            <tr>
              <th>{{ t('result.locationDetailPopup.toneSection.headers.class') }}</th>
              <th>{{ t('result.locationDetailPopup.toneSection.headers.value') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(tone, index) in getToneData(data.data[0])" :key="index">
              <td>{{ tone.label }}</td>
              <td>{{ tone.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="error-state main-modal-error-state">
      <span>{{ t('result.locationDetailPopup.noData') }}</span>
    </div>
  </AppModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  locationName: { type: String, default: '' },
  data: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ top: 0, left: 0 }) }
});

const emit = defineEmits(['close']);
const { t } = useI18n();
const modalTitle = computed(() => `📍 ${t('result.locationDetailPopup.title', { name: props.locationName })}`)

const formatAdministrativeRegion = (data) => {
  const parts = [];

  if (data['省']) parts.push(data['省']);
  if (data['市']) parts.push(data['市']);
  if (data['縣']) parts.push(data['縣']);
  if (data['鎮']) parts.push(data['鎮']);
  if (data['行政村']) parts.push(data['行政村']);
  if (data['自然村']) parts.push(data['自然村']);

  return parts.length > 0 ? parts.join('-') : t('result.terms.none');
};

const formatCoordinates = (coords) => {
  if (!coords) return t('result.terms.none');

  const parts = coords.split(',');
  if (parts.length !== 2) return coords;

  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);

  if (isNaN(lng) || isNaN(lat)) return coords;

  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
};

const getToneData = (data) => {
  const noneText = t('result.terms.none');
  const tones = [
    { key: 'T1陰平', label: 'T1' },
    { key: 'T2陽平', label: 'T2' },
    { key: 'T3陰上', label: 'T3' },
    { key: 'T4陽上', label: 'T4' },
    { key: 'T5陰去', label: 'T5' },
    { key: 'T6陽去', label: 'T6' },
    { key: 'T7陰入', label: 'T7' },
    { key: 'T8陽入', label: 'T8' },
    { key: 'T9其他調', label: 'T9' },
    { key: 'T10輕聲', label: 'T10' }
  ];

  return tones
    .map(tone => ({
      label: tone.label,
      value: data[tone.key] || noneText
    }))
    .filter(tone => tone.value !== noneText);
};

const handleClose = () => {
  emit('close');
};
</script>


$text-main: var(--text-primary);
$text-body: var(--text-dark);
$text-secondary: var(--text-tertiary);

$primary: var(--color-primary);
$primary-divider: rgba(0, 122, 255, 0.2);
$primary-background-light: rgba(0, 122, 255, 0.05);
$primary-background-medium: rgba(0, 122, 255, 0.08);
$primary-background-strong: rgba(0, 122, 255, 0.1);

$border-light: rgba(0, 0, 0, 0.05);
$border-medium: rgba(0, 0, 0, 0.08);
$border-strong: rgba(0, 0, 0, 0.1);

$transition-fast: 0.2s;

/* 内容区域 */
.location-content {
  font-size: 14px;
}

/* 基本信息 */
.info-section {
  margin-bottom: 20px;
}

.info-title {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid $primary-divider;
  color: $text-main;
  font-size: 16px;
  font-weight: 600;
}

.info-item {
  display: flex;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px solid $border-light;
  line-height: 1.6;
  transition:
    padding $transition-fast ease,
    margin $transition-fast ease,
    background $transition-fast ease,
    border-radius $transition-fast ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    margin-right: -8px;
    margin-left: -8px;
    padding-right: 8px;
    padding-left: 8px;
    background: $primary-background-light;
    border-radius: 6px;
  }

  .info-label {
    flex-shrink: 0;
    min-width: 110px;
    color: $text-secondary;
    white-space: nowrap;
    font-weight: 600;
  }

  .info-value {
    margin-left: 12px;
    color: $text-main;
    word-break: break-all;
  }
}

/* 调值区域 */
.tone-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid $border-medium;
}

.section-title {
  margin-bottom: 12px;
  color: $text-main;
  font-size: 15px;
  font-weight: 600;
}

/* 调值表格 */
.tone-table {
  width: 100%;
  overflow: hidden;
  border: 1px solid $border-strong;
  border-spacing: 0;
  border-collapse: separate;
  border-radius: 8px;
  font-size: 13px;

  th,
  td {
    padding: 10px 12px;
    text-align: left;
  }

  th {
    background: $primary-background-strong;
    border-bottom: 2px solid $primary-divider;
    color: $text-main;
    font-weight: 600;
  }

  td {
    color: $text-body;
  }

  tbody {
    tr {
      border-bottom: 1px solid $border-light;
      transition: background $transition-fast ease;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: $primary-background-medium;
      }
    }
  }
}

/* 移动端 */
@media (max-width: 768px) {
  .info-item {
    .info-label {
      min-width: 90px;
      font-size: 13px;
    }

    .info-value {
      font-size: 13px;
    }
  }
}

