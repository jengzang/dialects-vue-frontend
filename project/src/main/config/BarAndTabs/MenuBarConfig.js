import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { resultCache } from '@/main/store/store.js'

// ========================================
// MenuBar Configuration Guide
// ========================================
//
// Final display config merge order:
// 1. DISPLAY_DEFAULTS
// 2. DISPLAY_PRESETS[display.preset]
// 3. display.overrides
//
// Recommended per-tab shape:
//
// createMenuTab({
//   tab: 'example',
//   label: t('...'),
//   icon: '...',
//   display: {
//     preset: 'standard',
//     overrides: {
//       weight: 0.9,
//       mobileWeight: 0.9,
//       weightIconOnly: 0.6,
//       mobileWeightIconOnly: 0.5,
//       fontSize: 1.4,
//       mobileFontSize: 1.5,
//       isPseudo: false,
//       hideOnMobile: false,
//       hideLabelOnMobile: false,
//       showLabelOnlyWhenActive: false,
//       mobileShowLabelOnlyWhenActive: true,
//       cssClass: '',
//       visibleWhen: null
//     }
//   },
//   navigation: {
//     defaultTo: null
//   },
//   meta: {}
// })
//
// useMenuTabsConfig() returns grouped config objects.
// useMenuBarConfig() flattens them back into the legacy tab shape consumed by NavBar.
//
const DISPLAY_DEFAULTS = {
  weight: 0.9,
  mobileWeight: 0.9,
  weightIconOnly: 0.6,
  mobileWeightIconOnly: 0.5,
  fontSize: 1.4,
  mobileFontSize: 1.5,
  isPseudo: false,
  hideOnMobile: false,
  hideLabelOnMobile: false,
  showLabelOnlyWhenActive: false,
  mobileShowLabelOnlyWhenActive: true,
  cssClass: '',
  visibleWhen: null
}

const DISPLAY_PRESETS = {
  standard: {},
  compactDesktop: {
    weight: 0.8,
    weightIconOnly: 0.25,
    fontSize: 1.2
  },
  resultTab: {
    mobileWeightIconOnly: 0.4
  }
}

const NAVIGATION_DEFAULTS = {
  defaultTo: null
}

const STORAGE_KEY_PREFIX = 'menu_last_sub_'
const MENU_CHILD_PATHS = {
  query: ['/menu/query/char', '/menu/query/zhonggu', '/menu/query/yinwei', '/menu/query/tone'],
  compare: ['/menu/compare/char', '/menu/compare/zhonggu', '/menu/compare/tone', '/menu/compare/phonetic'],
  map: ['/menu/map/view', '/menu/map/divide', '/menu/map/custom'],
  pho: ['/menu/pho/matrix', '/menu/pho/custom', '/menu/pho/count', '/menu/pho/evolution'],
  about: ['/menu/about/intro', '/menu/about/suggestion', '/menu/about/like', '/menu/about/settings']
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

const createMenuTab = ({
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

function getMenuTabKeyFromRoute(route) {
  if (typeof route?.path !== 'string') return null

  if (route.path.startsWith('/menu/query/')) return 'query'
  if (route.path.startsWith('/menu/compare/')) return 'compare'
  if (route.path.startsWith('/menu/map/')) return 'map'
  if (route.path === '/menu/result') return 'result'
  if (route.path === '/menu/source') return 'source'
  if (route.path === '/menu/privacy') return 'privacy'
  if (route.path === '/menu/tools') return 'tools'
  if (route.path === '/menu/words') return 'words'
  if (route.path === '/menu/villages') return 'villages'
  if (route.path === '/menu/cluster') return 'cluster'
  if (route.path.startsWith('/menu/pho/')) return 'pho'
  if (route.path.startsWith('/menu/about/')) return 'about'

  return route?.query?.tab || null
}

export function useMenuTabsConfig() {
  const { t } = useI18n()

  return computed(() => [
    createMenuTab({
      tab: 'pho',
      label: t('navigation.tabs.phonology'),
      icon: '\uD83E\uDDEC',
      display: {
        preset: 'standard',
        overrides: {}
      },
      navigation: {
        defaultTo: { path: '/menu/pho/matrix' }
      }
    }),
    createMenuTab({
      tab: 'query',
      label: t('navigation.tabs.query'),
      icon: '\uD83D\uDD0D\uFE0F',
      display: {
        preset: 'standard',
        overrides: {}
      },
      navigation: {
        defaultTo: { path: '/menu/query/zhonggu' }
      }
    }),
    createMenuTab({
      tab: 'result',
      label: t('navigation.tabs.results'),
      icon: '\uD83D\uDCC9',
      display: {
        preset: 'resultTab',
        overrides: {
          visibleWhen: () => resultCache.latestResults.length > 0
        }
      },
      navigation: {
        defaultTo: { path: '/menu/result' }
      }
    }),
    createMenuTab({
      tab: 'map',
      label: t('navigation.tabs.map'),
      icon: '\uD83D\uDDFA\uFE0F',
      display: {
        preset: 'standard',
        overrides: {}
      },
      navigation: {
        defaultTo: { path: '/menu/map/view' }
      }
    }),
    createMenuTab({
      tab: 'compare',
      label: t('navigation.tabs.compare'),
      icon: '\u2194\uFE0F',
      display: {
        preset: 'standard',
        overrides: {}
      },
      navigation: {
        defaultTo: { path: '/menu/compare/zhonggu' }
      }
    }),
    createMenuTab({
      tab: 'about',
      label: t('navigation.tabs.about'),
      icon: '\uD83C\uDF10\uFE0F',
      display: {
        preset: 'compactDesktop',
        overrides: {}
      },
      navigation: {
        defaultTo: { path: '/menu/about/intro' }
      }
    })
  ])
}

export function useMenuBarConfig() {
  const tabsConfig = useMenuTabsConfig()

  return computed(() => tabsConfig.value.map((tab) => ({
    tab: tab.tab,
    label: tab.label,
    icon: tab.icon,
    to: tab.navigation?.defaultTo || null,
    ...tab.display,
    navigation: {
      ...tab.navigation,
      tabKey: tab.tab,
      rememberChild: Array.isArray(MENU_CHILD_PATHS[tab.tab])
    },
    meta: tab.meta || {}
  })))
}

export function filterVisibleMenuBarTabs(tabs) {
  return tabs.filter((tab) => {
    if (typeof tab.visibleWhen === 'function') {
      return tab.visibleWhen()
    }
    return true
  })
}

export function readMenuBarMemory(tabKey) {
  if (!tabKey || typeof window === 'undefined') return null

  try {
    return window.sessionStorage.getItem(STORAGE_KEY_PREFIX + tabKey)
  } catch (error) {
    console.warn('Failed to read from sessionStorage:', error)
    return null
  }
}

export function writeMenuBarMemory(tabKey, path) {
  if (!tabKey || typeof window === 'undefined') return

  try {
    if (path) {
      window.sessionStorage.setItem(STORAGE_KEY_PREFIX + tabKey, path)
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY_PREFIX + tabKey)
    }
  } catch (error) {
    console.warn('Failed to write to sessionStorage:', error)
  }
}

export function syncMenuBarMemoryFromRoute(route) {
  const tabKey = getMenuTabKeyFromRoute(route)
  if (!tabKey) return

  if (MENU_CHILD_PATHS[tabKey]?.includes(route.path)) {
    writeMenuBarMemory(tabKey, route.path)
  }
}

export function isMenuBarRouteMatch(targetRoute, route) {
  if (!targetRoute) return false

  if (typeof targetRoute === 'string') {
    return route.path === targetRoute
  }

  const targetPath = targetRoute.path
  if (targetPath && route.path !== targetPath) {
    const currentTabKey = getMenuTabKeyFromRoute(route)
    const targetTabKey = targetRoute?.navigation?.tabKey || targetRoute?.tab
    if (!(currentTabKey && targetTabKey && currentTabKey === targetTabKey)) {
      return false
    }
  }

  if (targetRoute.query) {
    for (const [key, value] of Object.entries(targetRoute.query)) {
      if (route.query[key] !== value) return false
    }
  }

  return true
}

export function getMenuBarActiveTab(tabs, route) {
  const currentTabKey = getMenuTabKeyFromRoute(route)
  if (currentTabKey) return currentTabKey
  return tabs.find((tab) => isMenuBarRouteMatch(tab.to, route))?.tab || null
}

export function resolveMenuBarTarget(tabConfig) {
  if (!tabConfig?.to) {
    const tabKey = tabConfig?.navigation?.tabKey || tabConfig?.tab
    return MENU_CHILD_PATHS[tabKey]?.[0] || '/menu/query/zhonggu'
  }

  if (!tabConfig.navigation?.rememberChild) {
    return tabConfig.to
  }

  const rememberedPath = readMenuBarMemory(tabConfig.navigation.tabKey)
  if (!rememberedPath) {
    return tabConfig.to
  }

  return rememberedPath
}
