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
      <div class="section-title">{{ t('result.locationDetailPopup.phonologyActions.title') }}</div>
      <div class="phono-actions">
        <button type="button" class="quick-search pill-btn" @click="goToPhonology('matrix')">
          <BarIcon :icon="'⚛️'" />{{ t('result.locationDetailPopup.phonologyActions.matrix') }}
        </button>
        <button type="button" class="quick-search pill-btn" @click="openHomophoneLexicon">
          <BarIcon :icon="'📖'" />{{ t('result.locationDetailPopup.phonologyActions.homophone') }}
        </button>
        <button type="button" class="quick-search pill-btn" @click="goToPhonology('evolution')">
          <BarIcon :icon="'🥧'" />{{ t('result.locationDetailPopup.phonologyActions.evolution') }}
        </button>
        <button type="button" class="quick-search pill-btn" @click="goToPhonology('count')">
          <BarIcon :icon="'🧮'" />{{ t('result.locationDetailPopup.phonologyActions.count') }}
        </button>
      </div>

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
          <span class="info-value">
            {{ formatCoordinates(data.data[0]['經緯度']) }}
            <button
              v-if="parsedCoord"
              class="map-lookup-btn"
              :title="t('result.locationMapPopup.titleFallback')"
              @click="showMapPopup = true"
            ><InlineIcon icon="🔍" /></button>
          </span>
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

  <LocationMapPopup
    :visible="showMapPopup"
    :coord="parsedCoord"
    :location-name="data?.data?.[0]?.['語言'] || locationName"
    @close="showMapPopup = false"
  />

  <HomophoneLexiconModal
    :visible="showLexiconModal"
    :location="locationText"
    @close="showLexiconModal = false"
  />
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import BarIcon from '@/components/common/BarIcon.vue'
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { encodeQueryValueBase64Url } from '@/utils/urlParams.js'
import { pendingCountphosLocations, pendingCountphosQueryMode } from '@/main/store/store.js'
import AppModal from '@/components/common/AppModal.vue'
import LocationMapPopup from './LocationMapPopup.vue'
import HomophoneLexiconModal from '@/main/components/pho/popups/HomophoneLexiconModal.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  locationName: { type: String, default: '' },
  data: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ top: 0, left: 0 }) }
});

const emit = defineEmits(['close']);
const { t } = useI18n();
const route = useRoute()
const router = useRouter()
const showMapPopup = ref(false)
const showLexiconModal = ref(false)

const modalTitle = computed(() => `📍 ${t('result.locationDetailPopup.title', { name: props.locationName })}`)

const locationText = computed(() => props.data?.data?.[0]?.['簡稱'] || props.locationName)

const parsedCoord = computed(() => {
  const raw = props.data?.data?.[0]?.['經緯度']
  if (!raw) return null
  const parts = raw.split(',')
  if (parts.length !== 2) return null
  const lng = parseFloat(parts[0])
  const lat = parseFloat(parts[1])
  if (isNaN(lng) || isNaN(lat)) return null
  return [lng, lat]
})

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

const openHomophoneLexicon = () => {
  if (!locationText.value) return
  showLexiconModal.value = true
};

const goToPhonology = (section) => {
  const loc = locationText.value
  if (!loc) return

  emit('close')

  if (section === 'count') {
    pendingCountphosLocations.value = [loc]
    pendingCountphosQueryMode.value = { featureCounts: true, syllableCounts: true }
    router.push({
      path: buildLocalePath(resolveRouteLocale(route), '/menu/pho/count')
    })
    return
  }

  router.push({
    path: buildLocalePath(resolveRouteLocale(route), `/menu/pho/${section}`),
    query: { loc: encodeQueryValueBase64Url(loc) }
  })
};
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$text-main: var(--text-primary);
$text-body: var(--text-dark);
$text-secondary: var(--text-tertiary);

$primary: var(--color-primary);
$primary-divider: rgba(var(--color-primary-rgb), 0.2);
$primary-background-light: rgba(var(--color-primary-rgb), 0.05);
$primary-background-medium: rgba(var(--color-primary-rgb), 0.08);
$primary-background-strong: rgba(var(--color-primary-rgb), 0.1);

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
    border-radius: var(--radius-sm);
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

/* 音系跳转按钮 */
.phono-actions {
  flex-wrap: wrap;
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.quick-search {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 1;
  padding: 8px 0;
  border: 1px solid $primary-divider;
  color: $primary;
  font-size: 13px;
  font-weight: 600;
  &:hover {
    background: $primary-background-medium;
    border-color: $primary;
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
  border-radius: var(--radius-sm2);
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

.map-lookup-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  border-radius: var(--radius-sm, 4px);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  vertical-align: middle;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.08);
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
</style>
