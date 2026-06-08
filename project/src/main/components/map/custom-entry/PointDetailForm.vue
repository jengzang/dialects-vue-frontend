<template>
  <section class="point-detail-form">
    <div class="point-detail-header">
      <button class="main-glass-button" type="button" @click="$emit('back')">
        {{ t('customEntry.pointDetail.back') }}
      </button>
      <div class="point-detail-heading">
        <h4 class="point-detail-title">
          {{ isCreateMode ? t('customEntry.pointDetail.createTitle') : detailTitle }}
        </h4>
        <p class="point-detail-description">
          {{
            isCreateMode
              ? t('customEntry.pointDetail.createDescription')
              : t('customEntry.pointDetail.editDescription')
          }}
        </p>
      </div>
    </div>

    <div class="point-detail-layout">
      <div class="point-detail-main main-glass-panel-inner">
        <div class="point-base-fields">
          <div class="point-field">
            <span class="point-field-label">{{
              t('customEntry.pointDetail.labels.location')
            }}</span>
            <div class="location-input-wrapper">
              <input
                v-model="location"
                class="point-field-input"
                type="text"
                :placeholder="t('customEntry.pointDetail.placeholders.location')"
                @input="handleLocationInput"
                @blur="hideSuggestions"
              />
              <div
                v-if="showPointSuggestions && pointSuggestions.length > 0"
                class="point-suggestions-box"
              >
                <button
                  v-for="item in pointSuggestions"
                  :key="item"
                  class="point-suggestion-item"
                  type="button"
                  @mousedown.prevent="selectSuggestion(item)"
                >
                  {{ item }}
                </button>
              </div>
            </div>
          </div>
          <label class="point-field">
            <span class="point-field-label">{{ t('customEntry.pointDetail.labels.region') }}</span>
            <input
              v-model="region"
              class="point-field-input"
              type="text"
              :placeholder="t('customEntry.pointDetail.placeholders.region')"
            />
          </label>
          <label class="point-field point-field-full">
            <span class="point-field-label">{{ t('customEntry.pointDetail.labels.coord') }}</span>
            <input
              :value="coordText"
              class="point-field-input"
              type="text"
              readonly
              :placeholder="t('customEntry.pointDetail.placeholders.coord')"
            />
          </label>
        </div>

        <div class="point-rows-header">
          <div>
            <h5 class="point-rows-title">{{ t('customEntry.pointDetail.rows.title') }}</h5>
            <p class="point-rows-description">
              {{ t('customEntry.pointDetail.rows.description') }}
            </p>
          </div>
          <button class="main-glass-button" type="button" @click="addRow">
            {{ t('customEntry.pointDetail.rows.add') }}
          </button>
        </div>

        <div class="point-rows-table">
          <div class="point-rows-table-head">
            <span>{{ t('customEntry.pointDetail.rows.headers.phonology') }}</span>
            <span>{{ t('customEntry.pointDetail.rows.headers.feature') }}</span>
            <span>{{ t('customEntry.pointDetail.rows.headers.value') }}</span>
            <span>{{ t('customEntry.pointDetail.rows.headers.note') }}</span>
            <span>{{ t('customEntry.pointDetail.rows.headers.action') }}</span>
          </div>
          <div v-for="row in rows" :key="row.id" class="point-row">
            <div
              class="point-cell"
              :data-label="t('customEntry.pointDetail.rows.headers.phonology')"
            >
              <input
                v-model="row.聲韻調"
                class="point-row-input"
                type="text"
                :placeholder="t('customEntry.pointDetail.placeholders.phonology')"
              />
            </div>
            <div class="point-cell" :data-label="t('customEntry.pointDetail.rows.headers.feature')">
              <div class="feature-input-wrapper">
                <input
                  v-model="row.特徵"
                  class="point-row-input"
                  type="text"
                  :placeholder="t('customEntry.pointDetail.placeholders.feature')"
                />
                <button
                  v-if="row.特徵"
                  class="feature-search-emoji-btn"
                  type="button"
                  @click="showFeatureDetail(row.特徵, row.聲韻調)"
                  title="查看该特征在其他地点的分布"
                >
                  🔍
                </button>
              </div>
            </div>
            <div class="point-cell" :data-label="t('customEntry.pointDetail.rows.headers.value')">
              <input
                v-model="row.值"
                class="point-row-input"
                type="text"
                :placeholder="t('customEntry.pointDetail.placeholders.value')"
              />
            </div>
            <div class="point-cell" :data-label="t('customEntry.pointDetail.rows.headers.note')">
              <input
                v-model="row.說明"
                class="point-row-input"
                type="text"
                :placeholder="t('customEntry.pointDetail.placeholders.note')"
              />
            </div>
            <button class="point-row-remove" type="button" @click="removeRow(row.id)">
              {{ t('customEntry.pointDetail.rows.remove') }}
            </button>
          </div>
        </div>

        <div v-if="saveMessage" class="point-save-message">{{ saveMessage }}</div>

        <div class="point-detail-actions">
          <button class="main-glass-button" type="button" @click="$emit('back')">
            {{ t('customEntry.pointDetail.actions.cancel') }}
          </button>
          <button
            class="main-glass-button"
            data-variant="primary"
            type="button"
            :disabled="isSaving"
            @click="handleSave"
          >
            {{
              isSaving ? t('customEntry.common.saving') : t('customEntry.pointDetail.actions.save')
            }}
          </button>
        </div>
      </div>

      <div class="point-detail-side main-glass-panel-inner">
        <div class="point-map-title">
          {{
            isCreateMode
              ? t('customEntry.pointDetail.map.pickTitle')
              : t('customEntry.pointDetail.map.previewTitle')
          }}
        </div>
        <MiniMapSelector
          v-model:coord="coord"
          :readonly="!isRealCreateMode && isCoordValid"
          :mode="isRealCreateMode || !isCoordValid ? 'picker' : 'single-preview'"
          :points="mapPreviewPoints"
          :hint-text="
            isRealCreateMode || !isCoordValid
              ? t('customEntry.pointDetail.map.pickHint')
              : t('customEntry.pointDetail.map.previewHint')
          "
        />
      </div>
    </div>

    <!-- 特征详情联动弹窗 -->
    <AppModal v-model="isFeatureModalOpen" size="md" width="640px" max-height="80dvh">
      <template #header>
        <div class="feature-detail-modal-header">
          <h4 class="feature-detail-modal-title">
            {{
              t('customEntry.featureDetail.modalTitle', {
                feature: selectedFeatureName,
                phonology: selectedFeaturePhonology,
              })
            }}
          </h4>
          <button
            class="close-btn close-btn-sm close-btn-inline"
            type="button"
            @click="isFeatureModalOpen = false"
          >
            ×
          </button>
        </div>
      </template>

      <div class="feature-detail-modal-body">
        <div v-if="featureLoading" class="modal-loading-state">
          {{ t('customEntry.featureDetail.loading') }}
        </div>
        <div v-else-if="featureError" class="modal-error-state">
          {{ featureError }}
        </div>
        <div v-else-if="featureRecords.length === 0" class="modal-empty-state">
          {{ t('customEntry.featureDetail.empty') }}
        </div>
        <div v-else class="modal-table-container">
          <table class="modal-records-table">
            <thead>
              <tr>
                <th>{{ t('customEntry.featureDetail.headers.location') }}</th>
                <th>{{ t('customEntry.featureDetail.headers.region') }}</th>
                <th>{{ t('customEntry.featureDetail.headers.coord') }}</th>
                <th>{{ t('customEntry.featureDetail.headers.value') }}</th>
                <th>{{ t('customEntry.featureDetail.headers.note') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in featureRecords" :key="record.created_at || record.id">
                <td>{{ record['簡稱'] }}</td>
                <td>{{ record['音典分區'] }}</td>
                <td>{{ record['經緯度'] }}</td>
                <td>{{ record['值'] }}</td>
                <td>{{ record['說明'] || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppModal>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { batchMatch, getRegions } from '@/api';
import { showConfirm, showWarning } from '@/utils/message.js';
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue';
import {
  batchCreateCustomData,
  batchDeleteCustomData,
  editCustomData,
  getDataByPoint,
  getDataByFeature,
} from '@/api';
import { userStore } from '@/main/store/store.js';
import { formatCoord } from '@/utils/map/formatCoord.js';
import MiniMapSelector from './MiniMapSelector.vue';

const props = defineProps({
  point: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['back', 'saved']);
const { t } = useI18n();

const location = ref('');
const region = ref('');
const coord = ref(null);
const rows = ref([]);
const removedIds = ref([]);
const saveMessage = ref('');
const isSaving = ref(false);
const pointSuggestions = ref([]);
const showPointSuggestions = ref(false);
let locationDebounceTimer = null;
let rowSeed = 0;

const isCreateMode = computed(() => !props.point);
const autoSwitched = ref(false);
const isRealCreateMode = computed(() => isCreateMode.value && !autoSwitched.value);
const isCoordValid = computed(() => {
  return Array.isArray(coord.value) &&
    coord.value.length >= 2 &&
    Number.isFinite(coord.value[0]) &&
    Number.isFinite(coord.value[1]);
});
const detailTitle = computed(() => {
  if (isRealCreateMode.value) return t('customEntry.pointDetail.createTitle');
  return `${location.value}（${region.value}）`;
});

const coordText = computed(() =>
  isCoordValid.value ? formatCoord(coord.value[0], coord.value[1]) : ''
);
const mapPreviewPoints = computed(() => {
  if (!Array.isArray(coord.value)) return [];
  return [
    {
      coord: coord.value,
      label: location.value || t('customEntry.pointDetail.map.currentPoint'),
      active: true,
    },
  ];
});

function createEmptyRow() {
  rowSeed += 1;
  return {
    id: `row-${rowSeed}`,
    created_at: '',
    聲韻調: '',
    特徵: '',
    值: '',
    說明: '',
    original: null,
  };
}

function parseCoordText(text) {
  if (!text || typeof text !== 'string') return null;
  const [lngText, latText] = text.split(',');
  const lng = Number(String(lngText).trim());
  const lat = Number(String(latText).trim());
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

function handleLocationInput() {
  if (!isRealCreateMode.value) return;
  showPointSuggestions.value = false;
  clearTimeout(locationDebounceTimer);
  locationDebounceTimer = setTimeout(async () => {
    const query = location.value.trim();
    if (!query) {
      pointSuggestions.value = [];
      return;
    }
    try {
      const response = await batchMatch(query, false);
      if (response && response.length > 0) {
        const items = response[0].items || [];
        pointSuggestions.value = Array.from(new Set(items)).filter((item) => item !== query);
        showPointSuggestions.value = pointSuggestions.value.length > 0;
      }
    } catch (error) {
      pointSuggestions.value = [];
    }
  }, 250);
}

async function selectSuggestion(item) {
  location.value = item;
  showPointSuggestions.value = false;
  try {
    const response = await getRegions(item);
    if (response && response['音典分區']) {
      region.value = response['音典分區'];
    }
  } catch (error) {
    // ignore
  }
}

function hideSuggestions() {
  setTimeout(() => {
    showPointSuggestions.value = false;
  }, 150);
}

function rowChanged(row) {
  if (!row.created_at || !row.original) return true;

  const originalCoord = props.point?.['經緯度'] || props.point?.coordinate || '';
  const currentCoord = isCoordValid.value ? formatCoord(coord.value[0], coord.value[1]) : '';
  const isCoordChanged = currentCoord !== originalCoord;

  return (
    isCoordChanged ||
    row.聲韻調 !== (row.original.聲韻調 || '') ||
    row.特徵 !== (row.original.特徵 || '') ||
    row.值 !== (row.original.值 || '') ||
    row.說明 !== (row.original.說明 || '')
  );
}

function removeRow(id) {
  const target = rows.value.find((row) => row.id === id);
  if (target?.created_at) {
    removedIds.value.push(target.created_at);
  }
  rows.value = rows.value.filter((row) => row.id !== id);
  if (rows.value.length === 0) {
    rows.value = [createEmptyRow()];
  }
}

function addRow() {
  rows.value.push(createEmptyRow());
}

async function loadPointDetail(point) {
  location.value = point?.['簡稱'] || point?.location || '';
  region.value = point?.['音典分區'] || point?.region || '';
  coord.value = parseCoordText(point?.['經緯度'] || point?.coordinate || '');
  rows.value = [];
  removedIds.value = [];
  saveMessage.value = '';

  if (!point) {
    rows.value = [createEmptyRow()];
    return;
  }

  try {
    const response = await getDataByPoint(location.value, region.value);
    const records = Array.isArray(response?.data) ? response.data : [];
    rows.value = records.map((record) => {
      rowSeed += 1;
      return {
        id: `row-${rowSeed}`,
        created_at: record.created_at || '',
        聲韻調: record['聲韻調'] || '',
        特徵: record['特徵'] || '',
        值: record['值'] || '',
        說明: record['說明'] || '',
        original: {
          聲韻調: record['聲韻調'] || '',
          特徵: record['特徵'] || '',
          值: record['值'] || '',
          說明: record['說明'] || '',
        },
      };
    });

    if (rows.value.length === 0) {
      rows.value = [createEmptyRow()];
    }
  } catch (error) {
    saveMessage.value = error.message || t('customEntry.pointDetail.messages.loadFailed');
    rows.value = [createEmptyRow()];
  }
}

async function handleSave() {
  if (isSaving.value) return;
  saveMessage.value = '';

  if (!location.value.trim() || !region.value.trim()) {
    showWarning(t('customEntry.pointDetail.messages.locationRegionRequired'));
    return;
  }

  if (!isCoordValid.value) {
    showWarning(t('customEntry.pointDetail.messages.coordRequired'));
    return;
  }

  const validRows = rows.value.filter((row) => (row.特徵 || '').trim() && (row.值 || '').trim());
  const duplicateKeys = new Set();
  let hasDuplicate = false;
  validRows.forEach((row) => {
    const key = `${(row.聲韻調 || '').trim()}||${(row.特徵 || '').trim()}`;
    if (duplicateKeys.has(key)) hasDuplicate = true;
    duplicateKeys.add(key);
  });
  if (hasDuplicate) {
    showWarning(t('customEntry.pointDetail.rows.duplicateWarning'));
    const confirmed = await showConfirm(t('customEntry.pointDetail.messages.confirmContinue'));
    if (confirmed === false) return;
  }
  if (validRows.length === 0 && removedIds.value.length === 0) {
    showWarning(t('customEntry.pointDetail.messages.rowRequired'));
    return;
  }

  const baseRecord = {
    簡稱: location.value.trim(),
    音典分區: region.value.trim(),
    經緯度: formatCoord(coord.value[0], coord.value[1]),
    username: userStore.username,
  };

  const toCreate = [];
  const toEdit = [];

  validRows.forEach((row) => {
    const nextRecord = {
      ...baseRecord,
      聲韻調: (row.聲韻調 || '').trim(),
      特徵: (row.特徵 || '').trim(),
      值: (row.值 || '').trim(),
      說明: (row.說明 || '').trim(),
    };

    if (!row.created_at) {
      toCreate.push(nextRecord);
      return;
    }

    if (rowChanged(row)) {
      toEdit.push({
        ...nextRecord,
        created_at: row.created_at,
      });
    }
  });

  const tasks = [];
  if (toCreate.length > 0) tasks.push(batchCreateCustomData(toCreate));
  if (removedIds.value.length > 0) tasks.push(batchDeleteCustomData(removedIds.value));
  toEdit.forEach((record) => tasks.push(editCustomData(record)));

  if (tasks.length === 0) {
    showWarning(t('customEntry.pointDetail.messages.noChanges'));
    return;
  }

  isSaving.value = true;
  const results = await Promise.allSettled(tasks);
  const failedCount = results.filter((item) => item.status === 'rejected').length;

  if (failedCount > 0) {
    showWarning(t('customEntry.pointDetail.messages.partialFailed', { count: failedCount }));
    isSaving.value = false;
    return;
  }

  saveMessage.value = t('customEntry.pointDetail.messages.saveSuccess');
  isSaving.value = false;
  emit('saved');
}

const isFeatureModalOpen = ref(false);
const selectedFeatureName = ref('');
const selectedFeaturePhonology = ref('');
const featureLoading = ref(false);
const featureError = ref('');
const featureRecords = ref([]);

const showFeatureDetail = async (feature, phonology) => {
  selectedFeatureName.value = feature;
  selectedFeaturePhonology.value = phonology;
  isFeatureModalOpen.value = true;
  featureLoading.value = true;
  featureError.value = '';
  featureRecords.value = [];

  try {
    const response = await getDataByFeature(feature, phonology);
    featureRecords.value = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    featureError.value = error.message || t('customEntry.featureDetail.loadFailed');
  } finally {
    featureLoading.value = false;
  }
};

const isCheckingExisting = ref(false);

async function checkExistingPointOnCreate() {
  if (!isCreateMode.value || autoSwitched.value) return;

  const loc = location.value.trim();
  const reg = region.value.trim();
  if (!loc || !reg) return;

  isCheckingExisting.value = true;
  try {
    const response = await getDataByPoint(loc, reg);
    const records = Array.isArray(response?.data) ? response.data : [];
    if (records.length > 0) {
      autoSwitched.value = true;
      saveMessage.value = '检测到该地点已存在，已自动切换为追加/编辑模式并加载历史数据';
      
      const firstRecord = records[0];
      coord.value = parseCoordText(firstRecord['經緯度']);
      
      rows.value = records.map((record) => {
        rowSeed += 1;
        return {
          id: `row-${rowSeed}`,
          created_at: record.created_at || '',
          聲韻調: record['聲韻調'] || '',
          特徵: record['特徵'] || '',
          值: record['值'] || '',
          說明: record['說明'] || '',
          original: {
            聲韻調: record['聲韻調'] || '',
            特徵: record['特徵'] || '',
            值: record['值'] || '',
            說明: record['說明'] || '',
          },
        };
      });
    }
  } catch (error) {
    console.error('Check existing point failed:', error);
  } finally {
    isCheckingExisting.value = false;
  }
}

watch([location, region], async () => {
  if (!isCreateMode.value) return;

  // 如果用户修改了输入，且之前已经自动切换过，我们先重置状态
  if (autoSwitched.value) {
    autoSwitched.value = false;
    coord.value = null;
    rows.value = [createEmptyRow()];
    saveMessage.value = '';
  }

  await checkExistingPointOnCreate();
});

watch(
  () => props.point,
  (point) => {
    loadPointDetail(point);
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
@use '@/styles/main/_surfaces.scss';

.point-detail-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.point-detail-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.point-detail-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.point-detail-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.point-detail-description {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.point-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr);
  gap: 18px;
}

.point-detail-main,
.point-detail-side {
  padding: 18px;
}

.point-base-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.point-field {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.point-field-full {
  grid-column: 1 / -1;
}

.point-field-label {
  min-width: 56px;
  flex-shrink: 0;
}

.point-field-label,
.point-map-title,
.point-rows-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.point-field-input {
  flex: 1;
}

.point-field-input,
.point-row-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
  color: #0f172a;
  font-size: 14px;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
  box-sizing: border-box;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    border-color: rgba(0, 122, 255, 0.55);
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
  }
}

.point-rows-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
}

.point-rows-description {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.point-rows-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.point-rows-table-head,
.point-row {
  display: grid;
  grid-template-columns: 0.6fr 1fr 0.6fr 1fr auto;
  gap: 10px;
  align-items: center;
}

.point-rows-table-head {
  padding: 0 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.point-row-remove {
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
  cursor: pointer;
}

.point-detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 18px;
}

.point-map-title {
  margin-bottom: 12px;
}

.point-save-message {
  margin-top: 12px;
  font-size: 13px;
  color: #475569;
}

@media (max-width: 1100px) {
  .point-detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .point-base-fields {
    grid-template-columns: 1fr;
  }

  .point-rows-table-head {
    display: none;
  }

  .point-row {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.45);
    margin-bottom: 8px;
  }

  .point-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .point-cell::before {
    content: attr(data-label);
    font-size: 12px;
    font-weight: 700;
    color: #475569;
  }

  .point-row-remove {
    width: 100%;
    margin-top: 4px;
  }
}

.feature-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.feature-search-emoji-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  line-height: 1;
  transition: transform 0.1s ease;
  user-select: none;

  &:hover {
    transform: scale(1.15);
  }
}

.feature-input-wrapper .point-row-input {
  padding-right: 32px;
}

.feature-detail-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.feature-detail-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.feature-detail-modal-body {
  padding: 16px 20px;
}

.modal-loading-state,
.modal-error-state,
.modal-empty-state {
  padding: 32px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.modal-error-state {
  color: #ef4444;
}

.modal-table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.5);
}

.modal-records-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  }

  th {
    background: rgba(241, 245, 249, 0.7);
    color: #475569;
    font-weight: 700;
  }

  td {
    color: #334155;
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.location-input-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
}

.point-suggestions-box {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 4px;
}

.point-suggestion-item {
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  display: block;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  transition: background-color 0.18s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: rgba(0, 122, 255, 0.08);
  }
}
</style>
