// utils/ResultTable.js
import { queryPhonology } from '@/api'
import { API_CONFIG } from '../../config/constants.js'
import { resultCache } from '../../store/store.js'
import i18n from '@/i18n'
import { showError, showWarning } from '@/utils/ui/message.js'
import {
    DEFAULT_CHARACTER_TABLE,
    getCharacterTableColumnValues
} from '@/main/config/index.js'

export function buildReverseMap(tableName = DEFAULT_CHARACTER_TABLE) {
    const columnValues = getCharacterTableColumnValues(tableName);
    const map = {};
    const conflictSet = new Set();
    for (const [field, values] of Object.entries(columnValues)) {
        for (const val of values) {
            if (!map[val]) {
                map[val] = field;
            } else {
                conflictSet.add(val);
                map[val] = null;
            }
        }
    }
    return { map, conflictSet };
}

export function parseFeatureString(featureStr, tableName = DEFAULT_CHARACTER_TABLE) {
    const columnValues = getCharacterTableColumnValues(tableName);
    const matched_fields = {};
    const usedChars = new Set();
    const { map: reverseMap } = buildReverseMap(tableName);
    const allFieldNames = Object.keys(columnValues);
    const allValues = Object.values(columnValues).flat();

    const hasAnyValue = allValues.some(val => featureStr.includes(val));
    if (!hasAnyValue) {
        return { matched_fields: null, unmatched_fields: allFieldNames };
    }

    const usedFields = new Set();
    for (const field of allFieldNames) {
        const fieldIdx = featureStr.indexOf(field);
        if (fieldIdx !== -1) {
            usedFields.add(field);
            const maxValueLength = Math.max(...columnValues[field].map(value => value.length), 1);
            const possibleVal = featureStr.slice(Math.max(0, fieldIdx - maxValueLength), fieldIdx);
            let foundVal = null;
            for (let len = Math.min(maxValueLength, possibleVal.length); len >= 1; len--) {
                const val = possibleVal.slice(-len);
                if (columnValues[field].includes(val)) {
                    foundVal = val;
                    break;
                }
            }
            if (foundVal) {
                matched_fields[field] = foundVal;
                usedChars.add(field);
                usedChars.add(foundVal);
            } else {
                matched_fields[field] = null;
                usedChars.add(field);
            }
        }
    }
    let remaining = featureStr;
    for (const val of usedChars) {
        remaining = remaining.replace(val, '');
    }

    const remainingValues = Object.entries(reverseMap)
        .filter(([, field]) => Boolean(field))
        .sort((a, b) => b[0].length - a[0].length);

    for (const [value, field] of remainingValues) {
        if (!remaining.includes(value) || matched_fields[field]) {
            continue;
        }

        matched_fields[field] = value;
        usedFields.add(field);
        remaining = remaining.replace(value, '');
    }

    for (const char of remaining) {
        if (!char.trim()) continue;
        const field = reverseMap[char];
        if (field && !matched_fields[field]) {
            matched_fields[field] = char;
            usedFields.add(field);
        }
    }

    return { matched_fields, unmatched_fields: allFieldNames.filter(f => !usedFields.has(f)) };
}

/**
 * @typedef {'normal' | 'polyphonic' | 'wendu' | 'baidu' | 'both'} ReadingType
 * Unified frontend reading-color semantic bucket.
 *
 * - `normal`: no special reading color.
 * - `polyphonic`: ordinary 多音字 bucket.
 * - `wendu`: 文讀 bucket.
 * - `baidu`: 白讀 bucket.
 * - `both`: 文白讀 bucket.
 */

/**
 * Resolve search_chars syllable-level reading type.
 *
 * search_chars rows are shaped like:
 * {
 *   char: string,
 *   音节: string[],
 *   location: string,
 *   notes: string[],
 *   type: Array<'文讀' | '白讀' | '_' | string>
 * }
 *
 * `音节[i]`, `notes[i]`, and `type[i]` are index-aligned. For new payloads,
 * only `type[index]` is authoritative for 文白讀 coloring. `notes[index]` is a
 * legacy compatibility fallback and should not be used as the primary signal.
 *
 * This helper is only for search_chars 音節級顯示 and intentionally does not
 * infer `polyphonic` or `both` from mixed row-level data.
 *
 * @param {Record<string, any>} row search_chars result row.
 * @param {number} index syllable index aligned with row.音节 / row.notes / row.type.
 * @returns {'normal' | 'wendu' | 'baidu'}
 */
export function getSearchCharReadingType(row, index) {
    const raw = row?.type?.[index];
    const normalized = normalizeReadingType(raw);

    if (normalized !== 'normal') {
        return normalized;
    }

    return fallbackTypeFromNotes(row?.notes?.[index]);
}

/**
 * Resolve ZhongGu char-level reading color directly from backend `row.color`.
 *
 * Expected bucket shape:
 * {
 *   文白讀?: string[],
 *   文讀?: string[],
 *   白讀?: string[],
 *   多音字?: string[]
 * }
 *
 * Priority is `文白讀 > 文讀 > 白讀 > 多音字 > normal`.
 *
 * @param {Record<string, any>} row ZhongGu result row.
 * @param {string} char A single displayed character from row.對應字.
 * @returns {ReadingType}
 */
export function getZhongGuCharReadingType(row, char) {
    const colorMap = row?.color;
    if (!colorMap || typeof colorMap !== 'object' || !char) return 'normal';

    if (Array.isArray(colorMap['文白讀']) && colorMap['文白讀'].includes(char)) return 'both';
    if (Array.isArray(colorMap['文讀']) && colorMap['文讀'].includes(char)) return 'wendu';
    if (Array.isArray(colorMap['白讀']) && colorMap['白讀'].includes(char)) return 'baidu';
    if (Array.isArray(colorMap['多音字']) && colorMap['多音字'].includes(char)) return 'polyphonic';

    return 'normal';
}

function buildDetailCharSet(detailList) {
    const chars = new Set();

    if (!Array.isArray(detailList)) {
        return chars;
    }

    detailList.forEach((entry) => {
        if (typeof entry !== 'string') {
            return;
        }

        const [char] = entry.split(':').map(str => str.trim());
        if (char) {
            chars.add(char);
        }
    });

    return chars;
}

function buildMultiDetailCharSet(detailText) {
    const chars = new Set();

    if (typeof detailText !== 'string' || !detailText.trim()) {
        return chars;
    }

    detailText.split(';').forEach((entry) => {
        const [char] = entry.split(':').map(str => str.trim());
        if (char) {
            chars.add(char);
        }
    });

    return chars;
}

/**
 * Resolve yinwei char-level reading color from detail fields rather than
 * ZhongGu-style `row.color` buckets.
 *
 * Priority is `文白讀 > 文讀 > 白讀 > 多地位/多音字 > normal`.
 * Hover content remains driven by `多地位詳情` / `多音字詳情` elsewhere.
 *
 * @param {Record<string, any>} row Yinwei result row.
 * @param {string} char A single displayed character from row.對應字.
 * @returns {ReadingType}
 */
export function getYinWeiCharReadingType(row, char) {
    if (!row || !char) return 'normal';

    const wenduChars = buildDetailCharSet(row?.文讀詳情);
    const baiduChars = buildDetailCharSet(row?.白讀詳情);

    if (wenduChars.has(char) && baiduChars.has(char)) return 'both';
    if (wenduChars.has(char)) return 'wendu';
    if (baiduChars.has(char)) return 'baidu';

    const multiPositionChars = buildMultiDetailCharSet(row?.多地位詳情);
    if (multiPositionChars.has(char)) return 'polyphonic';

    const polyphonicChars = buildMultiDetailCharSet(row?.多音字詳情);
    if (polyphonicChars.has(char)) return 'polyphonic';

    return 'normal';
}

/**
 * Convert a normalized reading type to a reusable BEM-style CSS class string.
 *
 * Example: getReadingClass('wendu', 'pronunciation') =>
 * `reading-char pronunciation pronunciation--wendu`
 *
 * The shared `reading-char` root class is always included for cross-component
 * styling hooks, while the optional `baseClass` keeps component-local styles.
 *
 * @param {ReadingType} type
 * @param {string} [baseClass='reading-char']
 * @returns {string}
 */
export function getReadingClass(type, baseClass = 'reading-char') {
    const classes = ['reading-char'];

    if (baseClass && baseClass !== 'reading-char') {
        classes.push(baseClass);
    }

    if (!type || type === 'normal') {
        return classes.join(' ');
    }

    classes.push(`reading-char--${type}`);

    if (baseClass) {
        classes.push(`${baseClass}--${type}`);
    }

    return classes.join(' ');
}

/**
 * @param {string | string[] | null | undefined} raw
 * @returns {'normal' | 'wendu' | 'baidu'}
 */
function normalizeReadingType(raw) {
    const text = Array.isArray(raw) ? raw.join(';') : (raw || '');
    if (!text || text === '_') return 'normal';

    const hasWendu = text.includes('文讀') || text.includes('文读');
    const hasBaidu = text.includes('白讀') || text.includes('白读');

    if (hasWendu) return 'wendu';
    if (hasBaidu) return 'baidu';

    return 'normal';
}

/**
 * Compatibility-only fallback for legacy payloads that still encode 文白讀 in
 * `notes` instead of `type`.
 *
 * @param {string | string[] | null | undefined} notes
 * @returns {'normal' | 'wendu' | 'baidu'}
 */
function fallbackTypeFromNotes(notes) {
    return normalizeReadingType(notes);
}

export function getCorrespondingCharacters(item) {
    const multiCharDetails = {};
    if (item.多音字詳情) {
        item.多音字詳情.split(';').forEach(s => {
            const [ch, detail] = s.split(':').map(str => str.trim());
            if (ch && detail) multiCharDetails[ch] = detail;
        });
    }
    if (item.多地位詳情) {
        item.多地位詳情.split(';').forEach(s => {
            const [ch, detail] = s.split(':').map(str => str.trim());
            if (ch && detail) multiCharDetails[ch] = detail;
        });
    }
    return item.對應字.map(ch => ({
        type: 'span',
        props: multiCharDetails[ch]
            ? { class: 'char-vue multi-vue', datatitle: multiCharDetails[ch] }
            : { class: 'char-vue' },
        children: ch
    }));
}

// ④ get_detail：弹窗按钮会调用（用于新面板加载详情）
/**
 * * @param {String} label - 🌟 新增參數：用於接收 '音本位' 或 '字本位'，精確控制模式
 */
export async function get_detail(location, feature_value, bool=false, vue=false,
                                 mountTarget /* 廢棄 */, group_inputs = []) {

    if (!location || !feature_value) return;
    const tableName = resultCache.tableName || DEFAULT_CHARACTER_TABLE
    // Temporary compromise: these detail queries still depend on the
    // characters-table schema. Remove this guard after multi-table adaptation lands.
    if (tableName !== 'characters') {
        showWarning(i18n.global.t('result.panelManager.unsupportedTable'));
        return;
    }
    // ============================================
    // ★ 修改點 1：在 fetch 之前，先打開窗口！
    // ============================================
    let tempPanelId = null;

    if (typeof window.addPanel === 'function') {
        // 參數 1: [] (空數據)
        // 參數 2: true (開啟 Loading 動畫)
        // 返回值: 拿到這個窗口的 ID，稍後用來更新它
        tempPanelId = window.addPanel([], true);
    }
    // === 1. 參數準備邏輯 (融合你的舊邏輯與新邏輯) ===
    let status_inputs = [];
    let pho_values = [""];
    let regions = [""];

    let mode_raw = resultCache.mode || '';
    let mode = '';

    // 基礎模式判斷
    if (mode_raw === '查音位') mode = 'p2s';
    if (mode_raw === '查中古') mode = 's2p';


    const features = resultCache.features || [];
    const locations = Array.isArray(location) ? location : [location];
    const region_mode = window.regionusing || 'yindian'; // 防止報錯，給個默認值

    if (bool) {
        if (mode === 'p2s') {
            // ❗检查是否是合法汉字（+允许 -）
            if (!/^[\u4e00-\u9fa5\-\s]+$/.test(feature_value)) {
                status_inputs = []; // 清空
            } else {
                status_inputs = [feature_value];
            }
            mode = 's2p';
        } else if (mode === 's2p') {
            pho_values = [feature_value];
            mode = 'p2s';
        }
    } else {
        if (mode === 's2p') {
            // 已加入 \u00b7 以支持中間點「·」
            if (!/^[\u4e00-\u9fa5\-\s\u00b7]+$/.test(feature_value)) {
                status_inputs = [];
            } else {
                const cleaned_value = feature_value.replace(/\u00b7/g, '');
                status_inputs = [cleaned_value];
            }
        } else if (mode === 'p2s') {
            pho_values = [feature_value];
        }
    }

    const payload = {
        mode,
        locations,
        regions,
        features,
        status_inputs,
        group_inputs,
        pho_values,
        region_mode,
        table_name: tableName
    };
    try {
        // ✅ 使用统一的 api 函数（替代 window.fetch）
        const result = await queryPhonology(payload);

        // === 3. 處理數據 ===
        if (!result.results) {
            throw new Error(result.detail || "未返回 results");
        }

        const data = result.results;
        // 清除字數為0的數據
        const validData = data.filter(item => item.字數 !== 0);
        resultCache.latestResults = validData;

        if (validData.length === 0) {
            showWarning("未查詢到相關詳情");
            return;
        }

        // === 4. 🚀 渲染切換：從 DOM 操作改為調用 PanelManager ===
        // ============================================
        // ★ 修改點 2：請求成功後，更新剛才那個窗口
        // ============================================
        if (typeof window.updatePanel === 'function' && tempPanelId) {
            if (validData.length === 0) {
                showWarning("未查詢到相關詳情");
                // 如果沒數據，把那個轉圈圈的窗口關掉
                window.removePanel(tempPanelId);
            } else {
                // 有數據了！填入數據，updatePanel 會自動把 loading 設為 false
                window.updatePanel(tempPanelId, validData);
            }
        }

    } catch (error) {
        console.error("分析失敗", error);
        const detail = error?.detail ?? error?.response?.data?.detail;
        const message = typeof detail === 'string'
            ? detail
            : detail?.message || error?.message;
        showError(message);
    }
}
