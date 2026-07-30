import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import i18n from '@/i18n/index.js'
import { waitForAuthReady } from '@/api/auth/auth.js'
import { userStore } from '@/main/store/store.js'
import { showWarning } from '@/utils/ui/message.js'
import { showRouteLoading, hideRouteLoading } from '@/utils/ui/routeLoading.js'
import { menuRoutes } from '@/main/router/menuRoutes.js'
import { exploreRoutes } from '@/main/router/exploreRoutes.js'
import { resolvePreferredLocale } from '@/i18n/localeDetector.js'
import {
  FALLBACK_LOCALE,
  buildLocalePath,
  buildLocaleRedirectTarget,
  detectBrowserLocale,
  extractLocaleFromPath,
  isSupportedLocale,
  normalizeLocale,
  resolveRouteLocale,
  shouldRedirectMainEntry,
  stripLocaleFromPath,
} from '@/i18n/localeRouting.js'
import { setCurrentVillagesMLDatasetFromRoute } from '@/VillagesML/utils/currentDataset.js'
import { buildVillagesMLRedirect } from '@/VillagesML/utils/routeDataset.js'

const HomePage = () => import('@/main/views/HomePage.vue')
const Auth = () => import('./views/auth.vue')
const UserDataPage = () => import('./components/user/UserDataPage.vue')
const UserRegionPage = () => import('./components/user/UserRegionPage.vue')
const MenuEntry = () => import('@/main/views/entry/MenuEntry.vue')
const ExploreEntry = () => import('@/main/views/entry/ExploreEntry.vue')
const VillagesMLBridge = () => import('@/main/views/entry/ExternalRouteBridge.vue')

const DEFAULT_TITLE = '\u65B9\u97F3\u5716\u9451'

function withLocalePath(path, routeLike) {
  return buildLocalePath(resolveRouteLocale(routeLike), path)
}

function createLocaleRedirect(path) {
  return (to) => ({
    path: buildLocalePath(to.params.locale, path),
    query: to.query,
    hash: to.hash,
  })
}

const routes = [
  {
    path: '/:locale(zh-CN|zh-Hant|en)',
    children: [
      {
        path: '',
        component: HomePage
      },
      {
        path: 'menu',
        component: MenuEntry
      },
      ...menuRoutes,
      {
        path: 'explore',
        component: ExploreEntry
      },
      ...exploreRoutes,
      {
        path: 'praat',
        redirect: createLocaleRedirect('/explore/tools/praat')
      },
      {
        path: 'auth',
        component: Auth
      },
      {
        path: 'auth/data',
        component: UserDataPage
      },
      {
        path: 'auth/regions',
        component: UserRegionPage
      },
    ]
  },
  {
    path: '/',
    redirect: () => buildLocalePath(resolvePreferredLocale('/'), '/')
  },
  {
    path: '/menu',
    beforeEnter: (to) => ({
      path: buildLocaleRedirectTarget({
        pathname: '/menu',
        search: typeof window !== 'undefined' ? window.location.search : '',
        hash: to.hash,
        locale: resolvePreferredLocale('/menu'),
      })
    })
  },
  {
    path: '/explore',
    beforeEnter: (to) => ({
      path: buildLocaleRedirectTarget({
        pathname: '/explore',
        search: typeof window !== 'undefined' ? window.location.search : '',
        hash: to.hash,
        locale: resolvePreferredLocale('/explore'),
      })
    })
  },
  {
    path: '/auth',
    beforeEnter: (to) => ({
      path: buildLocaleRedirectTarget({
        pathname: '/auth',
        search: typeof window !== 'undefined' ? window.location.search : '',
        hash: to.hash,
        locale: resolvePreferredLocale('/auth'),
      })
    })
  },
  {
    path: '/villagesML/:pathMatch(.*)*',
    component: VillagesMLBridge
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: (to) => {
      const locale = extractLocaleFromPath(to.path)
      if (locale) {
        return {
          path: buildLocalePath(locale, '/'),
          replace: true,
        }
      }

      if (shouldRedirectMainEntry(to.path)) {
        return {
          path: buildLocaleRedirectTarget({
            pathname: stripLocaleFromPath(to.path),
            search: typeof window !== 'undefined' ? window.location.search : '',
            hash: to.hash,
            locale: resolvePreferredLocale(to.path),
          }),
          replace: true,
        }
      }

      return {
        path: buildLocalePath(resolvePreferredLocale('/'), '/'),
        replace: true,
      }
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

const ROUTE_QUERY_ALLOWLIST = {
  '/menu': {
    base: ['tab'],
    variantKey: 'tab',
    variants: {
      query: ['sub'],
      compare: ['sub'],
      result: [],
      map: ['sub', 'feature', 'locations', 'regions', 'regionMode', 'openPanel', 'phonology'],
      pho: ['sub', 'loc', 'feature', 'h', 'v', 'c'],
      about: ['sub'],
      source: [],
      privacy: [],
      tools: [],
      words: [],
      villages: []
    }
  },
  '/explore': {
    base: ['page'],
    variantKey: 'page',
    variants: {
      CharacterClassification: ['sub', 'table', 'levels'],
      YuBao: ['sub'],
      praat: ['tab'],
      VillagesML: ['module', 'subtab', 'pattern', 'ngram', 'villageId', 'detail'],
      ycVillages: [],
      ycSpoken: [],
      manage: [],
      gdVillages: [],
      gdVillagesTable: [],
      allVillages: [],
      check: [],
      jyut2ipa: [],
      merge: [],
      derive: []
    }
  },
  '/villagesML': {
    base: ['module', 'subtab', 'pattern', 'ngram', 'villageId']
  },
  '/auth': {
    base: ['view', 'redirect']
  },
  '/auth/data': {
    base: ['username']
  },
  '/auth/regions': {
    base: ['username']
  },
  '/explore/tools/praat': {
    base: ['tab']
  },
  '/explore/manage': {
    base: []
  },
  '/explore/yubao': {
    base: ['tab']
  },
  '/explore/vocabulary': {
    base: []
  },
  '/explore/vocabulary/view': {
    base: ['tab']
  },
  '/explore/vocabulary/import': {
    base: []
  },
  '/explore/vocabulary/manage': {
    base: []
  },
  '/explore/char-class': {
    base: ['tab', 'table', 'levels']
  },
  '/explore/yc-spoken': {
    base: []
  },
  '/explore/villages/gd': {
    base: []
  },
  '/explore/villages/table': {
    base: []
  },
  '/explore/villages/yc': {
    base: []
  },
  '/explore/villages/ml': {
    base: []
  },
  '/explore/villages/all': {
    base: []
  },
  '/menu/pho/matrix': {
    base: ['loc']
  },
  '/menu/pho/custom': {
    base: ['loc', 'feature', 'h', 'v', 'c']
  },
  '/menu/pho/count': {
    base: []
  },
  '/menu/pho/evolution': {
    base: ['loc']
  },
  '/menu/about/intro': {
    base: []
  },
  '/menu/about/suggestion': {
    base: []
  },
  '/menu/about/like': {
    base: []
  },
  '/menu/about/settings': {
    base: []
  },
  '/menu/result': {
    base: []
  },
  '/menu/source': {
    base: []
  },
  '/menu/privacy': {
    base: []
  },
  '/menu/tools': {
    base: []
  },
  '/menu/words': {
    base: []
  },
  '/menu/villages': {
    base: []
  },
  '/menu/cluster': {
    base: []
  },
  '/menu/query/char': {
    base: []
  },
  '/menu/query/zhonggu': {
    base: []
  },
  '/menu/query/yinwei': {
    base: []
  },
  '/menu/query/tone': {
    base: []
  },
  '/menu/compare/char': {
    base: []
  },
  '/menu/compare/zhonggu': {
    base: []
  },
  '/menu/compare/tone': {
    base: []
  },
  '/menu/compare/phonetic': {
    base: []
  },
  '/menu/map/view': {
    base: ['feature', 'locations', 'regions', 'regionMode', 'openPanel', 'phonology']
  },
  '/menu/map/divide': {
    base: []
  },
  '/menu/map/custom': {
    base: []
  }
}

function sanitizeQueryByRoute(to) {
  const normalizedPath = stripLocaleFromPath(to.path)
  const config = ROUTE_QUERY_ALLOWLIST[normalizedPath]
  if (!config) {
    return to.query
  }

  const allowedKeys = new Set(config.base || [])
  const variantKey = config.variantKey
  const variantValue = variantKey ? to.query?.[variantKey] : null
  const variantAllowedKeys = variantValue && config.variants?.[variantValue]
    ? config.variants[variantValue]
    : []

  variantAllowedKeys.forEach((key) => allowedKeys.add(key))

  const sanitizedQuery = {}
  Object.entries(to.query || {}).forEach(([key, value]) => {
    if (!allowedKeys.has(key)) return
    if (value === undefined || value === null || value === '') return
    sanitizedQuery[key] = value
  })

  return sanitizedQuery
}

function isSameQuery(left, right) {
  const leftKeys = Object.keys(left || {})
  const rightKeys = Object.keys(right || {})

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every((key) => {
    const leftValue = left[key]
    const rightValue = right[key]

    if (Array.isArray(leftValue) || Array.isArray(rightValue)) {
      const normalizedLeft = Array.isArray(leftValue) ? leftValue : [leftValue]
      const normalizedRight = Array.isArray(rightValue) ? rightValue : [rightValue]
      return normalizedLeft.length === normalizedRight.length &&
        normalizedLeft.every((item, index) => item === normalizedRight[index])
    }

    return leftValue === rightValue
  })
}

router.beforeEach(async (to, from, next) => {
  if (to.fullPath !== from.fullPath) {
    showRouteLoading()
  }

  if (to.path === '/villagesML' || to.path.startsWith('/villagesML/')) {
    const villagesMLRedirect = buildVillagesMLRedirect(to)
    if (villagesMLRedirect) {
      return next(villagesMLRedirect)
    }
    setCurrentVillagesMLDatasetFromRoute(to)
  }

  const routeLocale = to.params.locale
  const currentRouteLocale = routeLocale || extractLocaleFromPath(to.path)

  if (!currentRouteLocale && shouldRedirectMainEntry(to.path)) {
    return next({
      path: buildLocaleRedirectTarget({
        pathname: to.path,
        search: typeof window !== 'undefined' ? window.location.search : '',
        hash: to.hash,
        locale: resolvePreferredLocale(to.path),
      }),
      replace: true,
    })
  }

  if (routeLocale && !isSupportedLocale(routeLocale)) {
    return next({
      path: buildLocalePath(normalizeLocale(routeLocale), stripLocaleFromPath(to.path)),
      query: to.query,
      hash: to.hash,
      replace: true,
    })
  }

  const activeLocale = currentRouteLocale ? normalizeLocale(currentRouteLocale) : detectBrowserLocale()
  if (i18n.global.locale?.value !== activeLocale) {
    i18n.global.locale.value = activeLocale
  }
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', activeLocale)
  }
  await nextTick()

  const localizedAuthPath = withLocalePath('/auth', to)
  const sanitizedQuery = sanitizeQueryByRoute(to)

  if (!isSameQuery(sanitizedQuery, to.query)) {
    return next({
      path: to.path,
      query: sanitizedQuery,
      hash: to.hash,
      replace: true
    })
  }

  if (to.path.endsWith('/auth/data') || to.path.endsWith('/auth/regions')) {
    if (!userStore.authReady) {
      await waitForAuthReady()
    }

    if (!userStore.isAuthenticated) {
      showWarning(i18n.global.t('user.dataPage.messages.authRequired'))
      return next({ path: withLocalePath('/auth', to), replace: true })
    }
  }

  document.title = to.meta?.title || DEFAULT_TITLE
  next()
})

router.afterEach(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hideRouteLoading()
    })
  })
})

router.onError(() => {
  hideRouteLoading()
})

export default router
