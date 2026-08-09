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
        component: MenuEntry,
        meta: {
          queryAllowlist: {
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
              vocabulary: [],
              yubao: [],
              villages: []
            }
          }
        }
      },
      ...menuRoutes,
      {
        path: 'explore',
        component: ExploreEntry,
        meta: {
          queryAllowlist: {
            base: ['page'],
            variantKey: 'page',
            variants: {
              CharacterClassification: ['sub', 'table', 'levels'],
              praat: ['tab'],
              VillagesML: ['module', 'subtab', 'pattern', 'ngram', 'villageId', 'detail'],
              ycVillages: [],
              manage: [],
              gdVillages: [],
              gdVillagesTable: [],
              allVillages: [],
              check: [],
              jyut2ipa: [],
              merge: [],
              derive: []
            }
          }
        }
      },
      ...exploreRoutes,
      {
        path: 'praat',
        redirect: createLocaleRedirect('/explore/tools/praat')
      },
      {
        path: 'menu/map/draw',
        redirect: createLocaleRedirect('/explore/gis')
      },
      {
        path: 'auth',
        component: Auth,
        meta: { queryAllowlist: ['view', 'redirect'] }
      },
      {
        path: 'auth/data',
        component: UserDataPage,
        meta: { queryAllowlist: ['username'] }
      },
      {
        path: 'auth/regions',
        component: UserRegionPage,
        meta: { queryAllowlist: ['username'] }
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
    component: VillagesMLBridge,
    meta: { queryAllowlist: ['module', 'subtab', 'pattern', 'ngram', 'villageId'] }
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

function resolveQueryAllowlistConfig(to) {
  for (const record of [...to.matched].reverse()) {
    if (record.meta?.queryAllowlist) {
      return record.meta.queryAllowlist
    }
  }
  return null
}

function sanitizeQueryByRoute(to) {
  const config = resolveQueryAllowlistConfig(to)
  if (!config) {
    return {}
  }

  if (Array.isArray(config)) {
    const sanitized = {}
    config.forEach((key) => {
      if (to.query[key] !== undefined && to.query[key] !== null && to.query[key] !== '') {
        sanitized[key] = to.query[key]
      }
    })
    return sanitized
  }

  const allowedKeys = new Set(config.base || [])
  const variantKey = config.variantKey
  const variantValue = variantKey
    ? (to.params?.[variantKey] || to.query?.[variantKey])
    : null
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
