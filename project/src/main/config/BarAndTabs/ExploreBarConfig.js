import { buildLocalePath, resolveRouteLocale, stripLocaleFromPath } from '@/i18n/localeRouting.js'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { userStore, resultCache } from '@/main/store/store.js'

// ========================================
// ExploreBar (探索导航栏) 配置指南
// ========================================
//
// 最终显示配置的合并优先级（从高到低）：
// 1. display.overrides (针对单个标签的自定义覆盖配置)
// 2. DISPLAY_PRESETS[display.preset] (选择的预设样式组合)
// 3. DISPLAY_DEFAULTS (全局默认兜底配置)
//
// 推荐的单个标签页（tab）数据结构与参数详解：
//
// createExploreTab({
//   tab: 'example',       // 标签的唯一标识符（ID）
//   label: t('...'),      // 标签的显示文本，通常结合国际化 t() 使用
//   icon: '...',          // 标签的 Emoji 图标或图标字体名称
//   display: {            // 显示与UI布局配置
//     preset: 'standard', // 采用的预设模式，决定基础表现（见下方说明）
//     overrides: {        // 覆盖特定 UI 参数的配置项：
//       weight: 1,                          // 桌面端 Flex-grow 权重（控制占据的相对宽度）
//       mobileWeight: 1,                    // 移动端 Flex-grow 权重
//       weightIconOnly: 0.6,                // 当仅显示图标时，桌面端的 Flex 权重
//       mobileWeightIconOnly: 0.55,         // 当仅显示图标时，移动端的 Flex 权重
//       fontSize: 1.2,                      // 桌面端字体大小的缩放比例 (rem 或 em)
//       mobileFontSize: 1.2,                // 移动端字体大小的缩放比例
//       hideOnMobile: false,                // 是否在移动端完全隐藏此标签
//       hideLabelOnMobile: false,           // 移动端是否仅显示图标（隐藏文字）
//       showLabelOnlyWhenActive: false,     // 桌面端是否仅在“激活选中”时才显示文字
//       mobileShowLabelOnlyWhenActive: true,// 移动端是否仅在“激活选中”时才显示文字
//       cssClass: '',                       // 挂载到该标签上的自定义 CSS 类名
//       visibleWhen: null,                  // 动态可见性函数（例如: () => user.isAdmin）
//       scroll: undefined,                  // undefined = 主tab; 'left' = 左侧溢出; 'right' = 右侧溢出
//       mobileScroll: undefined             // 仅竖屏/移动端覆盖 scroll；例如 mobileScroll: 'right' 表示桌面主tab、移动端右侧溢出
//     }
//   },
//   navigation: {         // 路由与导航行为配置
//     defaultTo: null,      // 点击主标签时默认跳转的路由对象 (如 { path: '/...' })
//     matchPages: [],       // 页面名称数组。当处于这些页面时，此标签高亮显示
//     activeMatchPaths: [], // 路径数组。当当前路由路径完全匹配其中之一时，标签高亮
//     rememberChild: false, // 再次点击该标签时，是否记忆并自动跳转至上次访问的子菜单
//     defaultChild: null,   // 如果没有访问记录，默认跳转的子菜单路径
//     children: []          // 下拉或展开的子菜单项数组 [{ label, icon, path }]
//   },
//   meta: {}              // 其他扩展元数据，可用于自定义业务逻辑
// })
//
// 预设模式（Preset）说明：
// - standard: 桌面端/移动端的基准表现，各项权重均衡。
// - compactDesktop: 针对桌面端进行压缩。字体和宽度较小，适用于非核心功能标签。
// - balancedMobile: 保持桌面端默认表现，但适度增加移动端的图标权重和字号，提升可读性和点击范围。
//
const withRouteLocale = (route, path) => buildLocalePath(resolveRouteLocale(route), stripLocaleFromPath(path))

const DISPLAY_DEFAULTS = {
    // Flex 尺寸布局
    weight: 1,
    mobileWeight: 1,
    weightIconOnly: 0.6,
    mobileWeightIconOnly: 0.55,

    // 排版 / 字体
    fontSize: 1.2,
    mobileFontSize: 1.2,

    // 可见性 / 行为
    isPseudo: false, // 标记是否为伪标签（例如仅作为占位符，不实际响应点击）
    hideOnMobile: false,
    hideLabelOnMobile: false,
    showLabelOnlyWhenActive: false,
    mobileShowLabelOnlyWhenActive: true,

    // 样式 / 条件可见性
    cssClass: '',
    visibleWhen: null, // 默认始终可见

    // 溢出滚动
    scroll: undefined, // undefined = 主tab; 'left' = 左侧溢出; 'right' = 右侧溢出
    mobileScroll: undefined // 仅竖屏/移动端覆盖 scroll；undefined = 沿用 scroll
}

const NAVIGATION_DEFAULTS = {
    defaultTo: null,
    matchPages: [],
    activeMatchPaths: [],
    rememberChild: false,
    defaultChild: null,
    children: []
}

const DISPLAY_PRESETS = {
    // 采用 DISPLAY_DEFAULTS 的完整基准配置。
    standard: {},

    // 缩减桌面端空间占用，适用于“关于”等次要功能的标签。
    compactDesktop: {
        weight: 0.8,
        mobileWeight: 0.8,
        weightIconOnly: 0.3,
        mobileWeightIconOnly: 0.3,
        fontSize: 1,
        mobileFontSize: 1
    },

    // 桌面端保持标准大小，但让移动端具有更大的点击区域和字号。
    balancedMobile: {
        mobileWeightIconOnly: 0.6,
        mobileFontSize: 1.3
    }
}

const createDisplayConfig = ({ preset = 'standard', overrides = {} } = {}) => ({
    ...DISPLAY_DEFAULTS,
    ...(DISPLAY_PRESETS[preset] || {}),
    ...overrides
})

const createNavigationConfig = (overrides = {}) => ({
    ...NAVIGATION_DEFAULTS,
    ...overrides
})

const createExploreTab = 
    ({
        tab,
        label,
        icon,
        display,
        navigation,
        meta = {}
    }) => ({
            tab,
            label,
            icon,
            display: createDisplayConfig(display),
            navigation: createNavigationConfig(navigation),
            meta
})

export function getExploreBarTabs(configMap) {
    return Object.values(configMap).map((config) => ({
        tab: config.tab,
        label: config.label,
        icon: config.icon,
        to: config.navigation.defaultTo,
        navigation: config.navigation,
        ...config.display
    }))
}

export function filterVisibleExploreBarTabs(tabs) {
    return tabs.filter((tab) => {
        if (typeof tab.visibleWhen === 'function') {
            return tab.visibleWhen()
        }
        return true
    })
}

export function getExploreBarChildren(configMap, tabKey) {
    return configMap[tabKey]?.navigation?.children || []
}

export function getExploreBarActiveTab(tabs, route, router) {
    return tabs.find((tab) => {
        const activeMatchPaths = tab.navigation?.activeMatchPaths || []
        if (activeMatchPaths.includes(route.path)) {
            return true
        }

        const targets = [tab.to, ...(tab.navigation?.children || []).map((child) => child.path)]

        return targets.some((target) => {
            if (!target) return false

            const resolved = router.resolve(target)
            if (resolved.path !== route.path) return false

            return Object.entries(resolved.query || {}).every(([key, value]) => route.query[key] === value)
        })
    })?.tab || null
}

export function matchExploreBarChildRoute(childPath, route, router) {
    const resolved = router.resolve(childPath)

    if (resolved.path !== route.path) {
        return false
    }

    return Object.entries(resolved.query || {}).every(([key, value]) => {
        return route.query[key] === value
    })
}

export function useExploreBarConfig() {
    const { t } = useI18n()
    const route = useRoute()

    return computed(() => ({
        home: createExploreTab({
            tab: 'home',
            label: t('navigation.tabs.home'),
            icon: '🏠',
            display: {
                preset: 'compactDesktop',
                overrides: { scroll: 'left', weightIconOnly: 0.4 }
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/') }
            }
        }),
        about: createExploreTab({
            tab: 'about',
            label: t('navigation.tabs.aboutWebsite'),
            icon: '🌐',
            display: {
                preset: 'compactDesktop',
                overrides: { mobileScroll: 'left', weightIconOnly: 0.4 }
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/menu/about/intro') }
            }
        }),
        charClass: createExploreTab({
            tab: 'charClass',
            label: t('navigation.tabs.charClass'),
            icon: '📚',
            display: {
                preset: 'standard',
                overrides: {}
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/explore/char-class'), query: { tab: 'zhonggu' } },
                matchPages: ['CharacterClassification'],
                rememberChild: true,
                defaultChild: '/explore/char-class?tab=zhonggu',
                children: [
                    { label: t('navigation.submenu.charClass.zhonggu'), icon: '📜', path: withRouteLocale(route, '/explore/char-class?tab=zhonggu') },
                    { label: t('navigation.submenu.charClass.shanggu'), icon: '🏛️', path: withRouteLocale(route, '/explore/char-class?tab=shanggu') },
                    { label: t('navigation.submenu.charClass.jingu'), icon: '📖', path: withRouteLocale(route, '/explore/char-class?tab=jingu') },
                    { label: t('navigation.submenu.charClass.yueyun'), icon: '🎵', path: withRouteLocale(route, '/explore/char-class?tab=yueyun') }
                ]
            }
        }),
        words: createExploreTab({
            tab: 'words',
            label: t('navigation.tabs.phrases'),
            icon: '📖',
            display: {
                preset: 'standard',
                overrides: {}
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/menu/words') },
                matchPages: ['YuBao', 'Vocabulary', 'ycSpoken'],
                activeMatchPaths: [
                    withRouteLocale(route, '/explore/vocabulary/view'),
                    withRouteLocale(route, '/explore/vocabulary/import'),
                    withRouteLocale(route, '/explore/vocabulary/manage')
                ],
                rememberChild: true,
                defaultChild: '/explore/vocabulary/view',
                children: [
                    { label: t('navigation.submenu.words.wordList'), icon: '📒', path: withRouteLocale(route, '/explore/vocabulary/view') },
                    { label: t('navigation.submenu.words.vocabulary'), icon: '📖', path: withRouteLocale(route, '/explore/yubao?tab=vocabulary') },
                    { label: t('navigation.submenu.words.grammar'), icon: '🗣️', path: withRouteLocale(route, '/explore/yubao?tab=grammar') },
                    { label: t('navigation.submenu.words.ycSpoken'), icon: '💬', path: withRouteLocale(route, '/explore/yc-spoken') }
                ]
            }
        }),
        villages: createExploreTab({
            tab: 'villages',
            label: t('navigation.tabs.villages'),
            icon: '🏘️',
            display: {
                preset: 'standard',
                overrides: {}
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/menu/villages') },
                matchPages: ['toponyms', 'gdVillages', 'gdVillagesTable', 'ycVillages', 'VillagesML'],
                activeMatchPaths: [
                    withRouteLocale(route, '/explore/villages/table')
                ],
                rememberChild: true,
                defaultChild: '/explore/villages/gd',
                children: [
                    { label: t('navigation.submenu.villages.VillagesML'), icon: '🤖', path: withRouteLocale(route, '/explore/villages/ml') },
                    { label: t('navigation.submenu.villages.toponyms'), icon: '🗺️', path: withRouteLocale(route, '/explore/villages/toponyms') },
                    { label: t('navigation.submenu.villages.gdVillages'), icon: '🏘️', path: withRouteLocale(route, '/explore/villages/gd') },
                    // { label: t('navigation.submenu.villages.gdVillagesTable'), icon: '📊', path: withRouteLocale(route, '/explore/villages/table') },
                    { label: t('navigation.submenu.villages.ycVillages'), icon: '🏕️', path: withRouteLocale(route, '/explore/villages/yc') },
                    { label: t('navigation.submenu.villages.allVillages'), icon: '📋', path: withRouteLocale(route, '/explore/villages/all'), visibleWhen: () => userStore.role === 'admin' }
                ]
            }
        }),
        tools: createExploreTab({
            tab: 'tools',
            label: t('navigation.tabs.tools'),
            icon: '🧰',
            display: {
                preset: 'balancedMobile',
                overrides: {}
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/menu/tools') },
                matchPages: ['check', 'jyut2ipa', 'merge', 'derive', 'praat'],
                activeMatchPaths: [withRouteLocale(route, '/explore/manage')],
                rememberChild: true,
                defaultChild: withRouteLocale(route, '/explore/tools/check'),
                children: [
                    { label: t('navigation.submenu.tools.check'), icon: '📝', path: withRouteLocale(route, '/explore/tools/check') },
                    { label: t('navigation.submenu.tools.jyut2ipa'), icon: '🔤', path: withRouteLocale(route, '/explore/tools/jyut2ipa') },
                    { label: t('navigation.submenu.tools.merge'), icon: '🔗', path: withRouteLocale(route, '/explore/tools/merge') },
                    // { label: t('navigation.submenu.tools.derive'), icon: '🧪', path: withRouteLocale(route, '/explore/tools/derive') },
                    // { label: t('navigation.submenu.tools.praat'), icon: '👂️', path: '/explore/tools/praat' }
                ]
            }
        }),
        praat: createExploreTab({
            tab: 'praat',
            label: t('navigation.tabs.praat'),
            icon: '🎙️',
            display: {
                preset: 'balancedMobile',
                overrides: {
                    mobileWeightIconOnly: 0.6
                }
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/explore/tools/praat') },
                matchPages: ['praat'],
                activeMatchPaths: [
                    withRouteLocale(route, '/explore/tools/praat')
                ]
            }
        }),
        gis: createExploreTab({
            tab: 'gis',
            label: t('navigation.tabs.gis'),
            icon: '🗺️',
            display: {
                preset: 'balancedMobile',
                overrides: {
                    mobileScroll: 'right', mobileWeightIconOnly: 0.6
                }
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/explore/gis') },
                activeMatchPaths: [
                    withRouteLocale(route, '/explore/gis')
                ]
            }
        }),
        navPho: createExploreTab({
            tab: 'pho',
            label: t('navigation.tabs.phonology'),
            icon: '🧬',
            display: {
                preset: 'compactDesktop',
                overrides: { mobileScroll: 'right', weightIconOnly: 0.3 }
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/menu/pho/matrix') }
            }
        }),
        navQuery: createExploreTab({
            tab: 'query',
            label: t('navigation.tabs.query'),
            icon: '🔍',
            display: {
                preset: 'compactDesktop',
                overrides: { mobileScroll: 'right', weightIconOnly: 0.3 }
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/menu/query/zhonggu') }
            }
        }),
        // navResult: createExploreTab({
        //     tab: 'result',
        //     label: t('navigation.tabs.results'),
        //     icon: '📉',
        //     display: {
        //         preset: 'standard',
        //         overrides: { scroll: 'right', weightIconOnly: 0.3, visibleWhen: () => resultCache.latestResults.length > 0 }
        //     },
        //     navigation: {
        //         defaultTo: { path: withRouteLocale(route, '/menu/result') }
        //     }
        // }),
        navMap: createExploreTab({
            tab: 'map',
            label: t('navigation.tabs.map'),
            icon: '🗺️',
            display: {
                preset: 'compactDesktop',
                overrides: { scroll: 'right', weightIconOnly: 0.3 }
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/menu/map/view') }
            }
        }),
        navCompare: createExploreTab({
            tab: 'compare',
            label: t('navigation.tabs.compare'),
            icon: '↔️',
            display: {
                preset: 'compactDesktop',
                overrides: { mobileScroll: 'right', weightIconOnly: 0.3 }
            },
            navigation: {
                defaultTo: { path: withRouteLocale(route, '/menu/compare/zhonggu') }
            }
        })
    }))
}
