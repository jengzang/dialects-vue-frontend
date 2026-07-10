<template>
  <AppModal
    :model-value="modelValue"
    size="sm"
    width="640px"
    max-height="88dvh"
    :close-on-backdrop="false"
    @update:modelValue="handleVisibleChange"
  >
    <template #header>
      <div class="feature-record-header">
        <h4 class="feature-record-title">
          {{
            isCreateMode
              ? t('customEntry.featureRecord.createTitle')
              : t('customEntry.featureRecord.editTitle')
          }}
        </h4>
        <button
          class="close-btn close-btn-sm close-btn-inline"
          type="button"
          :aria-label="t('customEntry.featureRecord.close')"
          @click="closeModal"
        >
          ×
        </button>
      </div>
    </template>

    <div class="feature-record-body">
      <div class="feature-record-grid">
        <div class="feature-record-field">
          <span>{{ t('customEntry.featureRecord.labels.location') }}</span>
          <div class="location-input-wrapper">
            <input
              v-model="location"
              class="feature-record-input"
              type="text"
              :placeholder="t('customEntry.featureRecord.placeholders.location')"
              @input="handleLocationInput"
              @focus="handleLocationFocus"
              @blur="hideSuggestions"
            />
            <div v-if="showSuggestions && suggestions.length > 0" class="feature-suggestions-box">
              <button
                v-for="item in suggestions"
                :key="item.key"
                class="feature-suggestion-item"
                type="button"
                @mousedown.prevent="selectSuggestion(item)"
              >
                <div class="suggestion-info">
                  <span class="suggestion-location">{{ item.location }}</span>
                </div>
                <span :class="['suggestion-badge', { archive: !item.isCustom }]">
                  {{ item.isCustom ? t('customEntry.pointList.userPointBadge') : t('customEntry.pointList.publicPointBadge') }}
                </span>
              </button>
            </div>
          </div>
        </div>
        <label class="feature-record-field">
          <span>{{ t('customEntry.featureRecord.labels.region') }}</span>
          <input
            v-model="region"
            class="feature-record-input"
            type="text"
            :placeholder="t('customEntry.featureRecord.placeholders.region')"
          />
        </label>
        
        <!-- Quick Select Pills -->
        <div v-if="userPoints.length > 0" class="user-points-quick-select feature-record-field-full">
          <span class="quick-select-label">{{ t('customEntry.featureRecord.labels.quickSelect') }}:</span>
          <div class="quick-select-list">
            <button
              v-for="p in userPoints"
              :key="p.point_key || p['簡稱']"
              class="quick-select-pill"
              type="button"
              @click="selectQuickPoint(p)"
            >
              <span class="pill-location">{{ p['簡稱'] }}</span>
              <span class="pill-region">（{{ p['音典分區'] || p.region || '未分区' }}）</span>
            </button>
          </div>
        </div>

        <!-- <div class="feature-record-grid feature-record-values"> -->
        <label class="feature-record-field">
          <span>{{ t('customEntry.featureRecord.labels.value') }}</span>
          <input
            v-model="valueField"
            class="feature-record-input"
            type="text"
            :placeholder="t('customEntry.featureRecord.placeholders.value')"
          />
        </label>
        <label class="feature-record-field">
          <span>{{ t('customEntry.featureRecord.labels.note') }}</span>
          <input
            v-model="noteField"
            class="feature-record-input"
            type="text"
            :placeholder="t('customEntry.featureRecord.placeholders.note')"
          />
        </label>
        <!-- </div> -->

        <label class="feature-record-field feature-record-field-full">
          <span>{{ t('customEntry.featureRecord.labels.coord') }}</span>
          <input
            :value="coordText"
            class="feature-record-input"
            type="text"
            readonly
            :placeholder="t('customEntry.featureRecord.placeholders.coord')"
          />
        </label>
      </div>

      <MiniMapSelector
        v-model:coord="coord"
        :mode="isCoordLocked ? 'single-preview' : 'picker'"
        :readonly="isCoordLocked"
        :hint-text="isCoordLocked ? '已锁定已有地点坐标，防止冲突' : t('customEntry.featureRecord.mapHint')"
      />

      <div v-if="message" class="feature-record-message">{{ message }}</div>
    </div>

    <template #footer>
      <button class="main-glass-button" type="button" @click="closeModal">
        {{ t('customEntry.featureRecord.actions.cancel') }}
      </button>
      <button
        class="main-glass-button"
        data-variant="primary"
        type="button"
        :disabled="isSaving"
        @click="handleSave"
      >
        {{
          isSaving ? t('customEntry.common.saving') : t('customEntry.featureRecord.actions.save')
        }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { batchMatch, getRegions } from '@/api';
import { showConfirm, showWarning } from '@/utils/message.js';
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue';
import { batchCreateCustomData, editCustomData, getDataByFeature, getDataByPoint, getUserPoints } from '@/api';
import { ensureCustomDataPresence, invalidateCustomDataPresence, markCustomDataExists } from '@/composables/custom/useCustomDataPresence.js';
import { userStore } from '@/main/store/store.js';
import { formatCoord } from '@/main/utils/drawMap/formatCoord.js';
import MiniMapSelector from '@/main/components/map/MiniMapSelector.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  feature: {
    type: Object,
    default: () => ({}),
  },
  record: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'saved']);
const { t } = useI18n();

const location = ref('');
const region = ref('');
const coord = ref(null);
const valueField = ref('');
const noteField = ref('');
const message = ref('');
const isSaving = ref(false);
const suggestions = ref([]);
const showSuggestions = ref(false);
const userPoints = ref([]);
let debounceTimer = null;

const isCoordLocked = ref(false);
const isSelectingSuggestion = ref(false);

async function checkExistingPointCoordinate() {
  const loc = location.value.trim();
  const reg = region.value.trim();
  if (!loc || !reg) {
    isCoordLocked.value = false;
    return;
  }

  try {
    const response = await getDataByPoint(loc, reg);
    const records = Array.isArray(response?.data) ? response.data : [];
    if (records.length > 0) {
      const otherRecords = records.filter((r) => !props.record?.created_at || r.created_at !== props.record.created_at);
      if (otherRecords.length > 0 && otherRecords[0]['經緯度']) {
        const parsed = parseCoordText(otherRecords[0]['經緯度']);
        if (parsed) {
          coord.value = parsed;
          isCoordLocked.value = true;
          message.value = t('customEntry.featureRecord.messages.coordinateSynced') || '已自动同步该地点的已有坐标，防止数据冲突';
          return;
        }
      }
    }
    isCoordLocked.value = false;
    if (isCreateMode.value) {
      message.value = '';
    }
  } catch (error) {
    isCoordLocked.value = false;
  }
}

watch([location, region], () => {
  if (isSelectingSuggestion.value) return;
  checkExistingPointCoordinate();
});

const isCreateMode = computed(() => !props.record?.created_at);
const coordText = computed(() =>
  Array.isArray(coord.value) ? formatCoord(coord.value[0], coord.value[1]) : ''
);

function parseCoordText(text) {
  if (!text || typeof text !== 'string') return null;
  const [lngText, latText] = text.split(',');
  const lng = Number(String(lngText).trim());
  const lat = Number(String(latText).trim());
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

async function loadUserPoints() {
  try {
    const response = await getUserPoints();
    userPoints.value = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    console.error('获取用户地点失败:', error);
  }
}

function handleLocationInput() {
  showSuggestions.value = false;
  clearTimeout(debounceTimer);

  const query = location.value.trim().toLowerCase();
  if (!query) {
    suggestions.value = userPoints.value.map(p => ({
      key: `custom-${p['簡稱'] || p.location}-${p['音典分區'] || p.region}`,
      location: p['簡稱'] || p.location || '',
      region: p['音典分區'] || p.region || '',
      coord: p['經緯度'] || p.coordinates || '',
      isCustom: true
    }));
    showSuggestions.value = suggestions.value.length > 0;
    return;
  }

  const matchedCustom = userPoints.value
    .filter(p => {
      const locName = String(p['簡稱'] || p.location || '').toLowerCase();
      const regName = String(p['音典分區'] || p.region || '').toLowerCase();
      return locName.includes(query) || regName.includes(query);
    })
    .map(p => ({
      key: `custom-${p['簡稱'] || p.location}-${p['音典分區'] || p.region}`,
      location: p['簡稱'] || p.location || '',
      region: p['音典分區'] || p.region || '',
      coord: p['經緯度'] || p.coordinates || '',
      isCustom: true
    }));

  debounceTimer = setTimeout(async () => {
    try {
      const currentQuery = location.value.trim();
      const response = await batchMatch(currentQuery, false);

      let publicItems = [];

      if (response && response.length > 0) {
        const r = response[0];
        const items = r.items || [];

        let publicValues = Array.from(new Set(items));

        // 匹配成功時，如果當前輸入本身在後端返回項中，
        // 就把它提到最前面，但不要過濾掉它
        if (r.success && currentQuery && publicValues.includes(currentQuery)) {
          publicValues = [
            currentQuery,
            ...publicValues.filter(item => item !== currentQuery)
          ];
        }

        publicItems = publicValues.map(item => ({
          key: `public-${item}`,
          location: item,
          region: '',
          coord: '',
          isCustom: false
        }));
      }

      const customLocations = new Set(matchedCustom.map(c => c.location));
      const filteredPublic = publicItems.filter(p => !customLocations.has(p.location));

      suggestions.value = [...matchedCustom, ...filteredPublic];
      showSuggestions.value = suggestions.value.length > 0;
    } catch (error) {
      suggestions.value = matchedCustom;
      showSuggestions.value = suggestions.value.length > 0;
    }
  }, 250);
}

function handleLocationFocus() {
  handleLocationInput();
}

async function selectSuggestion(item) {
  isSelectingSuggestion.value = true;
  try {
    location.value = item.location;
    region.value = item.region;
    showSuggestions.value = false;

    if (item.coord) {
      const parsed = parseCoordText(item.coord);
      if (parsed) {
        coord.value = parsed;
        isCoordLocked.value = true;
        message.value = t('customEntry.featureRecord.messages.coordinateSynced') || '已自动同步该地点的已有坐标，防止数据冲突';
      }
    } else {
      isCoordLocked.value = false;
      if (!region.value) {
        try {
          const response = await getRegions(item.location);
          if (response) {
            if (response['音典分區']) {
              region.value = response['音典分區'];
            }
            if (response['經緯度']) {
              const parsed = parseCoordText(response['經緯度']);
              if (parsed) {
                coord.value = parsed;
                isCoordLocked.value = true;
                message.value = t('customEntry.featureRecord.messages.coordinateSynced') || '已自动同步该地点的已有坐标，防止数据冲突';
              }
            }
          }
        } catch (error) {
          console.error('獲取分區/座標失敗:', error);
        }
      }
    }
  } finally {
    await nextTick();
    isSelectingSuggestion.value = false;
  }

  await checkExistingPointCoordinate();
}

async function selectQuickPoint(p) {
  isSelectingSuggestion.value = true;
  try {
    location.value = p['簡稱'] || p.location || '';
    region.value = p['音典分區'] || p.region || '';
    const parsed = parseCoordText(p['經緯度'] || p.coordinates || '');
    if (parsed) {
      coord.value = parsed;
      isCoordLocked.value = true;
      message.value = t('customEntry.featureRecord.messages.coordinateSynced') || '已自动同步该地点的已有坐标，防止数据冲突';
    } else {
      coord.value = null;
      isCoordLocked.value = false;
      message.value = '';
    }
  } finally {
    await nextTick();
    isSelectingSuggestion.value = false;
  }

  await checkExistingPointCoordinate();
}

function hideSuggestions() {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
}

function syncFromProps() {
  const record = props.record || {};
  location.value = record['簡稱'] || '';
  region.value = record['音典分區'] || '';
  coord.value = parseCoordText(record['經緯度'] || '');
  valueField.value = record['值'] || '';
  noteField.value = record['說明'] || '';
  message.value = '';
}

async function checkDuplicateLocation() {
  const featureName = props.feature?.['特徵'] || props.feature?.feature || '';
  const phonology = props.feature?.['聲韻調'] || props.feature?.phonology || '';
  if (!featureName || !location.value.trim() || !region.value.trim()) return false;

  const hasCustomData = await ensureCustomDataPresence();
  if (!hasCustomData) {
    return false;
  }

  try {
    const response = await getDataByFeature(featureName, phonology);
    const records = Array.isArray(response?.data) ? response.data : [];
    return records.some((item) => {
      if (props.record?.created_at && item.created_at === props.record.created_at) return false;
      return (
        (item['簡稱'] || '') === location.value.trim() &&
        (item['音典分區'] || '') === region.value.trim()
      );
    });
  } catch (error) {
    return false;
  }
}

function closeModal() {
  emit('update:modelValue', false);
}

function handleVisibleChange(value) {
  emit('update:modelValue', value);
}

async function handleSave() {
  if (isSaving.value) return;
  message.value = '';

  if (!location.value.trim() || !region.value.trim()) {
    showWarning(t('customEntry.featureRecord.messages.locationRegionRequired'));
    return;
  }

  if (!Array.isArray(coord.value)) {
    showWarning(t('customEntry.featureRecord.messages.coordRequired'));
    return;
  }

  if (!valueField.value.trim()) {
    showWarning(t('customEntry.featureRecord.messages.valueRequired'));
    return;
  }

  const payload = {
    簡稱: location.value.trim(),
    音典分區: region.value.trim(),
    經緯度: formatCoord(coord.value[0], coord.value[1]),
    聲韻調: props.feature?.['聲韻調'] || props.feature?.phonology || '',
    特徵: props.feature?.['特徵'] || props.feature?.feature || '',
    值: valueField.value.trim(),
    說明: noteField.value.trim(),
    username: userStore.username,
  };

  if (!payload.特徵) {
    showWarning(t('customEntry.featureRecord.messages.featureRequired'));
    return;
  }

  const duplicateExists = await checkDuplicateLocation();
  if (duplicateExists) {
    showWarning(t('customEntry.featureRecord.messages.duplicateLocation'));
    const confirmed = await showConfirm(t('customEntry.featureRecord.messages.duplicateLocation'));
    if (confirmed === false) return;
  }

  isSaving.value = true;

  if (props.record?.created_at) {
    await editCustomData({ ...payload, created_at: props.record.created_at });
    invalidateCustomDataPresence()
  } else {
    await batchCreateCustomData([payload]);
    markCustomDataExists(true)
  }

  isSaving.value = false;
  emit('saved', { '特徵': payload.特徵, '聲韻調': payload.聲韻調 });
  emit('update:modelValue', false);
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      syncFromProps();
      loadUserPoints();
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
@use '../../_map-variables' as *;

@use '@/styles/main/_surfaces.scss';

.feature-record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .feature-record-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: $text-strong;
  }
}

.feature-record-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-record-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.feature-record-field {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;

  span {
    font-size: 13px;
    font-weight: 700;
    color: $text-strong;
    min-width: 45px;
    flex-shrink: 0;
  }

  &-full {
    grid-column: 1 / -1;
  }
}

.location-input-wrapper {
  position: relative;
  width: 100%;
  flex: 1;
}

.feature-suggestions-box {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: $glass-solid;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid $muted-hover;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 4px;
}

.feature-suggestion-item {
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  border-bottom: 1px solid $muted-border;
  transition: background-color 0.18s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: $primary-subtle;
  }
}

.suggestion-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.suggestion-location {
  font-weight: 700;
  color: $text-strong;
}

.suggestion-region {
  color: $text-muted;
  font-size: 12px;
}

.suggestion-badge {
  font-size: 10px;
  font-weight: 700;
  background: $primary-glass;
  color: $primary;
  padding: 2px 6px;
  border-radius: 999px;
  white-space: nowrap;

  &.archive {
    background: rgba($text-subtle, 0.12);
    color: $text-subtle;
  }
}

.user-points-quick-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.quick-select-label {
  font-size: 11px !important;
  font-weight: 700;
  color: $text-muted !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quick-select-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 80px;
  overflow-y: auto;
}

.quick-select-pill {
  font-size: 12px;
  font-weight: 600;
  background: $glass-light;
  border: 1px solid $muted-hover;
  padding: 4px 10px;
  border-radius: 8px;
  color: $text-dark;
  cursor: pointer;
  transition: all 0.18s ease;
  display: inline-flex;
  align-items: center;
  gap: 2px;

  &:hover {
    background: $primary-subtle;
    border-color: $primary-active;
    color: $primary;

    .pill-region {
      color: rgba(var(--color-primary-rgb), 0.6);
    }
  }
}

.pill-region {
  font-size: 10px;
  color: $text-subtle;
  font-weight: 400;
  transition: color 0.18s ease;
}
</style>
