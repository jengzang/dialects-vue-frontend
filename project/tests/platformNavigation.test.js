import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  isInternalAppNavigationTarget,
  navigatePlatformLink,
  resolveInternalNavigationTarget,
} from '../src/platform/navigation.js'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function createRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
  }
}

describe('platform navigation', () => {
  it('treats app paths as internal navigation even when a menu item is marked external', async () => {
    const router = createRouter()
    const openExternal = vi.fn()

    await navigatePlatformLink(router, '/zh-Hant/explore/tools/praat', {
      external: true,
      openExternal,
    })

    expect(router.push).toHaveBeenCalledWith('/zh-Hant/explore/tools/praat')
    expect(openExternal).not.toHaveBeenCalled()
  })

  it('keeps route objects inside Vue Router', async () => {
    const router = createRouter()
    const target = { path: '/zh-Hant/menu/query/zhonggu', query: { tab: 'tone' } }

    await navigatePlatformLink(router, target)

    expect(router.push).toHaveBeenCalledWith(target)
  })

  it('converts same-origin absolute app URLs into internal paths', async () => {
    const router = createRouter()
    const openExternal = vi.fn()

    await navigatePlatformLink(router, 'https://dialects.yzup.top/zh-CN/menu/source?from=app#top', {
      currentOrigin: 'https://dialects.yzup.top',
      external: true,
      openExternal,
    })

    expect(router.push).toHaveBeenCalledWith('/zh-CN/menu/source?from=app#top')
    expect(openExternal).not.toHaveBeenCalled()
  })

  it('converts production app URLs into internal paths inside native webviews', () => {
    expect(resolveInternalNavigationTarget('https://dialects.yzup.top/zh-CN/menu/query/zhonggu', {
      currentOrigin: 'capacitor://localhost',
    })).toBe('/zh-CN/menu/query/zhonggu')
  })

  it('does not treat non-app paths on the production domain as internal routes', () => {
    expect(resolveInternalNavigationTarget('https://dialects.yzup.top/detail/', {
      currentOrigin: 'capacitor://localhost',
    })).toBeNull()
    expect(resolveInternalNavigationTarget('/data/sample/vocabulary_sample_table.xlsx')).toBeNull()
    expect(resolveInternalNavigationTarget('https://dialects.yzup.top/zh-CN/villagesML', {
      currentOrigin: 'capacitor://localhost',
    })).toBeNull()
    expect(resolveInternalNavigationTarget('/zh-CN/villagesML')).toBeNull()
  })

  it('opens root-relative non-app links against the production web origin', async () => {
    const router = createRouter()
    const openExternal = vi.fn()

    await navigatePlatformLink(router, '/detail/', { openExternal })

    expect(router.push).not.toHaveBeenCalled()
    expect(openExternal).toHaveBeenCalledWith('https://dialects.yzup.top/detail/')
  })

  it('opens true external URLs outside the app router', async () => {
    const router = createRouter()
    const openExternal = vi.fn()

    await navigatePlatformLink(router, 'https://github.com/jengzang/dialects-vue-frontend', {
      currentOrigin: 'https://dialects.yzup.top',
      openExternal,
    })

    expect(router.push).not.toHaveBeenCalled()
    expect(openExternal).toHaveBeenCalledWith('https://github.com/jengzang/dialects-vue-frontend')
  })

  it('exposes pure helpers for component tests and menu audits', () => {
    expect(isInternalAppNavigationTarget('/zh-Hant/')).toBe(true)
    expect(isInternalAppNavigationTarget('https://github.com/jengzang')).toBe(false)
    expect(resolveInternalNavigationTarget('https://dialects.yzup.top/en/menu/privacy', {
      currentOrigin: 'https://dialects.yzup.top',
    })).toBe('/en/menu/privacy')
  })

  it('keeps sidebar app routes out of the external-link category', () => {
    const source = readFileSync(resolve(projectRoot, 'src/main/config/BarAndTabs/SideBarConfig.js'), 'utf8')

    expect(source).not.toMatch(/path:\s*withRouteLocale\(route,\s*'\/'\),\n\s*external:\s*true/)
    expect(source).not.toMatch(/path:\s*withRouteLocale\(route,\s*'\/explore\/tools\/praat'\),\n\s*external:\s*true/)
    expect(source).not.toMatch(/path:\s*buildLocalePath\('zh-Hant',\s*'\/'\),\n\s*external:\s*true/)
  })
})
