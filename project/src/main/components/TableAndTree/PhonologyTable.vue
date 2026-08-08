<template>
  <div class="phonology-matrix" :class="{ 'is-fullscreen': isFullScreen }">
    <div v-if="location" class="location-header">
      <div class="location-title"><InlineIcon icon="📍" />{{ location }}</div>
      <div class="header-actions">
        <button class="tone-search-btn" @click="handleShowDetails" :disabled="isLoading">
          {{ isLoading ? t('result.phonologyTable.loadingButton') : t('result.phonologyTable.detailButton') }}
        </button>
        <button class="fullscreen-btn" @click="toggleFullScreen">
          {{ t('result.phonologyTable.fullscreen') }}
        </button>
      </div>
    </div>

    <LocationDetailPopup
      :visible="showModal"
      :location-name="location"
      :data="locationData"
      :loading="isLoading"
      @close="closeModal"
    />

    <PhonologyCellDetailModal
      :visible="showCellDetailModal"
      :location="location"
      :initial="selectedCell.initial"
      :final="selectedCell.final"
      :tone-sections="selectedCell.toneSections"
      @close="closeCellDetailModal"
    />

    <button v-if="isFullScreen" class="exit-fullscreen-btn" @click="toggleFullScreen">
      {{ t('result.phonologyTable.exitFullscreen') }}
    </button>

    <div class="matrix-wrapper">
      <table class="matrix-table">
        <thead>
        <tr>
          <th class="corner-cell" style="white-space: nowrap">{{ t('result.phonologyTable.matrixFeature') }}</th>
          <th v-for="initial in initials" :key="initial" class="initial-header">
            {{ initial || t('result.phonologyTable.zeroInitial') }}
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="final in visibleFinals" :key="final">
          <th class="final-header">{{ final || t('result.phonologyTable.zeroFinal') }}</th>
          <td
              v-for="initial in initials"
              :key="`${initial}-${final}`"
              :class="['matrix-cell', { 'is-clickable': canOpenCellDetail(initial, final) }]"
              :title="canOpenCellDetail(initial, final) ? t('result.phonologyTable.detailButton') : ''"
              @click="openCellDetail(initial, final)"
          >
            <div v-if="getCellData(initial, final)" class="cell-content">
              <div
                  v-for="tone in tones"
                  :key="tone"
                  class="tone-row"
              >
                  <span v-if="getCellData(initial, final)[tone]?.length" class="tone-label">
                    {{ tone }}:
                  </span>
                <span class="characters">
                  <template v-for="charItem in getToneCharacters(initial, final, tone)" :key="`${initial}-${final}-${tone}-${charItem.key}`">
                    <span :class="['matrix-char', charItem.className]">{{ charItem.char }}</span>
                  </template>
                </span>
              </div>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import LocationDetailPopup from '@/main/components/geo/popups/LocationDetailPopup.vue';
import PhonologyCellDetailModal from '@/main/components/pho/popups/PhonologyCellDetailModal.vue';
import { getLocationDetail } from '@/api';
import { showError } from '@/utils/ui/message.js';
import { READING_COLORS } from '@/main/config/colors/readingColors.js';

const { t } = useI18n();

const props = defineProps({
  location: {
    type: String,
    default: ''
  },
  initials: {
    type: Array,
    required: true
  },
  finals: {
    type: Array,
    required: true
  },
  tones: {
    type: Array,
    required: true
  },
  matrix: {
    type: Object,
    required: true
  },
  cellDetails: {
    type: Object,
    default: null
  },
  cellDetailEnabled: {
    type: Boolean,
    default: false
  }
})

// 使用 computed 或者直接在 template 用 props.location，不要賦值給 const location
// 這裡為了方便，我們創建一個響應式的引用（雖非必須，但如果後續要處理邏輯會方便）
const location = computed(() => props.location);

// Progressive rendering state
const visibleRowCount = ref(15); // Show first 15 rows immediately
const isFullyRendered = ref(false);

// Memoized cell data lookup for better performance
const cellDataMap = computed(() => {
  const map = new Map();
  for (const initial of props.initials) {
    for (const final of props.finals) {
      const data = props.matrix[initial]?.[final];
      if (data) {
        map.set(`${initial}-${final}`, data);
      }
    }
  }
  return map;
});

const getCellData = (initial, final) => {
  return cellDataMap.value.get(`${initial}-${final}`) || null;
};

const cellDetailMap = computed(() => {
  const map = new Map();
  if (!props.cellDetailEnabled || !props.cellDetails) return map;

  for (const initial of props.initials) {
    for (const final of props.finals) {
      const details = props.cellDetails[initial]?.[final];
      if (details) {
        map.set(`${initial}-${final}`, details);
      }
    }
  }

  return map;
});

const getCellDetails = (initial, final) => {
  return cellDetailMap.value.get(`${initial}-${final}`) || null;
};

const readingPriorityLabels = ['文白讀', '文讀', '白讀', '多音字'];

const getReadingTypeClass = (label) => {
  if (label === '文讀') return 'matrix-char--wendu';
  if (label === '白讀') return 'matrix-char--baidu';
  if (label === '文白讀') return 'matrix-char--both';
  if (label === '多音字') return 'matrix-char--polyphonic';
  return '';
};

const getToneCharacters = (initial, final, tone) => {
  const chars = getCellData(initial, final)?.[tone] || [];
  const detailItems = getCellDetails(initial, final)?.[tone] || [];

  if (!Array.isArray(chars) || chars.length === 0) {
    return [];
  }

  if (!Array.isArray(detailItems) || detailItems.length === 0) {
    return chars.map((char, index) => ({
      key: `${char}-${index}`,
      char,
      className: ''
    }));
  }

  const detailMap = new Map();
  detailItems.forEach((item) => {
    const label = item?.label;
    if (!label || !Array.isArray(item?.chars)) return;

    item.chars.forEach((char) => {
      const currentLabel = detailMap.get(char);
      const currentPriority = currentLabel ? readingPriorityLabels.indexOf(currentLabel) : Infinity;
      const nextPriority = readingPriorityLabels.indexOf(label);

      if (nextPriority !== -1 && nextPriority < currentPriority) {
        detailMap.set(char, label);
      }
    });
  });

  return chars.map((char, index) => ({
    key: `${char}-${index}`,
    char,
    className: getReadingTypeClass(detailMap.get(char))
  }));
};

const canOpenCellDetail = (initial, final) => {
  if (!props.cellDetailEnabled) return false;
  const details = getCellDetails(initial, final);
  if (!details || typeof details !== 'object') return false;
  return props.tones.some((tone) => Array.isArray(details[tone]) && details[tone].length > 0);
};

// Filter visible finals for progressive rendering
const visibleFinals = computed(() => {
  return props.finals.slice(0, visibleRowCount.value);
});

// Progressive rendering logic
onMounted(() => {
  if (props.finals.length <= 15) {
    isFullyRendered.value = true;
    return;
  }

  const renderNextChunk = () => {
    if (visibleRowCount.value < props.finals.length) {
      visibleRowCount.value = Math.min(
        visibleRowCount.value + 10,
        props.finals.length
      );
      requestAnimationFrame(renderNextChunk);
    } else {
      isFullyRendered.value = true;
    }
  };

  // Start progressive rendering after initial paint
  nextTick(() => {
    requestAnimationFrame(renderNextChunk);
  });
});

const locationData = ref(null);
const showModal = ref(false);
const isLoading = ref(false);
const isFullScreen = ref(false);
const showCellDetailModal = ref(false);
const selectedCell = ref({
  initial: '',
  final: '',
  toneSections: []
});

const applyBodyScrollLock = (locked) => {
  document.body.style.overflow = locked ? 'hidden' : '';
};

const toggleFullScreen = async () => {
  isFullScreen.value = !isFullScreen.value;
  applyBodyScrollLock(isFullScreen.value);
  await nextTick();
};

const handleKeyDown = (event) => {
  if (event.key !== 'Escape') return;

  if (showCellDetailModal.value) {
    closeCellDetailModal();
    return;
  }

  if (isFullScreen.value) {
    toggleFullScreen();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown);
  applyBodyScrollLock(false);
});

const handleShowDetails = async () => {
  if (!location.value) return;

  showModal.value = true;
  isLoading.value = true;
  locationData.value = null;

  try {
    const payload = {
      db_key: "query",
      table_name: "dialects",
      page: 1,
      page_size: 50,
      sort_by: null,
      sort_desc: false,
      search_columns: [],
      search_text: "",
      filters: {
        簡稱: [location.value]
      }
    };

    const response = await getLocationDetail(location.value)

    locationData.value = response;
  } catch (error) {
    console.error('查詢地名數據失敗:', error);
    showError('查詢失敗，請稍後重試');
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
};

const openCellDetail = (initial, final) => {
  if (!canOpenCellDetail(initial, final)) return;

  const details = getCellDetails(initial, final) || {};
  const toneSections = props.tones
    .map((tone) => ({
      tone,
      items: Array.isArray(details[tone]) ? details[tone] : []
    }))
    .filter((section) => section.items.length > 0);

  selectedCell.value = {
    initial,
    final,
    toneSections
  };
  showCellDetailModal.value = true;
};

const closeCellDetailModal = () => {
  showCellDetailModal.value = false;
};

// 格式化行政區劃
const formatAdministrativeRegion = (data) => {
  const parts = [];
  if (data.省) parts.push(data.省);
  if (data.市) parts.push(data.市);
  if (data.縣) parts.push(data.縣);
  if (data.鎮) parts.push(data.鎮);
  if (data.行政村) parts.push(data.行政村);
  if (data.自然村) parts.push(data.自然村);
  return parts.length > 0 ? parts.join('-') : ' ';
};

// 格式化經緯度（保留6位小數）
const formatCoordinates = (coords) => {
  if (!coords) return '無';
  const parts = coords.split(',');
  if (parts.length !== 2) return coords;

  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);

  if (isNaN(lng) || isNaN(lat)) return coords;

  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
};

// 提取調值數據
const getToneData = (data) => {
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
      value: data[tone.key] || '無'
    }))
    .filter(tone => tone.value !== '無');
};
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary-blue: var(--color-primary);
$text-dark: var(--text-dark);
$text-muted: var(--text-tertiary);
$glass-blur: 12px;
$button-blur: 20px;
$transition-duration: 0.25s;

@mixin sticky-cell {
  position: sticky;
  color: var(--text-dark);
  border: 1px solid var(--border-gray-lighter);
  transform: translateZ(0);
  isolation: isolate;

  &::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    content: "";
    backdrop-filter: blur($glass-blur);
    -webkit-backdrop-filter: blur($glass-blur);
  }
}

@mixin glass-button {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-md);
  backdrop-filter: blur($button-blur) saturate(180%);
  -webkit-backdrop-filter: blur($button-blur) saturate(180%);
}

.phonology-matrix {
  width: 100%;

  &.is-fullscreen {
    .matrix-wrapper {
      position: fixed;
      inset: 0;
      z-index: 99999;
      max-height: 100dvh;
      margin: 0;
      border-radius: 0;
    }
  }
}

/*
 * 保留原有级联顺序：
 * 这里的 margin-bottom 后续会被标题区域中的 margin: 0 覆盖。
 */
.location-title {
  margin-bottom: 6px;
  color: var(--text-dark-light);
  font-size: 24px;
  font-weight: 700;
  text-align: center;
}

.matrix-wrapper {
  max-height: 60dvh;
  margin-bottom: 15px;
  overflow-x: auto;
  overflow-y: auto;
  background: var(--glass-60);
  backdrop-filter: blur($glass-blur);
  -webkit-backdrop-filter: blur($glass-blur);
  border: 1px solid var(--border-gray-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md2);

  /* GPU acceleration for smooth scrolling */
  will-change: transform;
  contain: layout style;
}

.matrix-table {
  width: 100%;
  font-size: 14px;
  border-collapse: collapse;
}

.corner-cell {
  @include sticky-cell;

  top: 0;
  left: 0;
  z-index: 3;
  min-width: 60px;
  padding: 10px;
  font-weight: 700;
  background: var(--glass-50);
}

.initial-header {
  @include sticky-cell;

  top: 0;
  z-index: 2;
  min-width: 120px;
  padding: 10px;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  background: linear-gradient(
    145deg,
    rgba(var(--color-primary-rgb), 0.08),
    rgba(var(--color-primary-rgb), 0.04)
  );
}

.final-header {
  @include sticky-cell;

  left: 0;
  z-index: 1;
  min-width: 80px;
  padding: 10px;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  background: linear-gradient(
    145deg,
    rgba(var(--color-warning-rgb), 0.08),
    rgba(var(--color-warning-rgb), 0.04)
  );
}

.matrix-cell {
  min-width: 120px;
  max-width: 200px;
  padding: 8px;
  vertical-align: top;
  cursor: default;
  background: var(--glass-10);
  border: 1px solid var(--border-gray-lightest);

  /* Layout isolation for better rendering performance */
  contain: layout style paint;

  &:hover {
    background: var(--glass-20);
  }

  &.is-clickable {
    cursor: pointer;

    &:hover {
      background: rgba(59, 130, 246, 0.09);
      box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.35);
    }
  }
}

.cell-content {
  flex-direction: column;
  gap: 4px;
}

.tone-row {
  display: flex;
  gap: 6px;
  font-size: 13px;
  line-height: 1.5;
}

.tone-label {
  min-width: 35px;
  color: var(--text-dark);
  font-weight: 600;
}

.characters {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0 4px;
}

.matrix-char {
  &--wendu {
    color: v-bind("READING_COLORS.wendu");
  }

  &--baidu {
    color: v-bind("READING_COLORS.baidu");
  }

  &--both {
    color: v-bind("READING_COLORS.both");
  }

  &--polyphonic {
    color: v-bind("READING_COLORS.polyphonic");
  }
}

/*
 * 保留原始位置，后面的 .location-title 基础规则仍会覆盖
 * 此处对标题字号和 margin 的移动端设置。
 */
@media (max-aspect-ratio: 1/1) {
  .location-title {
    margin-bottom: 5px;
    font-size: 20px;
  }

  .matrix-table {
    font-size: 12px;
  }

  .corner-cell,
  .initial-header,
  .final-header {
    min-width: 40px;
    padding: 6px;
  }

  .matrix-cell {
    min-width: 100px;
    padding: 4px;
  }

  .tone-row {
    font-size: 11px;
  }

  .tone-label {
    min-width: 28px;
  }
}

/* 標題和按鈕區域 */
.location-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/*
 * 该规则位于移动端媒体查询之后，
 * 保持原代码实际生效的覆盖关系。
 */
.location-title {
  margin: 0;
  color: var(--text-dark-light);
  font-size: 24px;
  font-weight: 700;
}

.tone-search-btn {
  @include glass-button;

  color: $primary-blue;
  background: var(--glass-60);
  border: 1px solid var(--glass-30);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 var(--glass-50);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(:disabled) {
    background: var(--glass-80);
    border-color: rgba(var(--color-primary-rgb), 0.3);
    box-shadow:
      0 4px 12px rgba(var(--color-primary-rgb), 0.15),
      inset 0 1px 0 var(--glass-60);
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    box-shadow:
      0 1px 4px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 var(--glass-40);
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    transform: none;
  }
}

.fullscreen-btn {
  @include glass-button;

  color: var(--color-success);
  background: rgba(var(--color-success-rgb), 0.15);
  border: 1px solid rgba(var(--color-success-rgb), 0.35);
  transition: all $transition-duration ease;

  &:hover {
    background: rgba(var(--color-success-rgb), 0.22);
    transform: translateY(-1px);
  }
}

.exit-fullscreen-btn {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 100000;
  padding: 10px 18px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: var(--surface-glass-floating);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-pill);
  backdrop-filter: blur($button-blur) saturate(180%);
  -webkit-backdrop-filter: blur($button-blur) saturate(180%);
  transition: all $transition-duration ease;

  &:hover {
    background: var(--surface-glass-floating-strong);
    transform: scale(1.04);
  }
}

/*
 * 以下样式当前模板中未直接出现。
 * 按照不确认使用情况就不删除的原则完整保留。
 */

/* LocationDetailPopup 樣式 */
.info-section {
  margin-bottom: 16px;
}

.info-title {
  margin-bottom: 10px;
  color: $text-dark;
  font-size: 15px;
  font-weight: 600;
}

.info-item {
  display: flex;
  align-items: baseline;
  padding: 6px 0;
  font-size: 16px;
  line-height: 1.6;
}

.info-label {
  flex-shrink: 0;
  color: $text-muted;
  font-weight: 700;
  white-space: nowrap;
}

.info-value {
  margin-left: 4px;
  color: $text-dark;
  white-space: nowrap;
}

.tone-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-divider);
}

.section-title {
  margin-bottom: 8px;
  color: $text-dark;
  font-size: 14px;
  font-weight: 600;
}

.tone-mini-table {
  width: 100%;
  font-size: 12px;
  border-collapse: collapse;

  th,
  td {
    padding: 6px 8px;
    text-align: left;
    border: 1px solid var(--border-divider);
  }

  th {
    color: var(--text-medium);
    font-weight: 600;
    background: var(--bg-light-gray);
  }

  tbody {
    tr:hover {
      background: var(--bg-light-gray);
    }
  }
}

.popup-no-data {
  padding: 20px;
  color: var(--text-lightest);
  font-size: 13px;
  text-align: center;
}
</style>
