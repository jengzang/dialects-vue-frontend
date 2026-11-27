<template>
  <AppModal
    :model-value="modelValue"
    size="sm"
    width="640px"
    max-height="88dvh"
    :close-on-backdrop="false"
    @update:model-value="handleVisibleChange"
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

    <CustomDataSaveNotice
      :state="mutation"
      :retryable="isCreateMode"
      @retry="retrySave"
      @merge="reconcileUnknownSave"
    />
    <div
      class="feature-record-body"
      :inert="locked"
    >
      <div class="feature-record-grid">
        <label class="feature-record-field"><span>{{ t('customEntry.pointDetail.rows.headers.phonology') }}</span><input
          v-model="phonologyField"
          class="glass-field"
        ></label>
        <label class="feature-record-field"><span>{{ t('customEntry.pointDetail.rows.headers.feature') }}</span><input
          v-model="featureField"
          class="glass-field"
        ></label>
        <div class="feature-record-field">
          <span>{{ t('customEntry.featureRecord.labels.location') }}</span>
          <div class="location-input-wrapper">
            <input
              v-model="location"
              class="feature-record-input glass-field"
              type="text"
              :placeholder="t('customEntry.featureRecord.placeholders.location')"
              @input="handleLocationInput"
              @focus="handleLocationFocus"
              @blur="hideSuggestions"
            >
            <div
              v-if="showSuggestions && suggestions.length > 0"
              class="feature-suggestions-box"
            >
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
            class="feature-record-input glass-field"
            type="text"
            :placeholder="t('customEntry.featureRecord.placeholders.region')"
          >
        </label>
        
        <!-- Quick Select Pills -->
        <div
          v-if="userPoints.length > 0"
          class="user-points-quick-select feature-record-field-full"
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

        <!-- <div class="feature-record-grid feature-record-values"> -->
        <label class="feature-record-field">
          <span>{{ t('customEntry.featureRecord.labels.value') }}</span>
          <input
            v-model="valueField"
            class="feature-record-input glass-field"
            type="text"
            :placeholder="t('customEntry.featureRecord.placeholders.value')"
          >
          <button
            class="pill-btn field-notice-trigger field-notice-trigger--inline"
            type="button"
            @click="isFieldNoticeOpen = true"
          >
            {{ t('customEntry.pointDetail.rows.noticeTrigger') }}
          </button>
        </label>
        <label class="feature-record-field">
          <span>{{ t('customEntry.featureRecord.labels.note') }}</span>
          <input
            v-model="noteField"
            class="feature-record-input glass-field"
            type="text"
            :placeholder="t('customEntry.featureRecord.placeholders.note')"
          >
        </label>
        <!-- </div> -->

        <label class="feature-record-field feature-record-field-full">
          <span>{{ t('customEntry.featureRecord.labels.coord') }}</span>
          <input
            :value="coordText"
            class="feature-record-input glass-field"
            type="text"
            readonly
            :placeholder="t('customEntry.featureRecord.placeholders.coord')"
          >
        </label>
      </div>

      <MiniMapSelector
        v-model:coord="coord"
        :mode="isCoordLocked ? 'single-preview' : 'picker'"
        :readonly="isCoordLocked"
        :hint-text="isCoordLocked ? '已锁定已有地点坐标，防止冲突' : t('customEntry.featureRecord.mapHint')"
      />

      <div
        v-if="message"
        class="feature-record-message"
      >
        {{ message }}
      </div>
    </div>

    <template #footer>
      <button
        class="glass-button"
        type="button"
        @click="closeModal"
      >
        {{ t('customEntry.featureRecord.actions.cancel') }}
      </button>
      <button
        class="glass-button"
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
  </AppModal>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { batchMatch, getRegions } from '@/api';
import { showConfirm, showWarning } from '@/utils/ui/message.js';
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue';
import { batchUpdateCustomData, saveCustomData, getDataByFeature, getDataByPoint, getUserPoints } from '@/api';
import { ensureCustomDataPresence, invalidateCustomDataPresence, markCustomDataExists } from '@/composables/data/useCustomDataPresence.js';
import { validateRows } from '@/utils/user/customDataMutations.js';
import { useCustomDataSave } from '@/main/composables/useCustomDataSave.js';
import CustomDataSaveNotice from '@/main/components/user/CustomDataSaveNotice.vue';
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
const mutation = useCustomDataSave(body => body.updates.length ? batchUpdateCustomData(body.updates) : saveCustomData(body), {leaveMessage:()=>t('user.customSafety.leave')});
const isSaving = mutation.isSaving;
const locked = mutation.locked;
const phonologyField=ref('');
const featureField=ref('');
let coordinateSequence=0;
let matchSequence=0;
const isFieldNoticeOpen = ref(false);
const suggestions = ref([]);
const showSuggestions = ref(false);
const userPoints = ref([]);
let debounceTimer = null;

const isCoordLocked = ref(false);
const isSelectingSuggestion = ref(false);

async function checkExistingPointCoordinate() {
  if(locked.value) return;
  const sequence=++coordinateSequence;
  const loc = location.value.trim();
  const reg = region.value.trim();
  if (!loc || !reg) {
    isCoordLocked.value = false;
    return;
  }

  try {
    const response = await getDataByPoint(loc, reg);
    if(sequence !== coordinateSequence || locked.value || location.value.trim() !== loc || region.value.trim() !== reg) return;
    const records = Array.isArray(response?.data) ? response.data : [];
    if (records.length > 0) {
      const otherRecords = records.filter((r) => !props.record?.id || r.id !== props.record.id);
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
  } catch {
    isCoordLocked.value = false;
  }
}

watch([location, region], () => {
  if (isSelectingSuggestion.value) return;
  checkExistingPointCoordinate();
});

const isCreateMode = computed(() => !props.record?.id);
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
  if(locked.value) return;
  const sequence=++matchSequence;
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
      if(sequence !== matchSequence || locked.value || location.value.trim() !== currentQuery) return;

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
    } catch {
      if(sequence !== matchSequence || locked.value) return;
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
          if (response && !locked.value && location.value === item.location) {
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
  if(locked.value) return;
  mutation.reset();
  featureField.value=props.record?.['特徵'] || props.feature?.['特徵'] || props.feature?.feature || '';
  phonologyField.value=props.record?.['聲韻調'] || props.feature?.['聲韻調'] || props.feature?.phonology || '';
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
      if (props.record?.id && item.id === props.record.id) return false;
      return (
        (item['簡稱'] || '') === location.value.trim() &&
        (item['音典分區'] || '') === region.value.trim()
      );
    });
  } catch {
    return false;
  }
}

function closeModal() {
  if(locked.value) {showWarning(t('user.customSafety.leave')); return;}
  emit('update:modelValue', false);
}

function handleVisibleChange(value) {
  if(locked.value) return;
  emit('update:modelValue', value);
}

async function handleSave() {
  if(locked.value) return;
  mutation.reset();
  message.value='';
  const record={id:props.record?.id,簡稱:location.value,音典分區:region.value,經緯度:coordText.value,聲韻調:phonologyField.value,特徵:featureField.value,值:valueField.value,說明:noteField.value};
  const checked=validateRows([record],{creates:isCreateMode.value});
  if(checked.errors.length) {
    const first=checked.errors[0];
    message.value=t('user.customSafety.rowError',{row:first.row_index+1,field:first.field,reason:t(`user.customSafety.${first.messageKey}`)});
    return;
  }
  const body={creates:isCreateMode.value?checked.items:[],updates:isCreateMode.value?[]:checked.items,deletes:[]};
  const response=await mutation.save(body,{confirm:async()=>{
    if(await checkDuplicateLocation()) return showConfirm(t('customEntry.featureRecord.messages.duplicateLocation'));
    return true;
  }});
  if(response) finishSave();
}
function finishSave() {
  invalidateCustomDataPresence();
  if(isCreateMode.value) markCustomDataExists(true);
  emit('saved',{'特徵':featureField.value,'聲韻調':phonologyField.value});
  emit('update:modelValue',false);
}
async function retrySave() {if(await mutation.save({})) finishSave();}
function reconcileUnknownSave() {
  if (mutation.prepareMerge()) mutation.reset();
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
@use '@/styles/global/mixins' as *;

@use '../../_map-variables' as *;

.feature-record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .feature-record-title {
    margin: 0;
    font-size: var(--font-size-16);
    font-weight: 700;
    color: $text-strong;
  }
}

.feature-record-body {
  @include flex-col;
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
    font-size: var(--font-size-13);
    font-weight: 700;
    color: $text-strong;
    min-width: 45px;
    flex-shrink: 0;
  }

  &-full {
    grid-column: 1 / -1;
  }
}

.feature-record-input {
  width: 100%;
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
  border-radius: var(--radius-md);
  box-shadow: 0 8px 20px var(--bg-hover-strong);
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
  gap: 6px;
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

.user-points-quick-select {
  @include flex-col;
  gap: 6px;
  margin-top: 6px;
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
  gap: 6px;
  max-height: 80px;
  overflow-y: auto;
}

.quick-select-pill {
  font-size: var(--font-size-12);
  font-weight: 600;
  background: $glass-light;
  border: 1px solid $muted-hover;
  padding: 4px 10px;
  border-radius: var(--radius-sm2);
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

.feature-detail-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.feature-detail-modal-title {
  margin: 0;
  font-size: var(--font-size-16);
  font-weight: 700;
  color: $text-strong;
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

  &--inline {
    flex-shrink: 0;
    margin-left: auto;
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
</style>
