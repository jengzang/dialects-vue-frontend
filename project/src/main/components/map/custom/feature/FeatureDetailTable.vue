<template>
  <section class="feature-detail-table">
    <div class="feature-detail-header">
      <button
        class="main-glass-button"
        type="button"
        @click="$emit('back')"
      >
        {{ t('customEntry.featureDetail.back') }}
      </button>
      <div class="feature-detail-heading">
        <div
          v-if="isNewFeature"
          class="feature-edit-header-inputs"
        >
          <label class="header-input-field">
            <span>{{ t('customEntry.pointDetail.rows.headers.feature') }}</span>
            <input
              v-model="localFeatureName"
              type="text"
              class="header-text-input"
              :placeholder="t('customEntry.pointDetail.placeholders.feature')"
            >
          </label>
          <label class="header-input-field">
            <span>{{ t('customEntry.pointDetail.rows.headers.phonology') }}</span>
            <input
              v-model="localPhonology"
              type="text"
              class="header-text-input"
              :placeholder="t('customEntry.pointDetail.placeholders.phonology')"
            >
          </label>
        </div>
        <h4
          v-else
          class="feature-detail-title"
        >
          {{ detailTitle }}
        </h4>
        <p class="feature-detail-description">
          {{ t('customEntry.featureDetail.description') }}
        </p>
      </div>
      <button
        class="main-glass-button"
        data-variant="primary"
        type="button"
        @click="openCreateModal"
      >
        {{ t('customEntry.featureDetail.createRecord') }}
      </button>
    </div>

    <div class="feature-detail-layout">
      <div class="feature-detail-main main-glass-panel-inner">
        <div
          v-if="loading"
          class="feature-detail-state"
        >
          {{ t('customEntry.featureDetail.loading') }}
        </div>
        <div
          v-else-if="errorMessage"
          class="feature-detail-state feature-detail-state-error"
        >
          <div>{{ errorMessage }}</div>
          <button
            class="main-glass-button"
            type="button"
            @click="loadRecords"
          >
            {{ t('customEntry.featureDetail.retry') }}
          </button>
        </div>
        <div
          v-else-if="rows.length === 0"
          class="feature-detail-state"
        >
          {{ t('customEntry.featureDetail.empty') }}
        </div>
        <div
          v-else
          class="feature-detail-table-body"
        >
          <div class="feature-detail-table-head">
            <span>{{ t('customEntry.featureDetail.headers.location') }}</span>
            <span>{{ t('customEntry.featureDetail.headers.region') }}</span>
            <span>{{ t('customEntry.featureDetail.headers.coord') }}</span>
            <span>{{ t('customEntry.featureDetail.headers.value') }}</span>
            <span>{{ t('customEntry.featureDetail.headers.note') }}</span>
            <span>{{ t('customEntry.featureDetail.headers.action') }}</span>
          </div>
          <div
            v-for="row in rows"
            :key="row.created_at || `${row['簡稱']}-${row['音典分區']}-${row['值']}`"
            class="feature-detail-row"
          >
            <span
              class="cell-location clickable-location"
              :data-label="t('customEntry.featureDetail.headers.location')"
              @click="showLocationDetail(row['簡稱'])"
            >{{ row['簡稱'] }}</span>
            <span
              class="cell-region clickable-location"
              :data-label="t('customEntry.featureDetail.headers.region')"
              @click="showRegionDetail(row['音典分區'])"
            >{{ row['音典分區'] }}</span>
            <span
              class="cell-coord"
              :data-label="t('customEntry.featureDetail.headers.coord')"
            >{{
              row['經緯度']
            }}</span>
            <span
              class="cell-value"
              :data-label="t('customEntry.featureDetail.headers.value')"
            >{{
              row['值']
            }}</span>
            <span
              class="cell-note"
              :data-label="t('customEntry.featureDetail.headers.note')"
            >{{
              row['說明'] || t('customEntry.featureDetail.emptyNote')
            }}</span>
            <div class="feature-detail-actions">
              <button
                class="feature-detail-link"
                type="button"
                @click="openEditModal(row)"
              >
                {{ t('customEntry.featureDetail.actions.edit') }}
              </button>
              <button
                class="feature-detail-link danger"
                type="button"
                @click="handleDelete(row)"
              >
                {{ t('customEntry.featureDetail.actions.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="feature-detail-side main-glass-panel-inner">
        <div class="feature-detail-map-title">
          {{ t('customEntry.featureDetail.mapTitle') }}
        </div>
        <MiniMapSelector
          mode="multi-preview"
          :readonly="true"
          :points="mapPoints"
          :hint-text="t('customEntry.featureDetail.mapHint')"
        />
      </div>
    </div>

    <FeatureRecordEditorModal
      v-model="isEditorOpen"
      :feature="modalFeature"
      :record="editingRecord"
      @saved="handleSaved"
    />

    <!-- 地点已录入特征联动弹窗 -->
    <AppModal
      v-model="isPointModalOpen"
      size="md"
      width="640px"
      max-height="80dvh"
    >
      <template #header>
        <div class="point-detail-modal-header">
          <h4 class="point-detail-modal-title">
            {{
              selectedDetailType === 'location'
                ? t('customEntry.pointDetail.modalTitle', { name: selectedDetailName })
                : t('customEntry.pointDetail.regionModalTitle', { name: selectedDetailName })
            }}
          </h4>
          <button
            class="close-btn close-btn-sm close-btn-inline"
            type="button"
            @click="isPointModalOpen = false"
          >
            ×
          </button>
        </div>
      </template>

      <div class="point-detail-modal-body">
        <div
          v-if="pointLoading"
          class="modal-loading-state"
        >
          {{ t('customEntry.featureDetail.loading') }}
        </div>
        <div
          v-else-if="pointError"
          class="modal-error-state"
        >
          {{ pointError }}
        </div>
        <div
          v-else-if="pointRecords.length === 0"
          class="modal-empty-state"
        >
          {{ t('customEntry.featureDetail.empty') }}
        </div>
        <div
          v-else
          class="modal-table-container"
        >
          <table class="modal-records-table">
            <thead>
              <tr>
                <th v-if="selectedDetailType === 'region'">
                  {{ t('customEntry.pointDetail.labels.location') }}
                </th>
                <th>{{ t('customEntry.pointDetail.rows.headers.phonology') }}</th>
                <th>{{ t('customEntry.pointDetail.rows.headers.feature') }}</th>
                <th>{{ t('customEntry.pointDetail.rows.headers.value') }}</th>
                <th>{{ t('customEntry.pointDetail.rows.headers.note') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="record in pointRecords"
                :key="record.created_at || record.id"
              >
                <td v-if="selectedDetailType === 'region'">
                  {{ record['簡稱'] }}
                </td>
                <td>{{ record['聲韻調'] }}</td>
                <td>{{ record['特徵'] }}</td>
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
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue';
import { batchDeleteCustomData, getDataByFeature, getDataByPoint } from '@/api';
import { ensureCustomDataPresence } from '@/composables/custom/useCustomDataPresence.js';
import { showConfirm, showWarning } from '@/utils/message.js';
import MiniMapSelector from '@/main/components/map/MiniMapSelector.vue';
import FeatureRecordEditorModal from './FeatureRecordEditorModal.vue';

const props = defineProps({
  feature: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['back', 'saved']);
const { t } = useI18n();

const loading = ref(false);
const errorMessage = ref('');
const rows = ref([]);
const isEditorOpen = ref(false);
const editingRecord = ref(null);

const detailTitle = computed(() => {
  const featureName =
    props.feature?.['特徵'] || props.feature?.feature || t('customEntry.featureDetail.unnamed');
  const phonology =
    props.feature?.['聲韻調'] ||
    props.feature?.phonology ||
    t('customEntry.featureDetail.uncategorized');
  return `${featureName}（${phonology}）`;
});

const mapPoints = computed(() =>
  rows.value
    .map((row) => {
      const [lngText, latText] = String(row['經緯度'] || '').split(',');
      const lng = Number(String(lngText).trim());
      const lat = Number(String(latText).trim());
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
      return {
        coord: [lng, lat],
        label: row['簡稱'] || '',
        active: editingRecord.value?.created_at === row.created_at,
      };
    })
    .filter(Boolean)
);

const localFeatureName = ref('');
const localPhonology = ref('');

const isNewFeature = computed(() => !props.feature?.['特徵'] && !props.feature?.feature);

const modalFeature = computed(() => ({
  '特徵': localFeatureName.value,
  '聲韻調': localPhonology.value
}));

const loadRecords = async () => {
  const featureName = localFeatureName.value;
  const phonology = localPhonology.value;

  if (!featureName) {
    errorMessage.value = '';
    rows.value = [];
    return;
  }

  const hasCustomData = await ensureCustomDataPresence();
  if (!hasCustomData) {
    errorMessage.value = '';
    rows.value = [];
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await getDataByFeature(featureName, phonology);
    rows.value = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    errorMessage.value = error.message || t('customEntry.featureDetail.loadFailed');
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  if (!localFeatureName.value.trim()) {
    showWarning(t('customEntry.featureRecord.messages.featureRequired') || '请先填写特征名称');
    return;
  }
  editingRecord.value = {
    簡稱: '',
    音典分區: '',
    經緯度: '',
    值: '',
    說明: '',
  };
  isEditorOpen.value = true;
};

const openEditModal = (row) => {
  editingRecord.value = { ...row };
  isEditorOpen.value = true;
};

const handleDelete = async (row) => {
  if (!row?.created_at) return;
  const confirmed = await showConfirm(t('customEntry.featureDetail.confirmDelete'));
  if (confirmed === false) return;
  await batchDeleteCustomData([row.created_at]);
  rows.value = rows.value.filter((item) => item.created_at !== row.created_at);
  emit('saved');
};

const handleSaved = async (newFeature) => {
  const targetFeature = newFeature || { '特徵': localFeatureName.value, '聲韻調': localPhonology.value };
  if (isNewFeature.value) {
    emit('saved', targetFeature);
  } else {
    await loadRecords();
    emit('saved');
  }
};

const isPointModalOpen = ref(false);
const selectedDetailType = ref('location');
const selectedDetailName = ref('');
const pointLoading = ref(false);
const pointError = ref('');
const pointRecords = ref([]);

const showLocationDetail = async (locationName) => {
  selectedDetailType.value = 'location';
  selectedDetailName.value = locationName;
  isPointModalOpen.value = true;
  pointLoading.value = true;
  pointError.value = '';
  pointRecords.value = [];

  try {
    const response = await getDataByPoint(locationName, '');
    pointRecords.value = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    pointError.value = error.message || t('customEntry.pointDetail.messages.loadFailed');
  } finally {
    pointLoading.value = false;
  }
};

const showRegionDetail = async (regionName) => {
  selectedDetailType.value = 'region';
  selectedDetailName.value = regionName;
  isPointModalOpen.value = true;
  pointLoading.value = true;
  pointError.value = '';
  pointRecords.value = [];

  try {
    const response = await getDataByPoint('', regionName);
    pointRecords.value = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    pointError.value = error.message || t('customEntry.pointDetail.messages.loadFailed');
  } finally {
    pointLoading.value = false;
  }
};

watch(
  () => props.feature,
  (newFeature) => {
    localFeatureName.value = newFeature?.['特徵'] || newFeature?.feature || '';
    localPhonology.value = newFeature?.['聲韻調'] || newFeature?.phonology || '';
    loadRecords();
  },
  { deep: true, immediate: true }
);
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

@use '../../_map-variables' as *;

@use '@/styles/main/_surfaces.scss';

.feature-detail-table {
  @include flex-col;
  gap: $spacing-lg;
}

.feature-detail-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.feature-detail-heading {
  @include flex-col;
  gap: $spacing-xs;
  flex: 1;
}

.feature-detail-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: $text-strong;
}

.feature-detail-description {
  margin: 0;
  font-size: 14px;
  color: $text-muted;
}

.feature-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr);
  gap: $spacing-lg;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
}

.feature-detail-main,
.feature-detail-side {
  max-height: 60dvh;
  overflow-y: auto;
  padding: $spacing-lg;
}

// -- States --
.feature-detail-state {
  @include flex-col;
  gap: $radius-md;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  color: $text-muted;

  &-error {
    color: $danger;
  }
}

// -- Table body --
.feature-detail-table-body {
  @include flex-col;
  gap: $spacing-sm;
}

.feature-detail-table-head,
.feature-detail-row {
  display: grid;
  grid-template-columns: 0.9fr 0.85fr 1fr 0.7fr 0.9fr auto;
  gap: $spacing-sm;
  align-items: center;
}

.feature-detail-table-head {
  padding: 0 6px;
  color: $text-muted;
  font-size: 12px;
  font-weight: 700;

  @media (max-width: 768px) {
    display: none;
  }
}

.feature-detail-row {
  padding: $radius-md 14px;
  font-size: 13px;
  color: $text-strong;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    border: 1px solid var(--bg-overlay-light2);
    padding: $radius-md;
    border-radius: $radius-md;
    background: $glass-white;
    gap: $radius-sm;
    margin-bottom: $radius-sm;

    > span {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;

      &::before {
        content: attr(data-label);
        font-weight: 600;
        color: $text-muted;
        margin-right: $radius-md;
      }
    }
  }
}

.feature-detail-actions {
  display: flex;
  gap: $radius-sm;

  @media (max-width: 768px) {
    justify-content: flex-end;
    margin-top: 4px;
    border-top: 1px solid var(--bg-hover-medium);
    padding-top: $radius-sm;
  }
}

.feature-detail-link {
  border: none;
  background: transparent;
  color: $primary;
  cursor: pointer;

  &.danger {
    color: $danger;
  }
}

.clickable-location {
  color: $primary;
  cursor: pointer;
  transition:
    text-decoration 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    text-decoration: underline;
    opacity: 0.85;
  }
}

// -- Side --
.feature-detail-map-title {
  margin-bottom: $radius-md;
  font-size: 14px;
  font-weight: 700;
  color: $text-strong;
}

// -- Edit header --
.feature-edit-header-inputs {
  display: flex;
  gap: $spacing-md;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.header-input-field {
  display: flex;
  align-items: center;
  gap: $radius-sm;

  span {
    font-size: 13px;
    font-weight: 700;
    color: $text-secondary;
  }
}

.header-text-input {
  padding: $radius-sm $radius-md;
  border: 1px solid $muted-ring;
  border-radius: $spacing-sm;
  background: $glass-medium;
  color: $text-strong;
  font-size: 14px;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
  width: 160px;

  &::placeholder {
    color: $text-light;
  }

  &:focus {
    border-color: $primary-focus;
    background: var(--text-white);
    box-shadow: 0 0 0 3px $primary-glass;
  }
}

// -- Point detail modal --
.point-detail-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.point-detail-modal-title {
  margin: 0;
  font-size: $spacing-md;
  font-weight: 700;
  color: $text-strong;
}

.point-detail-modal-body {
  padding: $spacing-md 20px;
}

.modal-loading-state,
.modal-error-state,
.modal-empty-state {
  padding: 32px;
  text-align: center;
  color: $text-muted;
  font-size: 14px;
}

.modal-error-state {
  color: $danger-light;
}

.modal-table-container {
  overflow-x: auto;
  border-radius: $radius-md;
  border: 1px solid rgba(var(--text-slate-light-rgb), 0.16);
  background: var(--glass-50);
}

.modal-records-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid $muted-subtle;
  }

  th {
    background: rgba(var(--bg-blue-tint-rgb), 0.7);
    color: $text-secondary;
    font-weight: 700;
  }

  td {
    color: $text-dark;
  }

  tr:last-child td {
    border-bottom: none;
  }
}
</style>
