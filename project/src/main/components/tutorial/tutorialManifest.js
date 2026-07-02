import { stripLocaleFromPath } from '@/i18n/localeRouting.js'

function readQueryValue(query, key) {
  const rawValue = query?.[key]
  if (Array.isArray(rawValue)) {
    return rawValue[0] || ''
  }
  return rawValue || ''
}

function createPathEntry({ key, categoryKey, groupKey, order, path, docKey }) {
  return {
    key,
    docKey: docKey || key,
    categoryKey,
    groupKey,
    order,
    match: (currentRoute) => stripLocaleFromPath(currentRoute.path) === stripLocaleFromPath(path),
  }
}

function createQueryEntry({ key, categoryKey, groupKey, order, path, queryResolver, expectedValue, docKey }) {
  return {
    key,
    docKey: docKey || key,
    categoryKey,
    groupKey,
    order,
    match: (currentRoute) => stripLocaleFromPath(currentRoute.path) === stripLocaleFromPath(path) && queryResolver(currentRoute) === expectedValue,
  }
}

function createPathPrefixEntry({ key, categoryKey, groupKey, order, pathPrefix, docKey }) {
  return {
    key,
    docKey: docKey || key,
    categoryKey,
    groupKey,
    order,
    match: (currentRoute) => stripLocaleFromPath(currentRoute.path).startsWith(stripLocaleFromPath(pathPrefix)),
  }
}

function normalizeAuthView(currentRoute) {
  const view = readQueryValue(currentRoute.query, 'view')

  if (view === 'register' || view === 'leaderboard' || view === 'modify') {
    return view
  }

  if (view === 'overview' || view === 'profile') {
    return 'overview'
  }

  return 'login'
}

function normalizePraatTab(currentRoute) {
  const tab = readQueryValue(currentRoute.query, 'tab')
  const validTabs = ['upload', 'results', 'vowelspace', 'pitchtone']
  return validTabs.includes(tab) ? tab : 'upload'
}

export const tutorialManifest = [
  // ==================== 账户与个人数据 ====================
  createQueryEntry({
    key: 'auth-login',
    categoryKey: 'account',
    groupKey: 'authAccount',
    order: 0,
    path: '/auth',
    queryResolver: normalizeAuthView,
    expectedValue: 'login',
  }),
  createQueryEntry({
    key: 'auth-overview',
    categoryKey: 'account',
    groupKey: 'authAccount',
    order: 1,
    path: '/auth',
    queryResolver: normalizeAuthView,
    expectedValue: 'overview',
  }),
  createPathEntry({
    key: 'auth-data',
    categoryKey: 'account',
    groupKey: 'authData',
    order: 2,
    path: '/auth/data',
  }),
  createPathEntry({
    key: 'auth-regions',
    categoryKey: 'account',
    groupKey: 'authData',
    order: 3,
    path: '/auth/regions',
  }),
  createPathEntry({
    key: 'menu-map-custom',
    categoryKey: 'account',
    groupKey: 'menuMapCustom',
    order: 4,
    path: '/menu/map/custom',
  }),

  // ==================== 多方言点对比分析 ====================
  createPathEntry({
    key: 'menu-query-char',
    categoryKey: 'multiCompare',
    groupKey: 'menuQuery',
    order: 10,
    path: '/menu/query/char',
  }),
  createPathEntry({
    key: 'menu-query-zhonggu',
    categoryKey: 'multiCompare',
    groupKey: 'menuQuery',
    order: 11,
    path: '/menu/query/zhonggu',
  }),
  createPathEntry({
    key: 'menu-query-yinwei',
    categoryKey: 'multiCompare',
    groupKey: 'menuQuery',
    order: 12,
    path: '/menu/query/yinwei',
  }),
  createPathEntry({
    key: 'menu-query-tone',
    categoryKey: 'multiCompare',
    groupKey: 'menuQuery',
    order: 13,
    path: '/menu/query/tone',
  }),
  createPathEntry({
    key: 'menu-compare-char',
    categoryKey: 'multiCompare',
    groupKey: 'menuCompare',
    order: 14,
    path: '/menu/compare/char',
  }),
  createPathEntry({
    key: 'menu-compare-zhonggu',
    categoryKey: 'multiCompare',
    groupKey: 'menuCompare',
    order: 15,
    path: '/menu/compare/zhonggu',
  }),
  createPathEntry({
    key: 'menu-compare-tone',
    categoryKey: 'multiCompare',
    groupKey: 'menuCompare',
    order: 16,
    path: '/menu/compare/tone',
  }),
  createPathEntry({
    key: 'menu-map-view',
    categoryKey: 'multiCompare',
    groupKey: 'menuMapOverview',
    order: 17,
    path: '/menu/map/view',
  }),
  createPathEntry({
    key: 'menu-map-divide',
    categoryKey: 'multiCompare',
    groupKey: 'menuMapOverview',
    order: 18,
    path: '/menu/map/divide',
  }),
  createPathEntry({
    key: 'menu-result',
    categoryKey: 'multiCompare',
    groupKey: 'menuMapOverview',
    order: 19,
    path: '/menu/result',
  }),

  // ==================== 单方言点深入探索 ====================
  createPathEntry({
    key: 'menu-pho-matrix',
    categoryKey: 'singleAnalysis',
    groupKey: 'menuPhonology',
    order: 20,
    path: '/menu/pho/matrix',
  }),
  createPathEntry({
    key: 'menu-pho-custom',
    categoryKey: 'singleAnalysis',
    groupKey: 'menuPhonology',
    order: 21,
    path: '/menu/pho/custom',
  }),
  createPathEntry({
    key: 'menu-pho-count',
    categoryKey: 'singleAnalysis',
    groupKey: 'menuPhonology',
    order: 22,
    path: '/menu/pho/count',
  }),
  createPathEntry({
    key: 'menu-pho-evolution',
    categoryKey: 'singleAnalysis',
    groupKey: 'menuPhonology',
    order: 23,
    path: '/menu/pho/evolution',
  }),

  // ==================== 词句与字集 ====================
  createPathPrefixEntry({
    key: 'explore-yubao',
    categoryKey: 'corpusAndCharClass',
    groupKey: 'exploreYubao',
    order: 30,
    pathPrefix: '/explore/yubao',
  }),
  createPathPrefixEntry({
    key: 'explore-char-class',
    categoryKey: 'corpusAndCharClass',
    groupKey: 'exploreCharClass',
    order: 31,
    pathPrefix: '/explore/char-class',
  }),
  createPathEntry({
    key: 'explore-yc-spoken',
    categoryKey: 'corpusAndCharClass',
    groupKey: 'exploreYcSpoken',
    order: 32,
    path: '/explore/yc-spoken',
  }),

  // ==================== 实用工具 ====================
  createQueryEntry({
    key: 'explore-praat-upload',
    categoryKey: 'practicalTools',
    groupKey: 'praat',
    order: 40,
    path: '/explore/tools/praat',
    queryResolver: normalizePraatTab,
    expectedValue: 'upload',
  }),
  createQueryEntry({
    key: 'explore-praat-results',
    categoryKey: 'practicalTools',
    groupKey: 'praat',
    order: 41,
    path: '/explore/tools/praat',
    queryResolver: normalizePraatTab,
    expectedValue: 'results',
  }),
  createQueryEntry({
    key: 'explore-praat-vowelspace',
    categoryKey: 'practicalTools',
    groupKey: 'praat',
    order: 42,
    path: '/explore/tools/praat',
    queryResolver: normalizePraatTab,
    expectedValue: 'vowelspace',
  }),
  createQueryEntry({
    key: 'explore-praat-pitchtone',
    categoryKey: 'practicalTools',
    groupKey: 'praat',
    order: 43,
    path: '/explore/tools/praat',
    queryResolver: normalizePraatTab,
    expectedValue: 'pitchtone',
  }),
  createPathEntry({
    key: 'explore-check',
    categoryKey: 'practicalTools',
    groupKey: 'exploreTools',
    order: 44,
    path: '/explore/tools/check',
  }),
  createPathEntry({
    key: 'explore-jyut2ipa',
    categoryKey: 'practicalTools',
    groupKey: 'exploreTools',
    order: 45,
    path: '/explore/tools/jyut2ipa',
  }),
  createPathEntry({
    key: 'explore-merge',
    categoryKey: 'practicalTools',
    groupKey: 'exploreTools',
    order: 46,
    path: '/explore/tools/merge',
  }),
  createPathEntry({
    key: 'menu-map-draw',
    categoryKey: 'practicalTools',
    groupKey: 'menuMapDraw',
    order: 47,
    path: '/menu/map/draw',
  }),

  // ==================== 自然村 ====================
  createPathEntry({
    key: 'explore-villages-gd',
    categoryKey: 'villages',
    groupKey: 'exploreVillages',
    order: 50,
    path: '/explore/villages/gd',
  }),
  createPathEntry({
    key: 'explore-villages-table',
    categoryKey: 'villages',
    groupKey: 'exploreVillages',
    order: 51,
    path: '/explore/villages/table',
  }),
  createPathPrefixEntry({
    key: 'villagesML',
    categoryKey: 'villages',
    groupKey: 'villagesML',
    order: 52,
    pathPrefix: '/villagesML',
  }),
]
