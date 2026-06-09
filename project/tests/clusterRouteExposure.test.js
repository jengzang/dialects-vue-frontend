import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('cluster route exposure', () => {
  it('keeps the route registered while menu bar and sidebar stay hidden', () => {
    const menuRoutesSource = readSource('src/main/router/menuRoutes.js')
    const menuBarSource = readSource('src/main/config/BarAndTabs/MenuBarConfig.js')
    const sidebarSource = readSource('src/main/config/BarAndTabs/SideBarConfig.js')

    expect(menuRoutesSource).toContain("path: '/menu/cluster'")
    expect(menuBarSource).toContain("if (route.path === '/menu/cluster') return 'cluster'")
    expect(menuBarSource).not.toContain("tab: 'cluster'")
    expect(sidebarSource).toContain('cluster intentionally remains disabled in the i18n sidebar config.')
  })

  it('does not restore a visible home-page cluster entry', () => {
    const homePageSource = readSource('src/main/views/HomePage.vue')

    expect(homePageSource).not.toContain("navigateTo('/menu/cluster')")
  })
})
