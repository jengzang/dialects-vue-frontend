<template>
  <div class="chartonepage" >
    <div v-if="mode === 'tab1'" class="content-search">
      <template v-for="(item, index) in processedData" :key="index">
        <div v-if="shouldShowChar(index)" class="char">{{ item.char }}</div>

        <div v-if="shouldShowPositions(index)" class="positions">
          <p v-for="(pos, pIdx) in item.positions" :key="pIdx">{{ pos }}</p>
        </div>


          <div class="info-container" v-if="item.音节 && item.音节.length > 0">
            <div class="location">{{ item.location }}</div>

            <div class="syllables-grid">
              <div
                  v-for="(syl, sIdx) in item.音节"
                  :key="sIdx"
                  class="syllable-unit"
              >
                <span
                  class="pronunciation"
                  :class="{ 'conversion-failed': isConversionFailed(syl, item.location) }"
                  :title="isConversionFailed(syl, item.location) ? '可能有誤：未匹配到對應數據' : ''"
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
          當前字表暫無該字
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
          <td class="location-tones" @click.stop="showPopup($event, row['總數據'])">
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
      <div
          v-if="popup.visible"
          class="popup-tones"
          :style="{ top: popup.top + 'px', left: popup.left + 'px' }"
          v-html="popup.content"
      ></div>
    </Teleport>

  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';

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
  }
});

// ================= 通用數據處理 =================
const processedData = computed(() => {
  return props.data || [];
});

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
        const match = part.match(/^\[([0-9a-zA-Z]+)\](\d+)(.*)$/);

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
// 舊的 getNotesTitle 和 hasNotes 函數已刪除，因為不再需要 tooltip

// ================= TAB 4: 查調邏輯 =================
const toneHeaders = ['地點', '陰平', '陽平', '陰上', '陽上', '陰去', '陽去', '陰入', '陽入', '其他調', '輕聲'];

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
    return found ? found[k] : '無';
  });
};

// 獲取單元格樣式 (背景色、斜線等)
const getToneStyle = (val, colIndex) => {
  if (!val || val === "無") {
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
  if (!val || val === "無") return "";
  if (val.startsWith("`")) return val.replace(/`/g, '');
  return val;
};

// ================= 彈窗邏輯 =================
const popup = ref({ visible: false, top: 0, left: 0, content: '' });

const showPopup = (event, contentArray) => {

  // 數據保護：如果沒有詳情數據，不彈窗
  if (!contentArray || !Array.isArray(contentArray) || contentArray.length === 0) {
    // console.log('沒數據')
    return;
  }
  // console.log('有數據')
  popup.value = {
    visible: true,
    // 使用 pageX/Y 確保是相對於整個文檔的坐標 (因為 Teleport 到了 body)
    // +15 是為了讓彈窗稍微偏離鼠標一點，避免遮擋視線或誤觸
    top: event.pageY + 10,
    left: event.pageX + 10,
    content: contentArray.join('<br>') // 將數組換行顯示
  };
};

// 點擊頁面其他地方關閉彈窗
const handleGlobalClick = (e) => {
  if (popup.value.visible) {
    // 如果點擊的不是觸發按鈕 (.location-tones)，則關閉
    if (!e.target.closest('.location-tones')) {
      popup.value.visible = false;
    }
  }
};

onMounted(() => window.addEventListener('click', handleGlobalClick));
onUnmounted(() => window.removeEventListener('click', handleGlobalClick));

</script>

<style>
.chartonepage{
  max-width: 85dvw;
  min-width: 60dvw;
  height: 66dvh;
  overflow-y: auto;
  overflow-x: auto;
  padding: 20px;
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
  .chartonepage{
    height: 60dvh;
  }
}

</style>

<style scoped>
.content-search {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
  max-height: calc(100% - 70px);
  border-radius: 12px;
}

.char {
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin-top: 15px;
  margin-bottom: 1px;
}

.info-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 5px;
  border-bottom: 1px solid #eee;
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
  align-items: baseline;
  white-space: nowrap;
  gap: 4px;
}

.pronunciation {
  color: #000;
  font-weight: normal;
  font-size: 1.1em;
}

.conversion-failed {
  color: #666;
  text-decoration: underline dashed;
  text-underline-offset: 3px;
  cursor: help;
}

.annotation {
  color: #888;
  font-size: 0.85em;
  max-width: 200px;
}

.separator {
  margin: 0 5px;
  color: #ccc;
  font-weight: bold;
}

.positions {
  font-size: 13px;
  color: gray;
  text-align: center;
  margin-bottom: 15px;
}

.positions p {
  margin: 2px 0;
}

.location {
  font-size: 16px;
  color: darkblue;
  margin-bottom: 5px;
  display: inline-block;
  margin-right: 15px;
  white-space: nowrap;
}

.no-data-warning {
  text-align: center;
  padding: 12px 20px;
  margin: 10px 0;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 8px;
  color: #d32f2f;
  font-size: 14px;
  font-weight: 600;
}

.syllables span {
  margin-right: 3px;
}

.table-tones {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.table-tones th,
.table-tones td {
  border: 1px solid #ddd;
  padding: 3px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1em;
}

.table-tones th:first-child,
.table-tones td:first-child {
  position: sticky;
  left: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
  border-right: 1px solid rgba(0,0,0,0.1);
  background-clip: padding-box;
}

.table-tones th:first-child {
  z-index: 20;
  background: rgba(255, 255, 255, 0.9);
}

.location-tones {
  width: 100px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 12px;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.location-tones:hover {
  background-color: #f4f4f4;
  transform: scale(1.15);
  cursor: pointer;
  color: #0038a1;
}

.tones-cell-tones {
  width: 60px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 1em;
  box-sizing: border-box;
}

#loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  transition: opacity 0.3s ease;
}

#loading-overlay.loading-hidden {
  opacity: 0;
  pointer-events: none;
}

.bouncing-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bouncing-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}

.bouncing-loader > div {
  width: 14px;
  height: 14px;
  margin: 4px;
  background: #9aa0a6;
  border-radius: 50%;
  animation: bouncing 0.6s infinite ease-in-out;
  box-shadow: 0 0 8px rgba(0,0,0,0.05);
}

.bouncing-loader > div:nth-child(2) {
  animation-delay: 0.2s;
}

.bouncing-loader > div:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bouncing {
  0%, 80%, 100% {
    transform: scale(0.7);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  font-size: 16px;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", sans-serif;
}

.multi {
  margin: 0 2px;
  text-decoration: none;
  transition: color 0.2s ease;
  position: relative;
  display: inline-block;
  padding: 2px 2px;
  cursor: pointer;
  font-size: 16px;
}

.multi:hover {
  color: #d33;
}

.multi::after {
  content: attr(data-title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: #fff;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  z-index: 9999;
  pointer-events: none;
  font-style: normal;
}

.multi:hover::after {
  opacity: 1;
  visibility: visible;
}

.popup-tones {
  position: absolute;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.18),
    rgba(255, 255, 255, 0.05)
  );
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  padding: 15px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    inset 0 0 1px rgba(255,255,255,0.2),
    0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  min-width: 150px;
  font-size: 14px;
  color: #000000;
  z-index: 10000;
  white-space: pre-wrap;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.popup-tones h3 {
  margin-top: 0;
  font-size: 16px;
  color: #333;
}
</style>