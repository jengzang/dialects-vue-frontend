export const MENU_LEGACY_ROUTES = {
  query: {
    defaultPath: '/menu/query/zhonggu',
    subMap: {
      tab1: '/menu/query/char',
      tab2: '/menu/query/zhonggu',
      tab3: '/menu/query/yinwei',
      tab4: '/menu/query/tone'
    }
  },
  compare: {
    defaultPath: '/menu/compare/zhonggu',
    subMap: {
      tab1: '/menu/compare/char',
      tab2: '/menu/compare/zhonggu',
      tab4: '/menu/compare/tone',
      tab5: '/menu/compare/phonetic'
    }
  },
  map: {
    defaultPath: '/menu/map/view',
    subMap: {
      map: '/menu/map/view',
      divide: '/menu/map/divide',
      custom: '/menu/map/custom',
      draw: '/menu/map/draw'
    }
  },
  pho: {
    defaultPath: '/menu/pho/matrix',
    subMap: {
      phonologyMatrix: '/menu/pho/matrix',
      phonologyCustom: '/menu/pho/custom',
      Countphos: '/menu/pho/count',
      evolution: '/menu/pho/evolution',
      pieVector: '/menu/pho/evolution'
    }
  },
  about: {
    defaultPath: '/menu/about/intro',
    subMap: {
      intro: '/menu/about/intro',
      suggestion: '/menu/about/suggestion',
      like: '/menu/about/like',
      setting: '/menu/settings'
    }
  },
  result: {
    defaultPath: '/menu/result'
  },
  source: {
    defaultPath: '/menu/source'
  },
  privacy: {
    defaultPath: '/menu/privacy'
  },
  tools: {
    defaultPath: '/menu/tools'
  },
  words: {
    defaultPath: '/menu/words'
  },
  villages: {
    defaultPath: '/menu/villages'
  },
  cluster: {
    defaultPath: '/menu/cluster'
  }
}

export const EXPLORE_LEGACY_ROUTES = {
  check: {
    path: '/explore/tools/check'
  },
  jyut2ipa: {
    path: '/explore/tools/jyut2ipa'
  },
  merge: {
    path: '/explore/tools/merge'
  },
  derive: {
    path: '/explore/tools/derive'
  },
  praat: {
    path: '/explore/tools/praat'
  },
  manage: {
    path: '/explore/manage'
  },
  YuBao: {
    path: '/explore/yubao',
    defaultTab: 'vocabulary',
    tabMap: {
      vocabulary: 'vocabulary',
      grammar: 'grammar'
    }
  },
  Vocabulary: {
    path: '/explore/vocabulary/view',
    defaultTab: 'table',
    tabMap: {
      table: 'table',
      card: 'card',
      map: 'map'
    }
  },
  CharacterClassification: {
    path: '/explore/char-class',
    defaultTab: 'zhonggu',
    tabMap: {
      zhonggu: 'zhonggu',
      shanggu: 'shanggu',
      jingu: 'jingu',
      yueyun: 'yueyun'
    }
  },
  ycSpoken: {
    path: '/explore/yc-spoken'
  },
  gdVillages: {
    path: '/explore/villages/gd'
  },
  gdVillagesTable: {
    path: '/explore/villages/table'
  },
  ycVillages: {
    path: '/explore/villages/yc'
  },
  VillagesML: {
    path: '/explore/villages/ml'
  }
}

export function resolveLegacyMenuRoute(query = {}) {
  const { tab, sub, ...restQuery } = query
  const config = MENU_LEGACY_ROUTES[tab]

  if (!config) {
    return null
  }

  return {
    path: config.subMap?.[sub] || config.defaultPath,
    query: restQuery
  }
}

export function resolveLegacyExploreRoute(query = {}) {
  const { page, sub, ...restQuery } = query
  const config = EXPLORE_LEGACY_ROUTES[page]

  if (!config) {
    return null
  }

  if (page === 'VillagesML') {
    if (restQuery.module && restQuery.module !== 'dashboard') {
      return {
        path: '/villagesML',
        query: restQuery
      }
    }

    return {
      path: config.path,
      query: restQuery
    }
  }

  if (page === 'YuBao' || page === 'Vocabulary' || page === 'CharacterClassification') {
    return {
      path: config.path,
      query: {
        ...restQuery,
        tab: config.tabMap?.[sub] || config.defaultTab
      }
    }
  }

  return {
    path: config.path,
    query: restQuery
  }
}
