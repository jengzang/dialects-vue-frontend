<template>
  <div class="chartonepage" >
    <div
      v-if="mode === 'tab1'"
      ref="contentSearchRef"
      class="content-search"
      @scroll="updateActiveCharNav"
    >
      <template v-for="(item, index) in processedData" :key="index">
        <div
          v-if="shouldShowChar(index)"
          class="char"
          :data-char-nav-id="getCharNavId(index)"
        >
          {{ item.char }}
        </div>

        <div v-if="shouldShowPositions(index)" class="positions">
          <p v-for="(pos, pIdx) in item.positions" :key="pIdx">{{ pos }}</p>
        </div>


          <div class="info-container" v-if="item.音节 && item.音节.length > 0">
            <div class="location" @click.stop="handleLocationClick(item.location)">{{ item.location }}</div>

            <div class="syllables-grid">
              <div
                  v-for="(syl, sIdx) in item.音节"
                  :key="sIdx"
                  class="syllable-unit"
              >
                <span
                  :class="[
                    getReadingClass(getSearchCharReadingType(item, sIdx), 'pronunciation'),
                    { 'conversion-failed': isConversionFailed(syl, item.location) }
                  ]"
                  @mouseenter="handleSyllableMouseEnter($event, item, sIdx, syl)"
                  @mouseleave="handleSyllableMouseLeave"
                >
                  {{ getDisplaySyllable(syl, item.location) }}
                </span>

                <span v-if="shouldShowNote(item.notes, sIdx)" class="annotation">
                {{ item.notes[sIdx] }}
              </span>
              </div>
            </div>

        </div>

        <div v-else-if="shouldShowChar(index) && !hasAnyDataForChar(index)" class="no-data-warning">
          {{ t('result.charsAndTones.noCharData') }}
        </div>
      </template>
    </div>

    <table v-if="mode === 'tab4'" class="table-tones">
        <thead>
        <tr>
          <th v-for="(header, idx) in toneHeaders" :key="idx"
              :style="idx > 0 ? { backgroundColor: colorArray[idx - 1].hex } : {}">
            {{ header }}
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(row, rIdx) in processedData" :key="rIdx">
          <td class="location-tones" @click.stop="handleLocationClick(row['簡稱'])">
            {{ row['簡稱'] }}
          </td>
          <td v-for="(toneVal, tIdx) in getToneValues(row.tones)" :key="tIdx"
              class="tones-cell-tones"
              :style="getToneStyle(toneVal, tIdx)">
            {{ formatToneText(toneVal) }}
          </td>
        </tr>
        </tbody>
    </table>

    <Teleport to="body">
      <nav
          v-if="props.showCharNav && mode === 'tab1' && charNavItems.length > 1"
          class="char-nav-teleport"
          :aria-label="t('result.charsAndTones.charNav.title')"
        >
        <button
          v-for="nav in charNavItems"
          :key="nav.id"
          type="button"
          class="char-nav-node"
          :class="{ active: activeCharNavId === nav.id }"
          :title="t('result.charsAndTones.charNav.jumpToChar', { char: nav.char })"
          :aria-label="t('result.charsAndTones.charNav.jumpToChar', { char: nav.char })"
          :aria-current="activeCharNavId === nav.id ? 'true' : undefined"
          @click="jumpToChar(nav.id)"
        >
          <span class="char-nav-char">{{ nav.char }}</span>
        </button>
      </nav>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="readingTooltip.visible"
        class="global-tooltip-popup"
        :style="{ top: readingTooltip.top + 'px', left: readingTooltip.left + 'px' }"
      >
        {{ readingTooltip.content }}
      </div>
    </Teleport>

    <LocationDetailPopup
      :visible="locationPopup.visible"
      :location-name="locationPopup.locationName"
      :data="locationPopup.data"
      :loading="locationPopup.loading"
      @close="locationPopup.visible = false"
    />

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getReadingClass, getSearchCharReadingType } from '@/main/utils/query/ResultTable.js';
import { READING_COLORS } from '@/main/config/readingColors.js';
import { getLocationDetail } from '@/api';
import LocationDetailPopup from '../popup/result/LocationDetailPopup.vue';

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  mode: {
    type: String,
    required: true // 'tab1' or 'tab4'
  },
  tone_for_chars:{
    type: Array,
    required:false,
    default: () => []
  },
  selectedToneType: {
    type: String,
    default: '默認'
  },
  showCharNav: {
  type: Boolean,
  default: false
}
});

const { t } = useI18n();

// ================= 通用數據處理 =================
const processedData = computed(() => {
  return props.data || [];
});

// ================= TAB 1 漢字導航 =================
const contentSearchRef = ref(null);
const activeCharNavId = ref('');

const getCharNavId = (index) => `char-nav-${index}`;

const charNavItems = computed(() => {
  const result = [];
  const seen = new Set();

  processedData.value.forEach((item, index) => {
    if (!item?.char || seen.has(item.char)) return;

    seen.add(item.char);
    result.push({
      id: getCharNavId(index),
      char: item.char,
      index
    });
  });

  return result;
});

const updateActiveCharNav = () => {
  const container = contentSearchRef.value;

  if (!container || charNavItems.value.length === 0) {
    activeCharNavId.value = '';
    return;
  }

  const containerTop = container.getBoundingClientRect().top;
  let currentId = charNavItems.value[0].id;

  charNavItems.value.forEach((nav) => {
    const target = container.querySelector(`[data-char-nav-id="${nav.id}"]`);
    if (!target) return;

    const offsetTop = target.getBoundingClientRect().top - containerTop;

    if (offsetTop <= 36) {
      currentId = nav.id;
    }
  });

  activeCharNavId.value = currentId;
};

const jumpToChar = async (id) => {
  await nextTick();

  const container = contentSearchRef.value;
  const target = container?.querySelector(`[data-char-nav-id="${id}"]`);

  if (!container || !target) return;

  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  container.scrollTo({
    top: container.scrollTop + targetRect.top - containerRect.top - 12,
    behavior: 'smooth'
  });

  activeCharNavId.value = id;
};

watch(
  () => [props.mode, charNavItems.value.length],
  () => {
    nextTick(() => updateActiveCharNav());
  }
);

// ================= TAB 1 邏輯 =================
const shouldShowChar = (index) => {
  if (index === 0) return true;
  return processedData.value[index].char !== processedData.value[index - 1].char;
};

const shouldShowPositions = (index) => {
  const curr = processedData.value[index];
  if (!curr.音节 || curr.音节.length === 0) {
    return false;
  }
  if (index === 0) return true;
  const prev = processedData.value[index - 1];
  if (curr.char !== prev.char) return true;
  return JSON.stringify(curr.positions) !== JSON.stringify(prev.positions);
};

// 檢查某個字符在所有地點中是否有任何數據
const hasAnyDataForChar = (index) => {
  const currentChar = processedData.value[index].char;
  // 遍歷所有數據，查找是否有任何地點有該字的音節數據
  return processedData.value.some(item =>
    item.char === currentChar && item.音节 && item.音节.length > 0
  );
};

// 🌟 新增：檢查單個音節是否有對應的註釋
const shouldShowNote = (notesArray, index) => {
  // 1. notes 必須是數組
  // 2. 該 index 必須有值
  // 3. 值不能是 "_" (後端用下劃線表示無數據)
  // 4. 值不能是空字符串
  if (!Array.isArray(notesArray) || !notesArray[index]) return false;
  const note = notesArray[index];
  return note !== "_" && note.trim() !== "";
};
// ================= 1. 構建高效查詢表 (Tone Map) =================
// 結構: { '廣州': { '1': { val: '55', cat: '陰平' }, '7a': { val: '5', cat: '上陰入' } } }
const toneMap = computed(() => {
  const map = {};

  if (!props.tone_for_chars || props.tone_for_chars.length === 0) return map;

  props.tone_for_chars.forEach(cityData => {
    const cityMap = {};
    const rawData = cityData['總數據'] || [];

    rawData.forEach(entry => {
      if (!entry) return;

      // 處理可能包含逗號的情況，如 "[7a]5上陰入,[7b]3下陰入"
      const parts = entry.split(',');

      parts.forEach(part => {
        part = part.trim();
        if (!part) return;

        // 正則解析: 匹配 [id]數字漢字
        // Group 1: ID (如 1, 7a)
        // Group 2: 數字 (調值, 如 55, 5)
        // Group 3: 剩餘部分 (調類, 如 陰平, 上陰入)
        const match = part.match(/^\[([0-9a-zA-Z]+)\](`?[\d/-]+)(.*)$/);

        if (match) {
          const id = match[1];
          const val = match[2];
          const cat = match[3];

          cityMap[id] = { val, cat };
        }
      });
    });

    map[cityData['簡稱']] = cityMap;
  });

  return map;
});

// ================= 2. 顯示轉換邏輯 =================

const getDisplaySyllable = (syllable, location) => {
  // 如果是默認模式，或者數據有問題，直接返回原始音節
  if (props.selectedToneType === '默認' || !syllable) return syllable;

  // ✨ 修復核心：
  // 舊正則: /^(.*?)([0-9a-zA-Z]+)$/  <-- 這會把拼音字母也吃掉
  // 新正則說明:
  // 1. ^(.*?)        -> 非貪婪匹配開頭的拼音部分
  // 2. (\d+[a-zA-Z]*) -> 強制以數字(\d+)開頭，後面可以跟字母(處理 7a, 9b)
  // 3. |([A-Z])$     -> 或者(|)匹配單個大寫字母結尾 (處理你提到的 A/B 結尾情況)

  const match = syllable.match(/^(.*?)(\d+[a-zA-Z]*|[A-Z])$/);

  if (!match) return syllable;

  const base = match[1];            // 拼音部分 (如 hou)
  // match[2] 是數字開頭的後綴 (如 3, 7a)
  // match[3] 是大寫字母后綴 (如 A) - 如果命中的話
  const suffix = match[2] || match[3];

  // 2. 查找映射數據
  // 這裡加個 ?. 避免 location 不存在時報錯
  const cityTones = toneMap.value?.[location];
  if (!cityTones || !cityTones[suffix]) return syllable;
  const toneInfo = cityTones[suffix];

  // 3. 根據模式返回
  if (props.selectedToneType === '調值') {
    return base + toneInfo.val;
  }
  if (props.selectedToneType === '調類') {
    return base + toneInfo.cat;
  }

  return syllable;
};
// ✨ 新增：判斷轉換是否失敗
const isConversionFailed = (syllable, location) => {
  // 1. 如果是默認模式，不算錯誤
  if (props.selectedToneType === '默認' || !syllable) return false;

  // 2. 正則檢查（使用修復後的正則）
  const match = syllable.match(/^(.*?)(\d+[a-zA-Z]*|[A-Z])$/);
  if (!match) return true; // 沒匹配到後綴 -> 視為失敗

  const suffix = match[2] || match[3];

  // 3. Map 數據檢查
  const cityTones = toneMap.value?.[location];
  if (!cityTones || !cityTones[suffix]) return true; // 有後綴但沒數據 -> 視為失敗

  return false; // 成功
};

const getReadingTypeLabel = (type) => {
  if (type === 'wendu') return '文讀';
  if (type === 'baidu') return '白讀';
  return '';
};

const getSyllableHoverTitle = (item, index, syllable) => {
  const messages = [];
  const readingLabel = getReadingTypeLabel(getSearchCharReadingType(item, index));

  if (readingLabel) {
    messages.push(readingLabel);
  }

  if (isConversionFailed(syllable, item?.location)) {
    messages.push(t('result.charsAndTones.tooltip.conversionFailed'));
  }

  return messages.join(' | ');
};

const readingTooltip = ref({
  visible: false,
  content: '',
  top: 0,
  left: 0
});

const handleSyllableMouseEnter = (event, item, index, syllable) => {
  const content = getSyllableHoverTitle(item, index, syllable);
  if (!content) return;

  const rect = event.target.getBoundingClientRect();
  readingTooltip.value = {
    visible: true,
    content,
    top: rect.top - 10,
    left: rect.left + (rect.width / 2)
  };
};

const handleSyllableMouseLeave = () => {
  readingTooltip.value.visible = false;
};
// 舊的 getNotesTitle 和 hasNotes 函數已刪除，因為不再需要 tooltip

// ================= TAB 4: 查調邏輯 =================
const toneHeaders = computed(() => [
  t('result.charsAndTones.toneHeaders.location'),
  t('result.charsAndTones.toneHeaders.yinPing'),
  t('result.charsAndTones.toneHeaders.yangPing'),
  t('result.charsAndTones.toneHeaders.yinShang'),
  t('result.charsAndTones.toneHeaders.yangShang'),
  t('result.charsAndTones.toneHeaders.yinQu'),
  t('result.charsAndTones.toneHeaders.yangQu'),
  t('result.charsAndTones.toneHeaders.yinRu'),
  t('result.charsAndTones.toneHeaders.yangRu'),
  t('result.charsAndTones.toneHeaders.otherTone'),
  t('result.charsAndTones.toneHeaders.neutralTone')
]);

const noToneValue = computed(() => t('result.charsAndTones.noToneValue'));

const colorArray = [
  { name: "Orange", hex: "#f58231" },
  { name: "Yellow", hex: "#ffe119" },
  { name: "Green", hex: "#3cb44b" },
  { name: "Cyan", hex: "#42d4f4" },
  { name: "Blue", hex: "#CCFFFF" },
  { name: "Magenta", hex: "#9999FF" },
  { name: "Pink", hex: "#fabed4" },
  { name: "Beige", hex: "#fffac8" },
  { name: "Mint", hex: "#aaffc3" },
  { name: "Lavender", hex: "#dcbfff" }
];

// 從 tones 數組提取 T1-T10 的值
const getToneValues = (tones) => {
  // tones 是一個數組 [{'T1': val}, {'T2': val}...]
  // 我們需要按順序提取值
  const keys = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10'];
  return keys.map(k => {
    const found = tones.find(t => Object.keys(t)[0] === k);
    return found ? found[k] : noToneValue.value;
  });
};

// 獲取單元格樣式 (背景色、斜線等)
const getToneStyle = (val, colIndex) => {
  if (!val || val === noToneValue.value) {
    return {
      backgroundColor: 'transparent',
      border: '1px solid #000',
      backgroundImage: 'linear-gradient(45deg, transparent 49%, #000 50%, transparent 51%)',
      backgroundSize: '15px 15px'
    };
  }

  let bgHex = colorArray[colIndex].hex;

  // 邏輯移植：如果以 T 開頭 (如 T1)，使用對應列的顏色
  if (val.startsWith("T")) {
    const targetIndex = parseInt(val.substring(1)) - 1;
    if (colorArray[targetIndex]) {
      bgHex = colorArray[targetIndex].hex;
    }
  }

  const style = { backgroundColor: bgHex };

  // 邏輯移植：數字開頭加粗
  if (/^\d/.test(val)) {
    style.fontFamily = 'Courier New, sans-serif';
    style.fontWeight = 'bold';
  }
  // 邏輯移植：` 開頭特殊字體
  else if (/^`/.test(val)) {
    style.fontFamily = 'Times New Roman, sans-serif';
  }

  return style;
};

// 格式化文字 (去除 ` 符號)
const formatToneText = (val) => {
  if (!val || val === noToneValue.value) return '';
  if (val.startsWith("`")) return val.replace(/`/g, '');
  return val;
};

// ================= 地名詳情彈窗邏輯 =================
const locationPopup = ref({
  visible: false,
  locationName: '',
  data: null,
  loading: false
});

const handleLocationClick = async (locationName) => {
  if (!locationName) return;

  locationPopup.value.visible = true;
  locationPopup.value.locationName = locationName;
  locationPopup.value.loading = true;
  locationPopup.value.data = null;

  try {
    const response = await getLocationDetail(locationName);
    locationPopup.value.data = response;
  } catch (error) {
    console.error('查詢地名數據失敗:', error);
  } finally {
    locationPopup.value.loading = false;
  }
};

onMounted(() => {
  nextTick(() => updateActiveCharNav());
});

</script>

<style lang="scss">
.chartonepage {
  max-width: 85dvw;
  min-width: 60dvw;
  height: 66dvh;
  overflow-y: auto;
  overflow-x: auto;
  padding: 8px;
  font-size: 18px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);

  display: flex;
  margin: 0 auto;
}

@media (max-aspect-ratio: 1/1) {
  .chartonepage {
    height: 60dvh;
  }
}
</style>

<style lang="scss">
.chartonepage {
  display: flex;
  min-width: 60dvw;
  max-width: 85dvw;
  height: 66dvh;
  margin: 0 auto;
  padding: 8px;
  overflow-x: auto;
  overflow-y: auto;
  font-size: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);

  @media (max-aspect-ratio: 1/1) {
    height: 60dvh;
  }
}
</style>


$primary-blue: var(--color-primary);
$deep-blue: #0038a1;
$text-black: #000;
$text-gray: var(--text-tertiary);
$transition-fast: 0.2s;
$glass-blur: 8px;

.content-search {
  position: relative;
  flex-grow: 1;
  max-height: calc(100% - 70px);
  padding: 20px;
  overflow-y: auto;
  border-radius: 12px;
  scroll-behavior: smooth;
}

.char {
  margin-top: 15px;
  margin-bottom: 1px;
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  scroll-margin-top: 12px;
}

.reading-char {
  color: inherit;

  &--wendu {
    color: v-bind('READING_COLORS.wendu');
  }

  &--baidu {
    color: v-bind('READING_COLORS.baidu');
  }
}

/*
 * 该元素通过 Teleport 挂载到 body，
 * 因此必须保持为顶层选择器。
 */
.global-tooltip-popup {
  position: fixed;
  z-index: 10001;
  max-width: 200px;
  padding: 5px 10px;
  color: #fff;
  font-size: 12px;
  pointer-events: none;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translate(-50%, -100%);
  animation: fadeIn $transition-fast ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -90%);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -100%);
  }
}

/*
 * 该元素通过 Teleport 挂载到 body，
 * 因此不能嵌套在 .chartonepage 中。
 */
.char-nav-teleport {
  position: fixed;
  top: 50%;
  right: 18px;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 10px 7px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 999px;
  box-shadow:
    inset 0 0 1px rgba(255, 255, 255, 0.45),
    0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-50%);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);

  @media (max-aspect-ratio: 1/1) {
    right: 10px;
    gap: 6px;
    padding: 8px 6px;
  }
}

.char-nav-node {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #4f5663;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.55);
  border: 0;
  border-radius: 999px;
  transition:
    transform 0.18s ease,
    color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    color: $deep-blue;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 4px 12px rgba(0, 56, 161, 0.12);
    transform: translateX(-2px) scale(1.06);
  }

  &.active {
    color: $deep-blue;
    background: rgba(0, 56, 161, 0.12);
    box-shadow:
      inset 0 0 0 1px rgba(0, 56, 161, 0.24),
      0 4px 14px rgba(0, 56, 161, 0.16);
  }

  @media (max-aspect-ratio: 1/1) {
    width: 29px;
    height: 29px;
  }
}

.char-nav-char {
  font-size: 17px;
  font-weight: 700;
  line-height: 1;

  @media (max-aspect-ratio: 1/1) {
    font-size: 16px;
  }
}

.info-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 5px;
}

.syllables-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1px 16px;
  font-family: "Times New Roman", sans-serif;
}

.syllable-unit {
  display: inline-flex;
  flex-direction: row;
  gap: 4px;
  align-items: baseline;
  white-space: nowrap;
}

.pronunciation {
  color: $text-black;
  font-size: 1.1em;
  font-weight: normal;

  &--wendu {
    color: v-bind('READING_COLORS.wendu');
  }

  &--baidu {
    color: v-bind('READING_COLORS.baidu');
  }
}

.conversion-failed {
  color: $text-gray;
  text-decoration: underline dashed;
  text-underline-offset: 3px;
  cursor: help;
}

.annotation {
  max-width: 400px;
  color: var(--text-muted)
  font-size: 0.85em;
  white-space: normal;
  word-break: break-word;

  @media (max-aspect-ratio: 1/1) {
    max-width: 200px;
  }
}

.separator {
  margin: 0 5px;
  color: #ccc;
  font-weight: bold;
}

.positions {
  margin-bottom: 15px;
  color: gray;
  font-size: 13px;
  text-align: center;

  p {
    margin: 2px 0;
  }
}

.location {
  display: inline-block;
  margin-right: 15px;
  margin-bottom: 5px;
  padding: 2px 8px;
  color: #0d5bae;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  background: rgba(0, 122, 255, 0.04);
  border: 1px solid transparent;
  border-radius: 6px;
  transition: all $transition-fast ease;

  &:hover {
    color: $primary-blue;
    background: rgba(0, 122, 255, 0.1);
    border-color: rgba(0, 122, 255, 0.25);
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.12);
    transform: translateY(-1px);
  }
}

.no-data-warning {
  margin: 10px 0;
  padding: 12px 20px;
  color: var(--color-error);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 8px;
}

.syllables {
  span {
    margin-right: 3px;
  }
}

.table-tones {
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;

  th,
  td {
    padding: 3px;
    overflow: hidden;
    font-size: 1em;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid #ddd;
  }

  th:first-child,
  td:first-child {
    position: sticky;
    left: 0;
    z-index: 10;
    background: rgba(255, 255, 255, 0.75);
    background-clip: padding-box;
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur($glass-blur);
    -webkit-backdrop-filter: blur($glass-blur);
  }

  th:first-child {
    z-index: 20;
    background: rgba(255, 255, 255, 0.9);
  }
}

.location-tones {
  width: 100px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    transform $transition-fast ease,
    background-color $transition-fast ease;

  &:hover {
    color: $deep-blue;
    cursor: pointer;
    background-color: #f4f4f4;
    transform: scale(1.15);
  }
}

.tones-cell-tones {
  box-sizing: border-box;
  width: 60px;
  overflow: hidden;
  font-size: 1em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

#loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: white;
  transition: opacity 0.3s ease;

  &.loading-hidden {
    pointer-events: none;
    opacity: 0;
  }
}

.bouncing-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bouncing-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;

  > div {
    width: 14px;
    height: 14px;
    margin: 4px;
    background: #9aa0a6;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.05);
    animation: bouncing 0.6s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes bouncing {
  0%,
  80%,
  100% {
    opacity: 0.5;
    transform: scale(0.7);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.loading-text {
  color: $text-gray;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Helvetica Neue",
    "Segoe UI",
    sans-serif;
  font-size: 16px;
}

.multi {
  position: relative;
  display: inline-block;
  margin: 0 2px;
  padding: 2px;
  font-size: 16px;
  text-decoration: none;
  cursor: pointer;
  transition: color $transition-fast ease;

  &:hover {
    color: #d33;
  }

  &::after {
    position: absolute;
    bottom: 100%;
    left: 50%;
    z-index: 9999;
    padding: 5px 8px;
    color: #fff;
    font-size: 12px;
    font-style: normal;
    white-space: nowrap;
    visibility: hidden;
    content: attr(data-title);
    pointer-events: none;
    background-color: var(--text-dark)
    border-radius: 4px;
    opacity: 0;
    transform: translateX(-50%);
    transition:
      opacity 0.3s ease,
      visibility 0.3s ease;
  }

  &:hover::after {
    visibility: visible;
    opacity: 1;
  }
}
