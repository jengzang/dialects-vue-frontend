function readQueryValue(query, key) {
  const rawValue = query?.[key]
  if (Array.isArray(rawValue)) {
    return rawValue[0] || ''
  }
  return rawValue || ''
}

function createPathEntry({ key, groupKey, order, path }) {
  return {
    key,
    docKey: key,
    groupKey,
    order,
    match: (currentRoute) => currentRoute.path === path,
  }
}

function createQueryEntry({ key, groupKey, order, path, queryResolver, expectedValue }) {
  return {
    key,
    docKey: key,
    groupKey,
    order,
    match: (currentRoute) => currentRoute.path === path && queryResolver(currentRoute) === expectedValue,
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

function normalizeYuBaoTab(currentRoute) {
  return readQueryValue(currentRoute.query, 'tab') === 'grammar' ? 'grammar' : 'vocabulary'
}

function normalizeCharacterTableTab(currentRoute) {
  const tab = readQueryValue(currentRoute.query, 'tab')
  const validTabs = ['zhonggu', 'shanggu', 'jingu', 'yueyun']
  return validTabs.includes(tab) ? tab : 'zhonggu'
}

export const tutorialManifest = [
  createQueryEntry({
    key: 'auth-login',
    groupKey: 'account',
    order: 0,
    path: '/auth',
    queryResolver: normalizeAuthView,
    expectedValue: 'login',
  }),
  createQueryEntry({
    key: 'auth-register',
    groupKey: 'account',
    order: 1,
    path: '/auth',
    queryResolver: normalizeAuthView,
    expectedValue: 'register',
  }),
  createQueryEntry({
    key: 'auth-overview',
    groupKey: 'account',
    order: 2,
    path: '/auth',
    queryResolver: normalizeAuthView,
    expectedValue: 'overview',
  }),
  createQueryEntry({
    key: 'auth-leaderboard',
    groupKey: 'account',
    order: 3,
    path: '/auth',
    queryResolver: normalizeAuthView,
    expectedValue: 'leaderboard',
  }),
  createQueryEntry({
    key: 'auth-modify',
    groupKey: 'account',
    order: 4,
    path: '/auth',
    queryResolver: normalizeAuthView,
    expectedValue: 'modify',
  }),
  createPathEntry({
    key: 'auth-data',
    groupKey: 'account',
    order: 5,
    path: '/auth/data',
  }),
  createPathEntry({
    key: 'auth-regions',
    groupKey: 'account',
    order: 6,
    path: '/auth/regions',
  }),
  createPathEntry({
    key: 'menu-query-char',
    groupKey: 'menuQuery',
    order: 7,
    path: '/menu/query/char',
  }),
  createPathEntry({
    key: 'menu-query-zhonggu',
    groupKey: 'menuQuery',
    order: 8,
    path: '/menu/query/zhonggu',
  }),
  createPathEntry({
    key: 'menu-query-yinwei',
    groupKey: 'menuQuery',
    order: 9,
    path: '/menu/query/yinwei',
  }),
  createPathEntry({
    key: 'menu-query-tone',
    groupKey: 'menuQuery',
    order: 10,
    path: '/menu/query/tone',
  }),
  createPathEntry({
    key: 'menu-compare-char',
    groupKey: 'menuCompare',
    order: 11,
    path: '/menu/compare/char',
  }),
  createPathEntry({
    key: 'menu-compare-zhonggu',
    groupKey: 'menuCompare',
    order: 12,
    path: '/menu/compare/zhonggu',
  }),
  createPathEntry({
    key: 'menu-compare-tone',
    groupKey: 'menuCompare',
    order: 13,
    path: '/menu/compare/tone',
  }),
  createPathEntry({
    key: 'menu-map-view',
    groupKey: 'menuMap',
    order: 14,
    path: '/menu/map/view',
  }),
  createPathEntry({
    key: 'menu-map-divide',
    groupKey: 'menuMap',
    order: 15,
    path: '/menu/map/divide',
  }),
  createPathEntry({
    key: 'menu-map-custom',
    groupKey: 'menuMap',
    order: 16,
    path: '/menu/map/custom',
  }),
  createPathEntry({
    key: 'menu-pho-matrix',
    groupKey: 'menuPhonology',
    order: 17,
    path: '/menu/pho/matrix',
  }),
  createPathEntry({
    key: 'menu-pho-custom',
    groupKey: 'menuPhonology',
    order: 18,
    path: '/menu/pho/custom',
  }),
  createPathEntry({
    key: 'menu-pho-count',
    groupKey: 'menuPhonology',
    order: 19,
    path: '/menu/pho/count',
  }),
  createPathEntry({
    key: 'menu-pho-evolution',
    groupKey: 'menuPhonology',
    order: 20,
    path: '/menu/pho/evolution',
  }),
  createPathEntry({
    key: 'menu-result',
    groupKey: 'menuResources',
    order: 21,
    path: '/menu/result',
  }),
  createPathEntry({
    key: 'menu-about-intro',
    groupKey: 'menuResources',
    order: 22,
    path: '/menu/about/intro',
  }),
  createPathEntry({
    key: 'menu-about-suggestion',
    groupKey: 'menuResources',
    order: 23,
    path: '/menu/about/suggestion',
  }),
  createPathEntry({
    key: 'menu-about-like',
    groupKey: 'menuResources',
    order: 24,
    path: '/menu/about/like',
  }),
  createPathEntry({
    key: 'menu-about-settings',
    groupKey: 'menuResources',
    order: 25,
    path: '/menu/about/settings',
  }),
  createPathEntry({
    key: 'menu-source',
    groupKey: 'menuResources',
    order: 26,
    path: '/menu/source',
  }),
  createPathEntry({
    key: 'menu-privacy',
    groupKey: 'menuResources',
    order: 27,
    path: '/menu/privacy',
  }),
  createPathEntry({
    key: 'menu-tools',
    groupKey: 'menuResources',
    order: 28,
    path: '/menu/tools',
  }),
  createPathEntry({
    key: 'menu-words',
    groupKey: 'menuResources',
    order: 29,
    path: '/menu/words',
  }),
  createPathEntry({
    key: 'menu-villages',
    groupKey: 'menuResources',
    order: 30,
    path: '/menu/villages',
  }),
  createPathEntry({
    key: 'menu-cluster',
    groupKey: 'menuResources',
    order: 31,
    path: '/menu/cluster',
  }),
  createPathEntry({
    key: 'explore-check',
    groupKey: 'exploreTools',
    order: 32,
    path: '/explore/tools/check',
  }),
  createPathEntry({
    key: 'explore-jyut2ipa',
    groupKey: 'exploreTools',
    order: 33,
    path: '/explore/tools/jyut2ipa',
  }),
  createPathEntry({
    key: 'explore-merge',
    groupKey: 'exploreTools',
    order: 34,
    path: '/explore/tools/merge',
  }),
  createPathEntry({
    key: 'explore-manage',
    groupKey: 'exploreTools',
    order: 35,
    path: '/explore/manage',
  }),
  createQueryEntry({
    key: 'explore-praat-upload',
    groupKey: 'praat',
    order: 36,
    path: '/explore/tools/praat',
    queryResolver: normalizePraatTab,
    expectedValue: 'upload',
  }),
  createQueryEntry({
    key: 'explore-praat-results',
    groupKey: 'praat',
    order: 37,
    path: '/explore/tools/praat',
    queryResolver: normalizePraatTab,
    expectedValue: 'results',
  }),
  createQueryEntry({
    key: 'explore-praat-vowelspace',
    groupKey: 'praat',
    order: 38,
    path: '/explore/tools/praat',
    queryResolver: normalizePraatTab,
    expectedValue: 'vowelspace',
  }),
  createQueryEntry({
    key: 'explore-praat-pitchtone',
    groupKey: 'praat',
    order: 39,
    path: '/explore/tools/praat',
    queryResolver: normalizePraatTab,
    expectedValue: 'pitchtone',
  }),
  createQueryEntry({
    key: 'explore-yubao-vocabulary',
    groupKey: 'exploreResources',
    order: 40,
    path: '/explore/yubao',
    queryResolver: normalizeYuBaoTab,
    expectedValue: 'vocabulary',
  }),
  createQueryEntry({
    key: 'explore-yubao-grammar',
    groupKey: 'exploreResources',
    order: 41,
    path: '/explore/yubao',
    queryResolver: normalizeYuBaoTab,
    expectedValue: 'grammar',
  }),
  createQueryEntry({
    key: 'explore-char-class-zhonggu',
    groupKey: 'exploreResources',
    order: 42,
    path: '/explore/char-class',
    queryResolver: normalizeCharacterTableTab,
    expectedValue: 'zhonggu',
  }),
  createQueryEntry({
    key: 'explore-char-class-shanggu',
    groupKey: 'exploreResources',
    order: 43,
    path: '/explore/char-class',
    queryResolver: normalizeCharacterTableTab,
    expectedValue: 'shanggu',
  }),
  createQueryEntry({
    key: 'explore-char-class-jingu',
    groupKey: 'exploreResources',
    order: 44,
    path: '/explore/char-class',
    queryResolver: normalizeCharacterTableTab,
    expectedValue: 'jingu',
  }),
  createQueryEntry({
    key: 'explore-char-class-yueyun',
    groupKey: 'exploreResources',
    order: 45,
    path: '/explore/char-class',
    queryResolver: normalizeCharacterTableTab,
    expectedValue: 'yueyun',
  }),
  createPathEntry({
    key: 'explore-yc-spoken',
    groupKey: 'exploreResources',
    order: 46,
    path: '/explore/yc-spoken',
  }),
  createPathEntry({
    key: 'explore-villages-gd',
    groupKey: 'exploreVillages',
    order: 47,
    path: '/explore/villages/gd',
  }),
  createPathEntry({
    key: 'explore-villages-table',
    groupKey: 'exploreVillages',
    order: 48,
    path: '/explore/villages/table',
  }),
  createPathEntry({
    key: 'explore-villages-yc',
    groupKey: 'exploreVillages',
    order: 49,
    path: '/explore/villages/yc',
  }),
]
