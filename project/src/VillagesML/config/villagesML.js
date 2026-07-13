// src/config/villagesML.js
// VillagesML 相關常量配置

// ========================================
// 語義類別映射
// ========================================

/**
 * 語義類別圖標映射
 * @type {Object<string, string>}
 */
export const SEMANTIC_CATEGORY_ICONS = {
  'agriculture': '🌾',
  'clan': '👨‍👩‍👧‍👦',
  'culture': '🏛️',
  'modifier': '📝',
  'settlement': '🏘️',
  'spatial': '🧭',
  'terrain': '⛰️',
  'vegetation': '🌿',
  'water': '💧',
  // === 向后兼容（旧版 lexicon 类别名）===
  'direction': '🧭',
  'infrastructure': '🏗️',
  'mountain': '⛰️',
  'symbolic': '🎨',
}

/**
 * 語義類別中文名稱映射
 * @type {Object<string, string>}
 */
export const SEMANTIC_CATEGORY_NAMES = {
  'agriculture': '農業',
  'clan': '宗族',
  'culture': '文化',
  'modifier': '修飾語',
  'settlement': '聚落',
  'spatial': '空間',
  'terrain': '地形',
  'vegetation': '植物',
  'water': '水系',
  // === 向后兼容（旧版 lexicon 类别名）===
  'direction': '方位',
  'infrastructure': '基建',
  'mountain': '山地',
  'symbolic': '象徵',
  'head': '中心詞',
  'other': '其他',
}

/**
 * 語義類別描述映射
 * @type {Object<string, string>}
 */
export const SEMANTIC_CATEGORY_DESCRIPTIONS = {
  'agriculture': '農業、耕作、田地相關',
  'clan': '宗族、姓氏、家族相關',
  'culture': '吉祥符號、宗教、美德等文化象徵相關',
  'modifier': '大小、顏色、新舊、數量等修飾語相關',
  'settlement': '村落、居住地、圩市等聚落相關',
  'spatial': '方位、高低、內外等空間位置相關',
  'terrain': '山峰、坡崗、山谷、岩石、平地等地形相關',
  'vegetation': '樹木、花草、竹林等植物相關',
  'water': '河流、湖泊、港灣、水塘等水系相關',
  // === 向后兼容（旧版 lexicon 类别名）===
  'direction': '東西南北、方向相關',
  'infrastructure': '道路、橋樑、建築相關',
  'mountain': '山地、丘陵等地形相關',
  'symbolic': '吉祥、象徵意義相關',
}

/**
 * 語義子類別中文名稱映射（v4.0 Hybrid Lexicon）
 * @type {Object<string, string>}
 */
export const SEMANTIC_SUBCATEGORY_NAMES = {
  // ===== 父类别（9个大类，匹配 lexicon v1.12+ / v4.5+）=====
  'agriculture': '農業',
  'clan': '宗族',
  'culture': '文化',
  'modifier': '修飾語',
  'settlement': '聚落',
  'spatial': '空間',
  'terrain': '地形',
  'vegetation': '植被',
  'water': '水系',
  'other': '其他',
  // === 向后兼容（旧版 lexicon 父类别）===
  'infrastructure': '基建',
  'mountain': '山地',
  'symbolic': '象徵',

  // ===== v4.7+ 子类别（层级 lexicon，不带父前缀）=====
  // --- terrain 地形 ---
  'peak_ridge': '峰嶺',
  'slope': '坡崗',
  'valley': '山谷',
  'rock': '岩石',
  'flatland': '台坪',
  'surface': '沙土',
  // --- water 水系 ---
  'river': '江河',
  'stream': '溪涌',
  'ditch': '溝渠',
  'pond_lake': '池塘',
  'bay_port': '港灣',
  'shore_island': '洲灘',
  'water_source': '泉井',
  // --- settlement 聚落 ---
  'village': '村屯',
  'dwelling': '民居',
  'building': '建築',
  'fortification': '城寨',
  'market_trade': '圩市',
  'road_transport': '路橋',
  'traditional_unit': '里坊',
  'admin_unit': '社隊',
  // --- spatial 空间 ---
  'direction': '方位',
  'elevation': '高低',
  'extremity': '頭尾',
  'boundary': '邊角',
  'enclosure': '內外',
  'center': '中心',
  'relative_position': '前後',
  // --- clan 宗族 ---
  'general': '通用姓',
  'cantonese': '廣府姓',
  'hakka': '客家姓',
  'teochew': '潮汕姓',
  // --- culture 文化 ---
  'religion': '宗教',
  'auspicious': '吉祥',
  'virtue': '美德',
  'animal_symbol': '瑞獸',
  'natural_symbol': '天象',
  'community': '社群',
  'craft_memorial': '工藝',
  // --- agriculture 农业 ---
  'field': '田地',
  'crop': '作物',
  'livestock': '禽畜',
  'farming_infra': '農耕',
  // --- vegetation 植被 ---
  'tree': '樹木',
  'bamboo': '竹',
  'fruit': '果樹',
  'herb': '花草',
  // --- modifier 修飾語 ---
  'number': '數字',
  'size': '尺寸',
  'color': '顏色',
  'time': '時序',
  'quality': '性質',
  'suffix': '後綴',

  // ===== v4_hybrid 子类别（76个子类别，带旧父前缀，向后兼容）=====

  // 數字類
  'number_small': '小數',          // 一二三四五
  'number_large': '大數',          // 六七八九十
  'number_ordinal': '序數',        // 初、第、老

  // 方位類
  'direction_vertical': '上下',         // 上、下、低
  'direction_cardinal': '東南西北',      // 東、北、南、西
  'direction_inside': '內部',           // 中、內、裡
  'direction_outside': '外側',          // 側、外、旁、邊
  'direction_opening': '關口',          // 關、口、門
  'direction_horizontal': '前後左右',    // 前、右、後、左
  'direction_center': '中央',           // 央、心
  'direction_end': '端點',             // 頭、尾、端、角

  // 象徵類（去掉"象徵"後綴）
  'symbolic_virtue': '美德',           // 義、仁、信、聖、德、文、智、禮、賢
  'symbolic_religion': '宗教',         // 仙、佛、堂、宮、寺、廟、靈、神、觀
  'symbolic_light': '光明',            // 光、明、朗、耀、輝
  'symbolic_prosperity': '繁榮',       // 興、華、富、昌、盛、榮、貴
  'symbolic_animal': '瑞獸',           // 鳳、虎、鶴、鹿、麟、龍、龜
  'symbolic_fortune': '吉祥',          // 吉、喜、壽、瑞、祥、祿、福
  'symbolic_peace': '平安',            // 和、寧、安、康、泰
  'symbolic_treasure': '珍寶',         // 寶、玉、珍

  // 水系類
  'water_spring': '泉井',              // 井、泉
  'water_stream': '溪流',              // 圳、溝、瀝、湧
  'water_pond': '池塘',                // 塘、池、泊、澱、潭
  'water_island': '島嶼',              // 嶼、島、洲
  'water_shore': '岸濱',               // 岸、汀、沿、渚、濱
  'water_river': '江河',               // 川、江、河、澗、溪
  'water_beach': '灘塗',               // 灘、沙
  'water_lake': '湖泊',                // 湖、澤、窪
  'water_port': '港津',                // 港、津、埠
  'water_bay': '海灣',                 // 灣、浦、滘、濠

  // 基建類
  'infrastructure_station': '驛站',     // 亭、站、驛
  'infrastructure_port': '碼頭',        // 埠、渡、碼
  'infrastructure_road': '道路',        // 巷、街、路、道
  'infrastructure_bridge': '橋樑',      // 橋
  'infrastructure_transport': '交通',

  // 時間類（舊版，v4.7+ 已改用 modifier.time）
  'seasonal_time': '時令',              // 今、冬、古、夏、新、舊、春、晚、朝、秋

  // 農業類（簡化）
  'agriculture_storage': '倉廩',        // 倉、廩
  'agriculture_activity': '農牧',       // 農、牧、畜、耕
  'agriculture_garden': '園圃',         // 園、圃、場
  'agriculture_field': '田地',          // 地、田、畔、畬、疇
  'agriculture_irrigation': '堤壩',     // 壩、堤、渠
  'agriculture_crop': '作物',           // 稻、禾、麥等

  // 宗族類（保持）
  'clan_he': '何姓',
  'clan_other': '其他姓氏',
  'clan_liu': '劉姓',
  'clan_wu': '吳姓',
  'clan_zhang': '張姓',
  'clan_li': '李姓',
  'clan_liang': '梁姓',
  'clan_luo': '羅姓',
  'clan_chen': '陳姓',
  'clan_huang': '黃姓',

  // 山地類
  'mountain_slope': '坡崗',            // 岡、坎、坡、坳、崗
  'mountain_plateau': '台坪',          // 台、坪、塱
  'mountain_valley': '山谷',           // 坑、峒、峽、峪
  'mountain_rock': '岩石',             // 壁、岩、崖、石
  'mountain_peak': '山峰',             // 山、嶺、峰、巔、頂
  'mountain_ridge': '山脊',            // 岐、巒、嶂、脊

  // 聚落類
  'settlement_district': '圍坊',        // 圍、坊
  'settlement_market': '圩市',          // 圩、墟、市、集
  'settlement_fort': '城寨',            // 城、堡、寨
  'settlement_village': '村莊',          // 塆、屯、莊、村
  'settlement_building': '宅屋',        // 宅、屋、樓、祠
  'settlement_group': '片區',           // 片、群、帶

  // 形狀類
  'shape': '形狀',                     // 圓、尖、平、扁、方、曲、直

  // 尺寸類（簡化）
  'size_large': '大',                  // 大、寬、巨、廣
  'size_small': '小',                  // 小、微、細
  'size_short': '短',                  // 短
  'size_long': '長',                   // 長

  // 植物類
  'vegetation_forest': '林木',          // 林、森、樹、木
  'vegetation_pine': '松柏',            // 松、柏
  'vegetation_fruit': '果樹',           // 果、梅、桃、李等
  'vegetation_other': '雜木',           // 其他植物
  'vegetation_bamboo': '竹',            // 竹
  'vegetation_flower': '花卉',          // 花、菊、蓮等
  'vegetation_tea': '茶',               // 茶

  // 顏色類（舊版，v4.7+ 已改用 modifier.color）
  'v4hybrid_color': '顏色'             // 青、赤、黃、白、黑等
}

/** 
* 模式結構組件映射
 * @type {Object<string, string>}
 */
export const PATTERN_STRUCTURE_NAMES = {
  'head': '中心',
  'modifier': '修飾',
  'coordinate': '並列',
  'verb': '動',
  'object': '賓',
  'subject': '主',
  'predicate': '謂',
  'other': '其他'
}

/**
 * 組合模式組件映射（已廢棄，請使用 PATTERN_STRUCTURE_NAMES 和 SEMANTIC_CATEGORY_NAMES）
 * @deprecated 使用 PATTERN_STRUCTURE_NAMES 和 SEMANTIC_CATEGORY_NAMES 代替
 * @type {Object<string, string>}
 */
export const PATTERN_COMPONENT_NAMES = {
  ...PATTERN_STRUCTURE_NAMES,
  ...SEMANTIC_CATEGORY_NAMES
}

// ========================================
// N-gram 位置和模式類型映射
// ========================================

/**
 * N-gram 位置標籤映射
 * 支持單一位置和組合位置（如 prefix-suffix）
 * @type {Object<string, string>}
 */
export const NGRAM_POSITION_LABELS = {
  // 單一位置
  'all': '全部',
  'prefix': '前綴',
  'middle': '中間',
  'suffix': '後綴',
  // 組合位置
  'prefix-suffix': '前後綴',
  'prefix-middle': '前中',
  'middle-suffix': '中後',
  'prefix-middle-suffix': '前中後'
}

/**
 * N-gram 模式類型標籤映射
 * @type {Object<string, string>}
 */
export const NGRAM_PATTERN_TYPE_LABELS = {
  'all': '全部',
  'prefix': '前綴',
  'suffix': '後綴',
  'middle': '中間',
  'prefix-suffix': '前後綴',
  'infix': '中綴'
}

// ========================================
// 統計顯著性標籤映射
// ========================================

/**
 * P值顯著性標籤映射
 * @type {Object<string, {label: string, symbol: string, description: string}>}
 */
export const SIGNIFICANCE_LEVELS = {
  'very_significant': {
    label: '極顯著',
    symbol: '***',
    description: 'p < 0.001',
    threshold: 0.001
  },
  'significant': {
    label: '顯著',
    symbol: '**',
    description: 'p < 0.01',
    threshold: 0.01
  },
  'marginal': {
    label: '邊緣顯著',
    symbol: '*',
    description: 'p < 0.05',
    threshold: 0.05
  },
  'not_significant': {
    label: '不顯著',
    symbol: 'n.s.',
    description: 'p ≥ 0.05',
    threshold: 1.0
  }
}

// ========================================
// 輔助函數
// ========================================

/**
 * 獲取語義類別圖標
 * @param {string} category - 類別英文名
 * @returns {string} 圖標 emoji
 */
export function getCategoryIcon(category) {
  return SEMANTIC_CATEGORY_ICONS[category] || '🏷️'
}

/**
 * 獲取語義類別中文名稱
 * @param {string} category - 類別英文名
 * @returns {string} 中文名稱
 */
export function getCategoryName(category) {
  return SEMANTIC_CATEGORY_NAMES[category] || category
}

/**
 * 獲取語義類別描述
 * @param {string} category - 類別英文名
 * @returns {string} 描述文本
 */
export function getCategoryDescription(category) {
  return SEMANTIC_CATEGORY_DESCRIPTIONS[category] || '語義類別'
}

/**
 * 獲取語義子類別名稱
 * @param {string} subcategory - 子類別英文名（如 "number_small", "clan_zhang"）
 * @returns {string} 中文名稱
 */
export function getSubcategoryName(subcategory) {
  return SEMANTIC_SUBCATEGORY_NAMES[subcategory] || subcategory
}

/**
 * 獲取語義類別名稱（智能識別主類別或子類別）
 * @param {string} category - 類別英文名（可以是主類別如 "clan"，也可以是子類別如 "clan_zhang"）
 * @param {boolean} isDetailMode - 是否為詳細模式（默認false）
 * @returns {string} 中文名稱
 */
export function getCategoryDisplayName(category, isDetailMode = false) {
  if (!category) return ''

  // 如果是詳細模式，優先查找子類別映射
  if (isDetailMode && SEMANTIC_SUBCATEGORY_NAMES[category]) {
    return SEMANTIC_SUBCATEGORY_NAMES[category]
  }

  // 否則查找主類別映射
  if (SEMANTIC_CATEGORY_NAMES[category]) {
    return SEMANTIC_CATEGORY_NAMES[category]
  }

  // 如果都找不到，嘗試查找子類別映射（兼容性處理）
  if (SEMANTIC_SUBCATEGORY_NAMES[category]) {
    return SEMANTIC_SUBCATEGORY_NAMES[category]
  }

  // 最後返回原始值
  return category
}

/**
 * 獲取組合模式類型名稱
 * @param {string} patternType - 模式類型英文名（如 "head_settlement", "modifier_head"）
 * @returns {string} 中文名稱
 */
export function getPatternTypeName(patternType) {
  if (!patternType) return ''

  // 處理下劃線或連字符分隔的模式
  const separator = patternType.includes('_') ? '_' : '-'
  const parts = patternType.split(separator)

  // 翻譯每個部分並用連字符連接
  const translatedParts = parts.map(part => {
    // 先查找模式結構組件
    if (PATTERN_STRUCTURE_NAMES[part]) {
      return PATTERN_STRUCTURE_NAMES[part]
    }
    // 再查找語義類別
    if (SEMANTIC_CATEGORY_NAMES[part]) {
      return SEMANTIC_CATEGORY_NAMES[part]
    }
    // 返回原始值
    return part
  })

  return translatedParts.join('-')
}

/**
 * 獲取 N-gram 位置標籤
 * 支持單一位置和組合位置（如 prefix-suffix）
 * @param {string} position - 位置標識（如 'prefix', 'prefix-suffix'）
 * @returns {string} 中文標籤
 */
export function getNgramPositionLabel(position) {
  if (!position) return ''
  return NGRAM_POSITION_LABELS[position] || position
}

/**
 * 獲取 N-gram 模式類型標籤
 * @param {string} type - 模式類型（如 'prefix', 'suffix'）
 * @returns {string} 中文標籤
 */
export function getNgramPatternTypeLabel(type) {
  if (!type) return ''
  return NGRAM_PATTERN_TYPE_LABELS[type] || type
}

/**
 * 獲取顯著性標籤（基於 p 值）
 * @param {number} pValue - P值
 * @returns {string} 顯著性符號（***, **, *, n.s.）
 */
export function getSignificanceLabel(pValue) {
  if (pValue < SIGNIFICANCE_LEVELS.very_significant.threshold) {
    return SIGNIFICANCE_LEVELS.very_significant.symbol
  }
  if (pValue < SIGNIFICANCE_LEVELS.significant.threshold) {
    return SIGNIFICANCE_LEVELS.significant.symbol
  }
  if (pValue < SIGNIFICANCE_LEVELS.marginal.threshold) {
    return SIGNIFICANCE_LEVELS.marginal.symbol
  }
  return SIGNIFICANCE_LEVELS.not_significant.symbol
}

/**
 * 獲取顯著性等級信息
 * @param {number} pValue - P值
 * @returns {Object} 顯著性等級對象 {label, symbol, description}
 */
export function getSignificanceLevel(pValue) {
  if (pValue < SIGNIFICANCE_LEVELS.very_significant.threshold) {
    return SIGNIFICANCE_LEVELS.very_significant
  }
  if (pValue < SIGNIFICANCE_LEVELS.significant.threshold) {
    return SIGNIFICANCE_LEVELS.significant
  }
  if (pValue < SIGNIFICANCE_LEVELS.marginal.threshold) {
    return SIGNIFICANCE_LEVELS.marginal
  }
  return SIGNIFICANCE_LEVELS.not_significant
}

// ========================================
// 空間聚類配置
// ========================================

/**
 * 空間聚類 Run ID 標籤映射
 * @type {Object<string, string>}
 */
export const SPATIAL_CLUSTERING_RUN_LABELS = {
  'spatial_eps_05': '超密集核心聚類',
  'spatial_hdbscan_v1': '自動多密度聚類',
  'spatial_eps_10': '標準密度聚類',
  'spatial_eps_20': '全域覆蓋聚類'
}

/**
 * 默認的空間聚類 Run ID
 * @type {string}
 */
export const DEFAULT_SPATIAL_CLUSTERING_RUN_ID = 'spatial_hdbscan_v1'

/**
 * 獲取空間聚類 Run 標籤
 * @param {string} runId - Run ID
 * @returns {string} 標籤名稱
 */
export function getSpatialClusteringRunLabel(runId) {
  return SPATIAL_CLUSTERING_RUN_LABELS[runId] || runId
}
