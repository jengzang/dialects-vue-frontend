import { describe, expect, it } from 'vitest'
import { menuRoutes } from '../src/main/router/menuRoutes.js'

describe('Vocabulary source route query', () => {
  it('keeps the selected source while preserving the view tab', () => {
    const vocabularyRoute = menuRoutes.find((route) => route.path === 'menu/vocabulary')
    const viewRoute = vocabularyRoute.children.find((route) => route.path === 'view')

    expect(viewRoute.meta.queryAllowlist).toEqual(['tab', 'source'])
  })
})
