import { describe, expect, it } from 'vitest'

import {
  resolveLegacyExploreRoute,
  resolveLegacyMenuRoute,
} from '../src/main/router/legacyRouteMap.js'

describe('legacy route map', () => {
  it('maps legacy menu query tab routes to canonical menu paths', () => {
    expect(resolveLegacyMenuRoute({
      tab: 'query',
      sub: 'tab1',
      foo: 'bar',
    })).toEqual({
      path: '/menu/query/char',
      query: { foo: 'bar' },
    })

    expect(resolveLegacyMenuRoute({
      tab: 'compare',
      sub: 'tab4',
      feature: 'tone',
    })).toEqual({
      path: '/menu/compare/tone',
      query: { feature: 'tone' },
    })
  })

  it('returns null for unknown legacy menu tabs', () => {
    expect(resolveLegacyMenuRoute({
      tab: 'missing',
      sub: 'tab1',
    })).toBe(null)
  })

  it('maps legacy explore YuBao and character classification tabs to canonical query state', () => {
    expect(resolveLegacyExploreRoute({
      page: 'YuBao',
      sub: 'grammar',
      foo: 'bar',
    })).toEqual({
      path: '/explore/yubao',
      query: {
        foo: 'bar',
        tab: 'grammar',
      },
    })

    expect(resolveLegacyExploreRoute({
      page: 'CharacterClassification',
      sub: 'invalid',
      levels: '2',
    })).toEqual({
      path: '/explore/char-class',
      query: {
        levels: '2',
        tab: 'zhonggu',
      },
    })
  })

  it('maps legacy explore vocabulary view tabs to the canonical vocabulary view route', () => {
    expect(resolveLegacyExploreRoute({
      page: 'Vocabulary',
      sub: 'card',
      foo: 'bar',
    })).toEqual({
      path: '/explore/vocabulary/view',
      query: {
        foo: 'bar',
        tab: 'card',
      },
    })
  })

  it('maps legacy VillagesML routes to the correct bridge target', () => {
    expect(resolveLegacyExploreRoute({
      page: 'VillagesML',
      module: 'dashboard',
      subtab: 'overview',
    })).toEqual({
      path: '/explore/villages/ml',
      query: {
        module: 'dashboard',
        subtab: 'overview',
      },
    })

    expect(resolveLegacyExploreRoute({
      page: 'VillagesML',
      module: 'regional',
      subtab: 'vectors',
    })).toEqual({
      path: '/villagesML',
      query: {
        module: 'regional',
        subtab: 'vectors',
      },
    })
  })
})
