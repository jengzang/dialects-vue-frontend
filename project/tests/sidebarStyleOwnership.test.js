import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('sidebar style ownership', () => {
  it('keeps sidebar rules in the shared sidebar component and submenu surface shared', () => {
    const sidebar = readFileSync('src/components/bar/SimpleSidebar.vue', 'utf8')
    const submenu = readFileSync('src/components/bar/_submenu.scss', 'utf8')
    expect(sidebar).toContain(':global(.main-sidebar-shell)')
    expect(sidebar).toContain(':global(.main-sidebar-submenu-item:hover)')
    expect(existsSync('src/styles/main/_toolbars.scss')).toBe(false)
    expect(submenu).toContain('.main-submenu-panel')
  })
})
