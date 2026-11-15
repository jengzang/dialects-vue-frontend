import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { exploreRoutes } from '../src/main/router/exploreRoutes.js'
import { getDefaultTabScroll } from '../src/composables/bar/useBarOverflow.js'

describe('application page', () => {
  it('registers a real explore route', () => {
    expect(exploreRoutes.find(route => route.path === 'explore/application')?.component).toBeTypeOf('function')
  })

  it('places the download tab after Praat and moves it to mobile overflow', () => {
    const source = readFileSync('src/main/config/BarAndTabs/ExploreBarConfig.js', 'utf8')
    const block = source.split("application: createExploreTab({")[1]?.split('createExploreTab({')[0]
    expect(source.indexOf("tab: 'application'")).toBeGreaterThan(source.indexOf("tab: 'praat'"))
    expect(block).toContain("mobileScroll: 'right'")
    expect(block).toContain('/explore/application')
    expect(getDefaultTabScroll({ mobileScroll: 'right' }, true)).toBe('right')
  })

  it('provides web, iOS and Android choices without fabricated download links', () => {
    const page = readFileSync('src/main/views/explore/ApplicationPage.vue', 'utf8')
    expect(page).toContain('application.platforms.web')
    expect(page).toContain('application.platforms.ios')
    expect(page).toContain('application.platforms.android')
    expect(page).toContain('disabled')
    expect(page).toContain('GitHub')
    expect(page).toContain('Gitee')
  })
})
