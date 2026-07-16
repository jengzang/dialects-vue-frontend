import { createCommonBarItem, createCommonBarSchema } from '@/components/bar/commonBarNavigation.js'
import { buildVillagesMLPath } from '@/VillagesML/utils/routeDataset.js'

// ========================================
// 模組和子標籤配置（用於 CommonBar 導航）
// ========================================
/**
 * VillagesML 模組配置（不包含 Dashboard）
 * 用於 VillagesMLLayout 的 CommonBar 導航
 * @type {Array<Object>}
 */
export const VILLAGESML_MODULES = [
    // {
    //     id: 'search',
    //     label: '搜索',
    //     icon: '🔍',
    //     path: buildVillagesMLPath({ module: 'search' }),
    //     weight: 0.8,
    //     mobileWeight: 1,
    //     weightIconOnly: 0.5,
    //     mobileWeightIconOnly: 0.4,
    //     fontSize: 1.0,
    //     mobileFontSize: 0.9,
    //     requireAuth: false,
    //     hideOnMobile: false,
    //     // hideLabelOnMobile: true,
    //     showLabelOnlyWhenActive: false,
    //     mobileShowLabelOnlyWhenActive: true,
    //     subtabs: []
    // },
    {
        id: 'character',
        label: '字符分析',
        icon: '🔤',
        path: buildVillagesMLPath({ module: 'character', subtab: 'frequency' }),
        weight: 1.2,
        mobileWeight: 1,
        weightIconOnly: 0.5,
        mobileWeightIconOnly: 0.5,
        fontSize: 1.2,
        mobileFontSize: 0.9,
        requireAuth: false,
        hideOnMobile: false,
        // hideLabelOnMobile: true,
        showLabelOnlyWhenActive: false,
        mobileShowLabelOnlyWhenActive: true,
        subtabs: [
            {
                id: 'frequency',
                label: '頻率傾向',
                icon: '📊',
                path: buildVillagesMLPath({ module: 'character', subtab: 'frequency' }),
            },
            {
                id: 'embeddings',
                label: '嵌入相似',
                icon: '🧬',
                path: buildVillagesMLPath({ module: 'character', subtab: 'embeddings' }),
            },
            {
                id: 'network',
                label: '字符網絡',
                icon: '🕸️',
                path: buildVillagesMLPath({ module: 'character', subtab: 'network' }),
            },
            {
                id: 'significance',
                label: '顯著性',
                icon: '⭐',
                path: buildVillagesMLPath({ module: 'character', subtab: 'significance' }),
            },
        ]
    },
    {
        id: 'semantic',
        label: '語義分析',
        icon: '🏷️',
        path: buildVillagesMLPath({ module: 'semantic', subtab: 'categories' }),
        weight: 1.2,
        mobileWeight: 1,
        weightIconOnly: 0.5,
        mobileWeightIconOnly: 0.5,
        fontSize: 1.2,
        mobileFontSize: 0.9,
        requireAuth: false,
        hideOnMobile: false,
        // hideLabelOnMobile: true,
        showLabelOnlyWhenActive: false,
        mobileShowLabelOnlyWhenActive: true,
        subtabs: [
            {
                id: 'categories',
                label: '類別標籤',
                icon: '🔖',
                path: buildVillagesMLPath({ module: 'semantic', subtab: 'categories' }),
            },
            {
                id: 'composition',
                label: '組合模式',
                icon: '🧩',
                path: buildVillagesMLPath({ module: 'semantic', subtab: 'composition' }),
            },
            {
                id: 'ngrams',
                label: 'N-gram分析',
                icon: '📊',
                path: buildVillagesMLPath({ module: 'semantic', subtab: 'ngrams' }),
            },
            {
                id: 'indices',
                label: '語義指數',
                icon: '📈',
                path: buildVillagesMLPath({ module: 'semantic', subtab: 'indices' }),
            },
            {
                id: 'network',
                label: '語義網絡',
                icon: '🕸️',
                path: buildVillagesMLPath({ module: 'semantic', subtab: 'network' }),
            },
            {
                id: 'subcategories',
                label: '子類別分析',
                icon: '🏷️',
                path: buildVillagesMLPath({ module: 'semantic', subtab: 'subcategories' })
            }
        ]
    },
    {
        id: 'spatial',
        label: '空間分析',
        icon: '🗺️',
        path: buildVillagesMLPath({ module: 'spatial', subtab: 'hotspots' }),
        weight: 1.2,
        mobileWeight: 1,
        weightIconOnly: 0.5,
        mobileWeightIconOnly: 0.5,
        fontSize: 1.2,
        mobileFontSize: 0.9,
        requireAuth: false,
        hideOnMobile: false,
        // hideLabelOnMobile: true,
        showLabelOnlyWhenActive: false,
        mobileShowLabelOnlyWhenActive: true,
        subtabs: [
            {
                id: 'hotspots',
                label: '空間熱點',
                icon: '🔥',
                path: buildVillagesMLPath({ module: 'spatial', subtab: 'hotspots' }),
            },
            {
                id: 'clusters',
                label: '空間聚類',
                icon: '🎯',
                path: buildVillagesMLPath({ module: 'spatial', subtab: 'clusters' }),
            },
            {
                id: 'visualization',
                label: '空間可視化',
                icon: '📍',
                path: buildVillagesMLPath({ module: 'spatial', subtab: 'visualization' }),
            },
            {
                id: 'integration',
                label: '空間整合',
                icon: '🔗',
                path: buildVillagesMLPath({ module: 'spatial', subtab: 'integration' })
            }
        ]
    },
    {
        id: 'pattern',
        label: '模式分析',
        icon: '📐',
        path: buildVillagesMLPath({ module: 'pattern', subtab: 'frequency' }),
        weight: 1.2,
        mobileWeight: 1,
        weightIconOnly: 0.5,
        mobileWeightIconOnly: 0.5,
        fontSize: 1.2,
        mobileFontSize: 0.9,
        requireAuth: false,
        hideOnMobile: false,
        // hideLabelOnMobile: true,
        showLabelOnlyWhenActive: false,
        mobileShowLabelOnlyWhenActive: true,
        subtabs: [
            {
                id: 'frequency',
                label: '頻率分析',
                icon: '📊',
                path: buildVillagesMLPath({ module: 'pattern', subtab: 'frequency' }),
            },
            {
                id: 'structural',
                label: '結構分析',
                icon: '🏗️',
                path: buildVillagesMLPath({ module: 'pattern', subtab: 'structural' }),
            },
            {
                id: 'tendency',
                label: '傾向性分析',
                icon: '📈',
                path: buildVillagesMLPath({ module: 'pattern', subtab: 'tendency' }),
            },
            {
                id: 'ngram-explore',
                label: 'N-gram 探索',
                icon: '🔍',
                path: buildVillagesMLPath({ module: 'pattern', subtab: 'ngram-explore' }),
            },
            {
                id: 'ngram-stats',
                label: 'N-gram 統計',
                icon: '📊',
                path: buildVillagesMLPath({ module: 'pattern', subtab: 'ngram-stats' })
            }
        ]
    },
    {
        id: 'regional',
        label: '區域分析',
        icon: '🌍',
        path: buildVillagesMLPath({ module: 'regional', subtab: 'aggregates' }),
        weight: 1.2,
        mobileWeight: 1,
        weightIconOnly: 0.5,
        mobileWeightIconOnly: 0.5,
        fontSize: 1.2,
        mobileFontSize: 0.9,
        requireAuth: false,
        hideOnMobile: false,
        // hideLabelOnMobile: true,
        showLabelOnlyWhenActive: false,
        mobileShowLabelOnlyWhenActive: true,
        subtabs: [
            {
                id: 'aggregates',
                label: '聚合統計',
                icon: '📈',
                path: buildVillagesMLPath({ module: 'regional', subtab: 'aggregates' })
            },
            {
                id: 'vectors',
                label: '特徵向量',
                icon: '📐',
                path: buildVillagesMLPath({ module: 'regional', subtab: 'vectors' })
            },
            {
                id: 'tendency',
                label: '類別傾向性',
                icon: '📊',
                path: buildVillagesMLPath({ module: 'regional', subtab: 'tendency' })
            },
            {
                id: 'similarity',
                label: '相似度分析',
                icon: '🔍',
                path: buildVillagesMLPath({ module: 'regional', subtab: 'similarity' })
            },
            {
                id: 'feature-agg',
                label: '特徵聚合',
                icon: '🔬',
                path: buildVillagesMLPath({ module: 'regional', subtab: 'feature-agg' }),
                requireAuth: true
            }
        ]
    },
    {
        id: 'compute',
        label: 'ML計算',
        icon: '🤖',
        path: buildVillagesMLPath({ module: 'compute', subtab: 'clustering' }),
        weight: 1.2,
        mobileWeight: 1,
        weightIconOnly: 0.5,
        mobileWeightIconOnly: 0.5,
        fontSize: 1.2,
        mobileFontSize: 0.9,
        requireAuth: false,
        hideOnMobile: false,
        // hideLabelOnMobile: true,
        showLabelOnlyWhenActive: false,
        mobileShowLabelOnlyWhenActive: true,
        subtabs: [
            // ===== 現有子標籤（修改標籤名稱）=====
            {
                id: 'clustering',
                label: '基礎聚類',  // 改名：聚類分析 → 基礎聚類
                icon: '🎲',
                path: buildVillagesMLPath({ module: 'compute', subtab: 'clustering' })
            },
            // ===== 新增子標籤 =====
            {
                id: 'char-tendency',
                label: '字符傾向',
                icon: '🔤',
                path: buildVillagesMLPath({ module: 'compute', subtab: 'char-tendency' })
            },
            {
                id: 'sampled-villages',
                label: '採樣村莊',
                icon: '🏘️',
                path: buildVillagesMLPath({ module: 'compute', subtab: 'sampled-villages' })
            },
            {
                id: 'spatial-aware',
                label: '空間感知',
                icon: '🗺️',
                path: buildVillagesMLPath({ module: 'compute', subtab: 'spatial-aware' })
            },
            {
                id: 'hierarchical',
                label: '層次聚類',
                icon: '🌳',
                path: buildVillagesMLPath({ module: 'compute', subtab: 'hierarchical' })
            },

            {
                id: 'features',
                label: '特徵提取',
                icon: '🔬',
                path: buildVillagesMLPath({ module: 'compute', subtab: 'features' })
            },
            {
                id: 'subset',
                label: '子集分析',
                icon: '🧪',
                path: buildVillagesMLPath({ module: 'compute', subtab: 'subset' })
            },

        ]
    },
    // {
    //   id: 'system',
    //   label: '信息',
    //   icon: 'ℹ️',
    //   path: buildVillagesMLPath({ module: 'system' }),
    //   weight: 0.8,
    //   mobileWeight: 1,
    //   weightIconOnly: 0.5,
    //   fontSize: 1.0,
    //   mobileFontSize: 1.0,
    //   requireAuth: false,
    //   hideOnMobile: false,
    //   hideLabelOnMobile: true,
    //   showLabelOnlyWhenActive: false,
    //   subtabs: []
    // }
]

/**
 * 獲取模組配置
 * @param {string} moduleId - 模組 ID
 * @returns {Object|null} 模組配置對象
 */
export function getModuleConfig(moduleId) {
    return VILLAGESML_MODULES.find(m => m.id === moduleId) || null
}

/**
 * 獲取子標籤配置
 * @param {string} moduleId - 模組 ID
 * @param {string} subtabId - 子標籤 ID
 * @returns {Object|null} 子標籤配置對象
 */
export function getSubtabConfig(moduleId, subtabId) {
    const module = getModuleConfig(moduleId)
    if (!module || !module.subtabs) return null
    return module.subtabs.find(s => s.id === subtabId) || null
}

/**
 * 獲取可見的模組列表（根據認證狀態過濾）
 * @param {boolean} isAuthenticated - 是否已登錄
 * @returns {Array<Object>} 可見的模組配置數組
 */
export function getVisibleModules(isAuthenticated) {
    return VILLAGESML_MODULES.filter(m => !m.requireAuth || isAuthenticated)
}

const filterVisibleSubtabs = (subtabs = [], isAuthenticated) => {
    return subtabs.filter(subtab => !subtab.requireAuth || isAuthenticated)
}

const createVillagesMLCommonBarItem = (module, isAuthenticated) => {
    const visibleSubtabs = filterVisibleSubtabs(module.subtabs, isAuthenticated)

    return createCommonBarItem({
        id: module.id,
        label: module.label,
        icon: module.icon,
        display: {
            overrides: {
                weight: module.weight,
                mobileWeight: module.mobileWeight,
                weightIconOnly: module.weightIconOnly,
                mobileWeightIconOnly: module.mobileWeightIconOnly,
                fontSize: module.fontSize,
                mobileFontSize: module.mobileFontSize,
                hideOnMobile: module.hideOnMobile,
                hideLabelOnMobile: module.hideLabelOnMobile,
                showLabelOnlyWhenActive: module.showLabelOnlyWhenActive,
                mobileShowLabelOnlyWhenActive: module.mobileShowLabelOnlyWhenActive
            }
        },
        navigation: {
            defaultTo: module.path,
            activeValue: module.id,
            rememberChild: visibleSubtabs.length > 0,
            defaultChild: visibleSubtabs[0]?.path || module.path,
            children: visibleSubtabs.map(subtab => ({
                id: subtab.id,
                label: subtab.label,
                icon: subtab.icon || '',
                path: subtab.path
            }))
        },
        meta: {
            requireAuth: module.requireAuth
        }
    })
}

export function createVillagesMLCommonBarSchema(isAuthenticated = false) {
    const homeItem = createCommonBarItem({
        id: 'home',
        label: '首页',
        icon: '🏠',
        display: {
            overrides: { scroll: 'left', weightIconOnly: 0.4, fontSize: 1.0, mobileFontSize: 0.9 }
        },
        navigation: {
            defaultTo: '/'
        }
    })

    const searchItem = createCommonBarItem({
        id: 'search',
        label: '搜索',
        icon: '🔍',
         display: {
            overrides: { scroll: 'left', weightIconOnly: 0.4, fontSize: 1.0, mobileFontSize: 0.9 }
        },
        navigation: {
            defaultTo: buildVillagesMLPath({ module: 'search' }),
        }
    })

    const moduleItems = getVisibleModules(isAuthenticated).map(module => createVillagesMLCommonBarItem(module, isAuthenticated))

    const systemItem = createCommonBarItem({
      id: 'system',
      label: '信息',
      icon: 'ℹ️',
      display: {
            overrides: { scroll: 'right', weightIconOnly: 0.4, fontSize: 1.0, mobileFontSize: 0.9 }
       },
       navigation: {
             defaultTo: buildVillagesMLPath({ module: 'system' }),
         }
     })

    return createCommonBarSchema({
        meta: {
            id: 'villagesML',
            storage: {
                enabled: true,
                type: 'session',
                keyPrefix: 'commonbar'
            }
        },
        route: {
            activeResolver: {
                type: 'query',
                tabKey: 'module'
            }
        },
        items: [homeItem, searchItem, ...moduleItems, systemItem]
    })
}
