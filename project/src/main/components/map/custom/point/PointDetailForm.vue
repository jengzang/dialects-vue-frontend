<template>
  <section class="point-detail-form">
    <div class="point-detail-header">
      <button
        class="glass-button"
        type="button"
        @click="handleBack"
      >
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

    <CustomDataSaveNotice
      :state="mutation"
      @retry="retrySave"
      @merge="reconcileUnknownSave"
    />
    <div
      class="point-detail-layout"
      :inert="locked"
    >
      <div class="point-detail-main glass-subpanel">
        <div class="point-base-fields">
          <div class="point-field">
            <span class="point-field-label">{{
              t('customEntry.pointDetail.labels.location')
            }}</span>
            <div class="location-input-wrapper">
              <input
                v-model="location"
                class="point-field-input glass-field"
                type="text"
                :placeholder="t('customEntry.pointDetail.placeholders.location')"
                @input="handleLocationInput"
                @focus="handleLocationFocus"
                @blur="hideSuggestions"
              >
              <div
                v-if="showPointSuggestions && pointSuggestions.length > 0"
                class="point-suggestions-box"
              >
                <button
                  v-for="item in pointSuggestions"
                  :key="item.key"
                  class="point-suggestion-item"
                  type="button"
                  @mousedown.prevent="selectSuggestion(item)"
                >
                  <div class="suggestion-info">
                    <span class="suggestion-location">{{ item.location }}</span>
                    <!-- <span v-if="item.region" class="suggestion-region">({{ item.region }})</span> -->
                  </div>
                  <span :class="['suggestion-badge', { archive: !item.isCustom }]">
                    {{ item.isCustom ? t('customEntry.pointList.userPointBadge') : t('customEntry.pointList.publicPointBadge') }}
                  </span>
                </button>
              </div>
            </div>
          </div>
          <label class="point-field">
            <span class="point-field-label">{{ t('customEntry.pointDetail.labels.region') }}</span>
            <input
              v-model="region"
              class="point-field-input glass-field"
              type="text"
              :placeholder="t('customEntry.pointDetail.placeholders.region')"
            >
          </label>

          <!-- Quick Select Pills -->
          <div
            v-if="isRealCreateMode && userPoints.length > 0"
            class="user-points-quick-select point-field-full"
          >
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
        </div>

        <div class="point-rows-header">
          <h5 class="point-rows-title">
            {{ t('customEntry.pointDetail.rows.title') }}
          </h5>
          <p class="point-rows-description">
            {{ t('customEntry.pointDetail.rows.description') }}
          </p>
          <button
            class="pill-btn field-notice-trigger"
            type="button"
            @click="isFieldNoticeOpen = true"
          >
            {{ t('customEntry.pointDetail.rows.noticeTrigger') }}
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
          <div
            v-for="row in rows"
            :key="row.clientRowId"
            class="point-row"
          >
            <div
              class="point-cell"
              :data-label="t('customEntry.pointDetail.rows.headers.phonology')"
            >
              <input
                v-model="row.聲韻調"
                class="point-row-input glass-field"
                type="text"
                :placeholder="t('customEntry.pointDetail.placeholders.phonology')"
              >
            </div>
            <div
              class="point-cell"
              :data-label="t('customEntry.pointDetail.rows.headers.feature')"
            >
              <div class="feature-input-wrapper">
                <input
                  v-model="row.特徵"
                  class="point-row-input glass-field"
                  type="text"
                  :placeholder="t('customEntry.pointDetail.placeholders.feature')"
                >
                <button
                  v-if="row.特徵"
                  class="feature-search-emoji-btn"
                  type="button"
                  title="查看该特征在其他地点的分布"
                  @click="showFeatureDetail(row.特徵, row.聲韻調)"
                >
                  <InlineIcon icon="🔍" />
                </button>
              </div>
            </div>
            <div
              class="point-cell"
              :data-label="t('customEntry.pointDetail.rows.headers.value')"
            >
              <input
                v-model="row.值"
                class="point-row-input glass-field"
                type="text"
                :placeholder="t('customEntry.pointDetail.placeholders.value')"
              >
            </div>
            <div
              class="point-cell"
              :data-label="t('customEntry.pointDetail.rows.headers.note')"
            >
              <input
                v-model="row.說明"
                class="point-row-input glass-field"
                type="text"
                :placeholder="t('customEntry.pointDetail.placeholders.note')"
              >
            </div>
            <button
              class="point-row-remove"
              type="button"
              @click="removeRow(row.clientRowId)"
            >
              {{ t('customEntry.pointDetail.rows.remove') }}
            </button>
          </div>
        </div>
        <div class="action-group">
          <button
            class="glass-button add-row-btn"
            type="button"
            @click="addRow"
          >
            {{ t('customEntry.pointDetail.rows.add') }}
          </button>
          <button
            class="glass-button"
            type="button"
            @click="handleBack"
          >
            {{ t('customEntry.pointDetail.actions.cancel') }}
          </button>
          <button
            class="glass-button"
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

      <div class="point-detail-side glass-subpanel">
        <div class="point-map-title">
          {{
            isCreateMode
              ? t('customEntry.pointDetail.map.pickTitle')
              : t('customEntry.pointDetail.map.previewTitle')
          }}
        </div>
        <label class="point-field point-field-full">
          <span class="point-field-label">{{ t('customEntry.pointDetail.labels.coord') }}</span>
          <input
            :value="coordText"
            class="point-field-input glass-field"
            type="text"
            readonly
            :placeholder="t('customEntry.pointDetail.placeholders.coord')"
          >
        </label>
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

    <div
      v-if="saveMessage"
      class="point-save-message"
    >
      {{ saveMessage }}
    </div>

    <!-- 字段填写注意事项弹窗 -->
    <AppModal
      v-model="isFieldNoticeOpen"
      size="sm"
      width="480px"
    >
      <template #header>
        <div class="feature-detail-modal-header">
          <h4 class="feature-detail-modal-title">
            {{ t('customEntry.pointDetail.rows.noticeTitle') }}
          </h4>
          <button
            class="close-btn close-btn-sm close-btn-inline"
            type="button"
            @click="isFieldNoticeOpen = false"
          >
            ×
          </button>
        </div>
      </template>
      <div class="field-notice-body">
        <div class="field-notice-item">
          <div class="field-notice-label">
            <span class="field-notice-tag">{{ t('customEntry.pointDetail.rows.headers.phonology') }}</span>
          </div>
          <p>{{ t('customEntry.pointDetail.rows.hints.phonology') }}</p>
        </div>
        <div class="field-notice-item">
          <div class="field-notice-label">
            <span class="field-notice-tag">{{ t('customEntry.pointDetail.rows.headers.feature') }}</span>
          </div>
          <p>{{ t('customEntry.pointDetail.rows.hints.feature') }}</p>
        </div>
        <div class="field-notice-item">
          <div class="field-notice-label">
            <span class="field-notice-tag">{{ t('customEntry.pointDetail.rows.headers.value') }}</span>
          </div>
          <p>{{ t('customEntry.pointDetail.rows.hints.value') }}</p>
        </div>
        <div class="field-notice-warning">
          {{ t('customEntry.pointDetail.rows.hints.warning') }}
        </div>
      </div>
    </AppModal>

    <!-- 特征详情联动弹窗 -->
    <AppModal
      v-model="isFeatureModalOpen"
      size="md"
      width="640px"
      max-height="80dvh"
    >
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
        <div
          v-if="featureLoading"
          class="modal-loading-state"
        >
          {{ t('customEntry.featureDetail.loading') }}
        </div>
        <div
          v-else-if="featureError"
          class="modal-error-state"
        >
          {{ featureError }}
        </div>
        <div
          v-else-if="featureRecords.length === 0"
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
                <th>{{ t('customEntry.featureDetail.headers.location') }}</th>
                <th>{{ t('customEntry.featureDetail.headers.region') }}</th>
                <th>{{ t('customEntry.featureDetail.headers.coord') }}</th>
                <th>{{ t('customEntry.featureDetail.headers.value') }}</th>
                <th>{{ t('customEntry.featureDetail.headers.note') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="record in featureRecords"
                :key="record.id"
              >
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
import InlineIcon from '@/components/common/InlineIcon.vue'
import { computed, ref, watch, nextTick } from 'vue';
import { batchMatch, getRegions, getUserPoints } from '@/api';
import { showWarning } from '@/utils/ui/message.js';
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue';
import {
  saveCustomData,
  getDataByPoint,
  getDataByFeature,
} from '@/api';
import { ensureCustomDataPresence, invalidateCustomDataPresence, markCustomDataExists } from '@/composables/data/useCustomDataPresence.js';
import { buildPointMutations } from '@/utils/user/customDataMutations.js';
import { useCustomDataSave } from '@/main/composables/useCustomDataSave.js';
import CustomDataSaveNotice from '@/main/components/user/CustomDataSaveNotice.vue';
import { formatCoord } from '@/main/utils/drawMap/formatCoord.js';
import MiniMapSelector from '@/main/components/map/MiniMapSelector.vue';

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
const detailReading=ref(false);
const detailReadFailed=ref(false);
const mutation = useCustomDataSave(saveCustomData, {leaveMessage:()=>t('user.customSafety.leave')});
const isSaving = mutation.isSaving;
const locked = mutation.locked;
let detailSequence = 0;
let matchSequence = 0;
let existingSequence = 0;
const pointSuggestions = ref([]);
const showPointSuggestions = ref(false);
const userPoints = ref([]);
const isSelectingSuggestion = ref(false);
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
    clientRowId: `row-${rowSeed}`,
    recordId: null,
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

async function loadUserPoints() {
  try {
    const response = await getUserPoints();
    userPoints.value = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    console.error('获取用户地点失败:', error);
  }
}

function handleLocationInput() {
  if (locked.value) return;
  const sequence=++matchSequence;
  if (!isRealCreateMode.value) return;
  showPointSuggestions.value = false;
  clearTimeout(locationDebounceTimer);

  const query = location.value.trim().toLowerCase();
  if (!query) {
    pointSuggestions.value = userPoints.value.map(p => ({
      key: `custom-${p['簡稱'] || p.location}-${p['音典分區'] || p.region}`,
      location: p['簡稱'] || p.location || '',
      region: p['音典分區'] || p.region || '',
      coord: p['經緯度'] || p.coordinates || '',
      isCustom: true
    }));
    showPointSuggestions.value = pointSuggestions.value.length > 0;
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

  locationDebounceTimer = setTimeout(async () => {
    try {
      const currentQuery = location.value.trim();
      const response = await batchMatch(currentQuery, false);
      if(sequence !== matchSequence || locked.value || location.value.trim() !== currentQuery) return;

      let publicItems = [];

      if (response && response.length > 0) {
        const r = response[0];
        const items = r.items || [];

        let publicValues = Array.from(new Set(items));

        // 匹配成功时，不要过滤掉 currentQuery；
        // 如果 currentQuery 在后端返回项中，就把它提到最前面
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

      pointSuggestions.value = [...matchedCustom, ...filteredPublic];
      showPointSuggestions.value = pointSuggestions.value.length > 0;
    } catch {
      if(sequence !== matchSequence || locked.value) return;
      pointSuggestions.value = matchedCustom;
      showPointSuggestions.value = pointSuggestions.value.length > 0;
    }
  }, 250);
}

function handleLocationFocus() {
  handleLocationInput();
}

async function selectSuggestion(item) {
  if (locked.value) return;
  isSelectingSuggestion.value = true;
  try {
    location.value = item.location;
    region.value = item.region;
    showPointSuggestions.value = false;

    if (item.coord) {
      const parsed = parseCoordText(item.coord);
      if (parsed) {
        coord.value = parsed;
      }
    }

    if (!region.value) {
      try {
        const response = await getRegions(item.location);
        if (response && !locked.value && location.value === item.location) {
          if (response['音典分區']) {
            region.value = response['音典分區'];
          }
          if (response['經緯度']) {
            const parsed = parseCoordText(response['經緯度']);
            if (parsed) {
              coord.value = parsed;
            }
          }
        }
      } catch {
        // ignore
      }
    }
  } finally {
    await nextTick();
    isSelectingSuggestion.value = false;
  }

  await checkExistingPointOnCreate();
}

async function selectQuickPoint(p) {
  if (locked.value) return;
  isSelectingSuggestion.value = true;
  try {
    location.value = p['簡稱'] || p.location || '';
    region.value = p['音典分區'] || p.region || '';
    const parsed = parseCoordText(p['經緯度'] || p.coordinates || '');
    if (parsed) {
      coord.value = parsed;
    } else {
      coord.value = null;
    }
  } finally {
    await nextTick();
    isSelectingSuggestion.value = false;
  }

  await checkExistingPointOnCreate();
}

function hideSuggestions() {
  setTimeout(() => {
    showPointSuggestions.value = false;
  }, 150);
}

function removeRow(id) {
  if (locked.value) return;
  const target = rows.value.find(row => row.clientRowId === id);
  if (target?.recordId) removedIds.value.push({id:target.recordId});
  rows.value = rows.value.filter(row => row.clientRowId !== id);
  if (!rows.value.length) rows.value = [createEmptyRow()];
}
function fromServer(record) {
  const row=createEmptyRow();
  return {...row, ...record, recordId:record.id, original:{...record}};
}

function addRow() {
  if (locked.value) return;
  rows.value.push(createEmptyRow());
}

async function loadPointDetail(point) {
  if (locked.value) return;
  const sequence=++detailSequence;
  const expectedLocation = point?.['簡稱'] || point?.location || '';
  const expectedRegion = point?.['音典分區'] || point?.region || '';
  const previous={location:location.value,region:region.value,coord:coord.value};
  location.value = point?.['簡稱'] || point?.location || '';
  region.value = point?.['音典分區'] || point?.region || '';
  coord.value = parseCoordText(point?.['經緯度'] || point?.coordinate || '');
  saveMessage.value = '';
  detailReadFailed.value=false;

  loadUserPoints();

  if (!point) {
    detailReading.value=false;
    removedIds.value=[];
    rows.value = [createEmptyRow()];
    return;
  }

  detailReading.value=true;
  try {
    const response = await getDataByPoint(location.value, region.value);
    const records = Array.isArray(response?.data) ? response.data : [];
    if (sequence !== detailSequence || locked.value || location.value !== expectedLocation || region.value !== expectedRegion) return;
    rows.value = records.map(fromServer);
    removedIds.value=[];

    if (rows.value.length === 0) {
      rows.value = [createEmptyRow()];
    }
  } catch (error) {
    if (sequence !== detailSequence || locked.value) return;
    detailReadFailed.value=true;
    location.value=previous.location;region.value=previous.region;coord.value=previous.coord;
    saveMessage.value = error.message || t('customEntry.pointDetail.messages.loadFailed');
  } finally {
    if(sequence===detailSequence) detailReading.value=false;
  }
}

async function handleSave() {
  if (locked.value || detailReading.value || detailReadFailed.value) return;
  mutation.reset();
  saveMessage.value = '';
  let body;
  try {
    body = buildPointMutations(rows.value, {簡稱:location.value,音典分區:region.value,經緯度:coordText.value}, removedIds.value);
  } catch (error) {
    const first=error.errors?.[0];
    saveMessage.value=first ? t('user.customSafety.rowError',{row:first.row_index+1,field:first.field,reason:t(`user.customSafety.${first.messageKey}`)}) : t('user.customSafety.failed');
    document.querySelectorAll('.point-row')[first?.row_index]?.querySelector('input')?.focus();
    return;
  }
  if (!body.creates.length && !body.updates.length && !body.deletes.length) {showWarning(t('user.customSafety.empty'));return;}
  const response = await mutation.save(body);
  if (response) finishSave(response);
}
function finishSave(response) {
  for (const created of response.created || []) {
    const row=rows.value.find(item=>item.clientRowId===created.client_row_id);
    if(row) {row.recordId=created.id;}
  }
  for(const row of rows.value) {
    if(row.recordId) row.original={簡稱:location.value.trim(),音典分區:region.value.trim(),經緯度:coordText.value,聲韻調:row.聲韻調,特徵:row.特徵,值:row.值,說明:row.說明};
  }
  removedIds.value=[];
  invalidateCustomDataPresence();
  if(response.created_count) markCustomDataExists(true);
  saveMessage.value=t('customEntry.pointDetail.messages.saveSuccess');
  emit('saved');
}
async function retrySave() {
  const response=await mutation.save({});
  if(response) finishSave(response);
}
function reconcileUnknownSave(current) {
  if (!mutation.prepareMerge()) return;
  for(const row of rows.value) {
    const latest=current.find(record=>record.id===row.recordId);
    if(latest) row.original={...latest};
  }
  mutation.reset();
}
function handleBack() { if(!locked.value) emit('back'); else showWarning(t('user.customSafety.leave')); }

const isFeatureModalOpen = ref(false);
const isFieldNoticeOpen = ref(false);
const selectedFeatureName = ref('');
const selectedFeaturePhonology = ref('');
const featureLoading = ref(false);
const featureError = ref('');
const featureRecords = ref([]);

const showFeatureDetail = async (feature, phonology) => {
  const hasCustomData = await ensureCustomDataPresence();
  if (!hasCustomData) {
    featureError.value = '';
    featureRecords.value = [];
    return;
  }

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
  if (locked.value) return;
  const sequence=++existingSequence;
  if (!isCreateMode.value || autoSwitched.value) return;

  const loc = location.value.trim();
  const reg = region.value.trim();
  if (!loc || !reg) return;

  isCheckingExisting.value = true;
  try {
    const response = await getDataByPoint(loc, reg);
    const records = Array.isArray(response?.data) ? response.data : [];
    if (sequence !== existingSequence || locked.value || location.value.trim() !== loc || region.value.trim() !== reg) return;
    if (records.length > 0) {
      autoSwitched.value = true;
      saveMessage.value = '检测到该地点已存在，已自动切换为追加/编辑模式并加载历史数据';
      
      const firstRecord = records[0];
      coord.value = parseCoordText(firstRecord['經緯度']);
      
      // Append only records not already in the draft; preserve unsaved rows.
      const existingIds=new Set(rows.value.map(row=>row.recordId));
      rows.value=[...records.filter(record=>!existingIds.has(record.id)).map(fromServer), ...rows.value];
    }
  } catch (error) {
    console.error('Check existing point failed:', error);
  } finally {
    isCheckingExisting.value = false;
  }
}

watch([location, region], async () => {
  if (!isCreateMode.value) return;
  if (isSelectingSuggestion.value) return;

  if (locked.value) return;
  // Existing rows remain the same records when their base fields change.
  if (autoSwitched.value) return;
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
@use '@/styles/global/mixins' as *;

@use '../../_map-variables' as *;

.point-detail-form {
  @include flex-col;
  gap: $spacing-lg;
}

.point-detail-header {
  --glass-button-white-space: nowrap;
  --glass-button-padding: 12px 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.point-detail-heading {
  @include flex-col;
  gap: $spacing-xs;
}

.point-detail-title {
  margin: 0;
  font-size: var(--font-size-20);
  font-weight: 700;
  color: $text-strong;
}

.point-detail-description {
  margin: 0;
  font-size: var(--font-size-14);
  color: $text-muted;
}

.point-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr);
  gap: $spacing-lg;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
}

.point-detail-main,
.point-detail-side {
  padding: $spacing-lg;
}

// -- Fields --
.point-base-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.point-field {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: $spacing-sm;

  &-full {
    grid-column: 1 / -1;
  }

  &-label {
    min-width: 56px;
    flex-shrink: 0;
  }

  &-input {
    flex: 1;
  }
}

.point-field-label,
.point-map-title,
.point-rows-title {
  font-size: var(--font-size-14);
  font-weight: 700;
  color: $text-strong;
}

.point-field-input,
.point-row-input {
  width: 100%;
}

// -- Location autocomplete --
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
  background: $glass-solid;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid $muted-hover;
  border-radius: $radius-md;
  box-shadow: 0 8px 20px var(--bg-hover-strong);
  z-index: 1000;
  margin-top: 4px;
}

.point-suggestion-item {
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  text-align: left;
  font-size: var(--font-size-13);
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
  gap: $spacing-xs;
}

.suggestion-location {
  font-weight: 700;
  color: $text-strong;
}

.suggestion-region {
  color: $text-muted;
  font-size: var(--font-size-12);
}

.suggestion-badge {
  font-size: var(--font-size-12);
  font-weight: 700;
  background: $primary-glass;
  color: $primary;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  white-space: nowrap;

  &.archive {
    background: rgba($text-subtle, 0.12);
    color: $text-subtle;
  }
}

// -- Quick select pills --
.user-points-quick-select {
  @include flex-col;
  gap: $spacing-xs;
  margin-top: $spacing-xs;
}

.quick-select-label {
  font-size: var(--font-size-12) !important;
  font-weight: 700;
  color: $text-muted !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quick-select-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  max-height: 80px;
  overflow-y: auto;
}

.quick-select-pill {
  font-size: var(--font-size-12);
  font-weight: 600;
  background: $glass-light;
  border: 1px solid $muted-hover;
  padding: 4px 10px;
  border-radius: $radius-sm;
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
  font-size: var(--font-size-12);
  color: $text-subtle;
  font-weight: 400;
  transition: color 0.18s ease;
}

// -- Rows table --
.point-rows-header {
  display: flex;
  align-items: baseline;
  gap: $radius-md;
  margin-top: $spacing-lg;

  @media (max-width: 768px), (orientation: portrait) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

.point-rows-title {
  margin: 0;
}

.point-rows-description {
  margin: 0;
  font-size: var(--font-size-13);
  color: $text-muted;
}

.point-rows-table {
  @include flex-col;
  gap: $spacing-sm;
  margin-top: $spacing-md;
}

.point-rows-table-head,
.point-row {
  display: grid;
  grid-template-columns: 0.6fr 1fr 0.6fr 1fr auto;
  gap: $spacing-sm;
  align-items: center;
}

.point-rows-table-head {
  padding: 0 6px;
  color: $text-muted;
  font-size: var(--font-size-12);
  font-weight: 700;

  @media (max-width: 768px) {
    display: none;
  }
}

.point-row {
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: $radius-md;
    padding: $spacing-md;
    border-radius: $radius-md;
    border: 1px solid var(--bg-overlay-light2);
    background: $glass-white;
    margin-bottom: $radius-sm;
  }
}

.point-row-remove {
  padding: 10px 12px;
  border: none;
  border-radius: $radius-md;
  background: rgba(var(--color-error-light-rgb), 0.12);
  color: $danger;
  cursor: pointer;

  @media (max-width: 768px) {
    width: 100%;
    margin-top: 4px;
  }
}

.point-cell {
  @media (max-width: 768px) {
    @include flex-col;
    gap: $spacing-xs;

    &::before {
      content: attr(data-label);
      font-size: var(--font-size-12);
      font-weight: 700;
      color: $text-secondary;
    }
  }
}

// -- Feature search in row --
.feature-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  .point-row-input {
    padding-right: 32px;
  }
}

.feature-search-emoji-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: var(--font-size-14);
  line-height: 1;
  transition: transform 0.1s ease;
  user-select: none;

  &:hover {
    transform: scale(1.15);
  }
}

// -- Actions --
.action-group {
  display: flex;
  justify-content: center;
  width: 100%;
  align-items: center;
  gap: $radius-md;
  margin-top: $spacing-lg;
  flex-wrap: wrap;
  --glass-button-padding: 12px 20px;
  --glass-button-white-space: nowrap;

  @media (max-width: 480px) {
    flex-direction: row;
    justify-content: flex-end;
  }
}

.add-row-btn {
  background: rgba(var(--color-success-rgb), 0.08);
  border-color: rgba(var(--color-success-rgb), 0.24);
  color: var(--color-success);

  &:hover:not(:disabled) {
    background: rgba(var(--color-success-rgb), 0.15);
    border-color: rgba(var(--color-success-rgb), 0.4);
    color: var(--color-success);
    box-shadow: 0 4px 12px rgba(var(--color-success-rgb), 0.08);
  }
}

// -- Side panel --
.point-map-title {
  margin-bottom: $radius-md;
}

.point-save-message {
  margin-top: $radius-md;
  font-size: var(--font-size-13);
  color: $text-secondary;
}

/* 字段提示触发钮: 仅尺寸/颜色覆盖, 视觉见 main/_buttons.scss 的 .pill-btn */
.field-notice-trigger {
  --pill-btn-padding: 6px 14px;
  --pill-btn-font-size: var(--font-size-12);
  --pill-btn-font-weight: 600;
  --pill-btn-color: #fff;
  --pill-btn-border: 1px solid rgb(var(--color-warning-rgb));
  --pill-btn-bg: rgb(var(--color-warning-rgb));
  --pill-btn-hover-bg: var(--color-warning-dark);
  --pill-btn-hover-border: var(--color-warning-dark);
  --pill-btn-shadow: 0 4px 14px rgba(var(--color-warning-rgb), 0.35);

  &::before {
    content: "⚠️";
    font-size: var(--font-size-13);
  }
}

.field-notice-body {
  @include flex-col;
  gap: 16px;
  padding: 4px 0;
}

.field-notice-item {
  padding: 10px 12px;
  background: var(--glass-50);
  border-radius: $radius-sm;

  p {
    margin: 8px 0 0;
    font-size: var(--font-size-13);
    color: $text-secondary;
    line-height: 1.7;
  }
}

.field-notice-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-notice-tag {
  display: inline-block;
  padding: 2px 10px;
  background: rgba(var(--color-primary-rgb), 0.08);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: var(--radius-pill);
  color: $primary;
  font-size: var(--font-size-12);
  font-weight: 600;
}

.field-notice-warning {
  padding: 10px 12px;
  background: rgba(var(--color-warning-rgb), 0.08);
  border-left: 3px solid $warning;
  border-radius: 0 $radius-sm $radius-sm 0;
  font-size: var(--font-size-13);
  color: $text-secondary;
  line-height: 1.6;
}

// -- Feature detail modal --
.feature-detail-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.feature-detail-modal-title {
  margin: 0;
  font-size: $spacing-md;
  font-weight: 700;
  color: $text-strong;
}

.feature-detail-modal-body {
  padding: $spacing-md 20px;
}

.modal-loading-state,
.modal-error-state,
.modal-empty-state {
  padding: 32px;
  text-align: center;
  color: $text-muted;
  font-size: var(--font-size-14);
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
  font-size: var(--font-size-13);

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

@media (max-width: 480px) {
  .point-detail-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
