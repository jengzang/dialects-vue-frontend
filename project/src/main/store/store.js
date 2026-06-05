// src/utils/store.js
import { ref, reactive, computed } from 'vue'
import { useStorageState } from '@/composables/core/useStorageState.js'
import {
    DEFAULT_CHARACTER_TABLE,
    resolveCharacterTableName
} from '@/main/config/index.js'

// ========================================
// 全局 Payload（用于跨组件传递查询数据）
// ========================================
export const globalPayload = ref(null)

const {
    state: preferredCharacterTableState,
    write: writePreferredCharacterTableState
} = useStorageState('preferred-character-table', {
    defaultValue: DEFAULT_CHARACTER_TABLE
})

preferredCharacterTableState.value = resolveCharacterTableName(preferredCharacterTableState.value)

export const preferredCharacterTable = preferredCharacterTableState

export function setPreferredCharacterTable(tableName) {
    const nextTableName = resolveCharacterTableName(tableName)
    preferredCharacterTable.value = nextTableName
    writePreferredCharacterTableState(nextTableName)
}

// ========================================
// 用户状态管理（替代 window.userRole 和 window.currentUser）
// ========================================
export const userStore = reactive({
    role: 'anonymous',        // 用户角色: 'anonymous' | 'user' | 'admin'
    isAuthenticated: false,   // 是否已认证
    username: null,           // 用户名
    id: null,                 // 用户ID
    authReady: false,         // 是否完成首次会话恢复
    sessionStatus: 'initializing' // 'anonymous' | 'authenticated' | 'degraded' | 'initializing'
})

// ========================================
// 地图状态管理
// ========================================
export const mapStore = reactive({
    mode: 'base',             // 默认模式: 'base' | 'dot' | 'feature' | 'compare'
    mapData: null,            // 存放基础地图数据 (center, zoom, locations)
    mergedData: [],           // 存放特征数据 (results)
    loading: false,           // 共享加载状态
    selectedFeature: '',      // 当前选中的特征
    showCustomData: false,    // 是否显示用户个人数据
    compareType: '',          // 比較類型: 'chars' | 'zhonggu' | 'tones'
    compareGroups: null       // 比较模式的组信息 { group1: {color, label}, group2: {color, label} }
})

// =================================
// =======
// 查询状态管理（替代 window.locationList 等）
// ========================================
export const queryStore = reactive({
    locations: [],            // 地点列表
    regions: [],              // 区域列表
    regionUsing: 'yindian'    // 使用的分区模式
})

// ========================================
// 结果缓存（替代 window._resultPageCache）
// ========================================
export const resultCache = reactive({
    mode: '',                 // 查询模式
    features: [],             // 特征列表
    latestResults: [],        // 最新结果（替代 window.latestdetailResults）
    tableName: DEFAULT_CHARACTER_TABLE
})

// ========================================
// UI 状态管理（按钮禁用状态和标签页跟踪）
// ========================================
export const uiStore = reactive({
    // 按钮禁用状态
    buttonStates: {
        query: {
            isRunning: false,
            isLocationDisabled: false,
            tabContentDisabled: {
                tab1: true,  // hanzi input validation
                tab2: true,  // zhonggu selector validation
                tab3: true,  // yinwei selector validation
                tab4: false  // no content validation needed
            }
        },
        divide: {
            isRunning: false,
            isLocationDisabled: false
        },
        custom: {
            isRunning: false,
            hasSelectedFeature: false
        },
        compare: {
            isRunning: false,
            isLocationDisabled: false,
            tabContentDisabled: {
                tab1: true,
                tab2: true,
                tab4: true
            }
        }
    },

    // 标签页状态跟踪
    currentPage: 'query',  // 'query' | 'result' | 'map' | 'about'
    currentSubTab: {
        query: 'tab2',  // 'tab1' | 'tab2' | 'tab3' | 'tab4'
        compare: 'tab2', // 'tab1' | 'tab2' | 'tab4'
        map: 'map'      // 'map' | 'divide' | 'custom'
    }
})

// ========================================
// UI 状态计算属性
// ========================================

// Query 按钮禁用状态
export const isQueryButtonDisabled = computed(() => {
    const state = uiStore.buttonStates.query
    const currentTab = uiStore.currentSubTab.query
    return state.isRunning ||
           state.isLocationDisabled ||
           state.tabContentDisabled[currentTab]
})

// Divide 按钮禁用状态
export const isDivideButtonDisabled = computed(() => {
    const state = uiStore.buttonStates.divide
    return state.isRunning || state.isLocationDisabled
})

// Custom 按钮禁用状态
export const isCustomButtonDisabled = computed(() => {
    const state = uiStore.buttonStates.custom
    return state.isRunning || !state.hasSelectedFeature
})

// Compare 按钮禁用状态
export const isCompareButtonDisabled = computed(() => {
    const state = uiStore.buttonStates.compare
    const currentTab = uiStore.currentSubTab.compare
    return state.isRunning ||
           state.isLocationDisabled ||
           state.tabContentDisabled[currentTab]
})

// ========================================
// UI 状态辅助函数
// ========================================

// 设置标签页内容禁用状态
export function setTabContentDisabled(page, tab, isDisabled) {
    if (uiStore.buttonStates[page]?.tabContentDisabled) {
        uiStore.buttonStates[page].tabContentDisabled[tab] = isDisabled
    }
}

// 设置地点禁用状态
export function setLocationDisabled(page, isDisabled) {
    if (uiStore.buttonStates[page]) {
        uiStore.buttonStates[page].isLocationDisabled = isDisabled
    }
}

// 设置运行状态
export function setRunning(page, isRunning) {
    if (uiStore.buttonStates[page]) {
        uiStore.buttonStates[page].isRunning = isRunning
    }
}
