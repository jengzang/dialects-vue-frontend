import { buildLocalePath, extractLocaleFromPath, resolveRouteLocale, stripLocaleFromPath } from '@/i18n/localeRouting.js'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
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
  weight: 1,
  mobileWeight: 1,
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
  visibleWhen: null,
  scroll: undefined // undefined = 主tab; 'left' = 左侧溢出; 'right' = 右侧溢出
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
  map: ['/menu/map/view', '/menu/map/divide', '/menu/map/custom', '/menu/map/draw'],
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

const withRouteLocale = (route, path) => buildLocalePath(resolveRouteLocale(route), stripLocaleFromPath(path))

function getMenuTabKeyFromRoute(route) {
  const normalizedPath = stripLocaleFromPath(route?.path || '')
  if (!normalizedPath) return null

  if (normalizedPath.startsWith('/menu/query/')) return 'query'
  if (normalizedPath.startsWith('/menu/compare/')) return 'compare'
  if (normalizedPath.startsWith('/menu/map/')) return 'map'
  if (normalizedPath === '/menu/result') return 'result'
  if (normalizedPath === '/menu/source') return 'source'
  if (normalizedPath === '/menu/privacy') return 'privacy'
  if (normalizedPath === '/menu/tools') return 'tools'
  if (normalizedPath === '/menu/words') return 'words'
  if (normalizedPath === '/menu/villages') return 'villages'
  if (normalizedPath === '/menu/cluster') return 'cluster'
  if (normalizedPath.startsWith('/menu/pho/')) return 'pho'
  if (normalizedPath.startsWith('/menu/about/')) return 'about'

  return route?.query?.tab || null
}

export function useMenuTabsConfig() {
  const { t } = useI18n()
  const route = useRoute()

  return computed(() => [
    createMenuTab({
      tab: 'source',
      label: t('source.title'),
      icon: '🔗',
      display: {
        preset: 'standard',
        overrides: { scroll: 'left', weight: 0.7, weightIconOnly: 0.3 }
      },
      navigation: {
        defaultTo: { path: withRouteLocale(route, '/menu/source') }
      }
    }),
    createMenuTab({
      tab: 'praat',
      label: t('navigation.tabs.praat'),
      icon: '🎙️',
      display: {
        preset: 'standard',
        overrides: { scroll: 'left', weight: 0.7, weightIconOnly: 0.3 }
      },
      navigation: {
        defaultTo: { path: withRouteLocale(route, '/explore/tools/praat') }
      }
    }),
    createMenuTab({
      tab: 'home',
      label: t('navigation.tabs.home'),
      icon: '🏠',
      display: {
        preset: 'standard',
        overrides: { scroll: 'left', weight: 0.7, weightIconOnly: 0.4 }
      },
      navigation: {
        defaultTo: { path: withRouteLocale(route, '/') }
      }
    }),
    createMenuTab({
      tab: 'about',
      label: t('navigation.tabs.about'),
      icon: '\uD83C\uDF10\uFE0F',
      display: {
        preset: 'compactDesktop',
        overrides: {
          weight: 0.8,
          mobileWeight: 0.8,
        }
      },
      navigation: {
        defaultTo: { path: withRouteLocale(route, '/menu/about/settings') }
      }
    }),
    createMenuTab({
      tab: 'pho',
      label: t('navigation.tabs.phonology'),
      icon: '\uD83E\uDDEC',
      display: {
        preset: 'standard',
        overrides: {}
      },
      navigation: {
        defaultTo: { path: withRouteLocale(route, '/menu/pho/matrix') }
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
        defaultTo: { path: withRouteLocale(route, '/menu/query/zhonggu') }
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
        defaultTo: { path: withRouteLocale(route, '/menu/result') }
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
        defaultTo: { path: withRouteLocale(route, '/menu/map/view') }
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
        defaultTo: { path: withRouteLocale(route, '/menu/compare/zhonggu') }
      }
    }),
    createMenuTab({
      tab: 'charClass',
      label: t('navigation.tabs.charClass'),
      icon: '📚',
      display: {
        preset: 'standard',
        overrides: { scroll: 'right', weight: 0.7, weightIconOnly: 0.3 }
      },
      navigation: {
        defaultTo: { path: withRouteLocale(route, '/explore/char-class'), query: { tab: 'zhonggu' } }
      }
    }),
    createMenuTab({
      tab: 'words',
      label: t('navigation.tabs.phrases'),
      icon: '📖',
      display: {
        preset: 'standard',
        overrides: { scroll: 'right', weight: 0.7, weightIconOnly: 0.3 }
      },
      navigation: {
        defaultTo: { path: withRouteLocale(route, '/menu/words') }
      }
    }),
    createMenuTab({
      tab: 'villages',
      label: t('navigation.tabs.villages'),
      icon: '🏘️',
      display: {
        preset: 'standard',
        overrides: { scroll: 'right', weight: 0.7, weightIconOnly: 0.3 }
      },
      navigation: {
        defaultTo: { path: withRouteLocale(route, '/menu/villages') }
      }
    }),
    createMenuTab({
      tab: 'tools',
      label: t('navigation.tabs.tools'),
      icon: '🧰',
      display: {
        preset: 'standard',
        overrides: { scroll: 'right', weight: 0.7, weightIconOnly: 0.3 }
      },
      navigation: {
        defaultTo: { path: withRouteLocale(route, '/menu/tools') }
      }
    }),
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

  const normalizedPath = stripLocaleFromPath(route?.path || '')
  if (MENU_CHILD_PATHS[tabKey]?.includes(normalizedPath)) {
    writeMenuBarMemory(tabKey, normalizedPath)
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

export function resolveMenuBarTarget(tabConfig, currentRoute = null) {
  if (!tabConfig?.to) {
    const tabKey = tabConfig?.navigation?.tabKey || tabConfig?.tab
    return MENU_CHILD_PATHS[tabKey]?.[0] || withRouteLocale(currentRoute, '/menu/query/zhonggu')
  }

  if (!tabConfig.navigation?.rememberChild) {
    return tabConfig.to
  }

  const rememberedPath = readMenuBarMemory(tabConfig.navigation.tabKey)
  if (!rememberedPath) {
    return tabConfig.to
  }

  const locale = extractLocaleFromPath(tabConfig.to?.path || '/')
  return buildLocalePath(locale, rememberedPath)
}
