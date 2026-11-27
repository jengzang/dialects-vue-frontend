import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')
const translucentBackground = 'var(--bar-background,'

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('navigation glass transparency', () => {
  it('uses translucent glass layers for every floating top bar', () => {
    for (const file of [
      'src/components/bar/NavBar.vue',
      'src/components/bar/ExploreBar.vue',
      'src/components/bar/CommonBar.vue',
    ]) {
      const source = readSource(file)

      expect(source).toContain(translucentBackground)
      expect(source).not.toContain('linear-gradient(135deg, var(--surface-panel-strong), var(--surface-panel-subtle));')
    }
  })

  it('keeps the sidebar shell lightly brightened while preserving the stronger background blur', () => {
    const sidebarSource = readSource('src/components/bar/SimpleSidebar.vue')

    expect(sidebarSource).toContain('--sidebar-shell-background: var(--glass-20);')
    expect(sidebarSource).toContain('backdrop-filter: blur(24px) saturate(145%);')
    expect(sidebarSource).toContain('-webkit-backdrop-filter: blur(24px) saturate(145%);')
    expect(sidebarSource).toMatch(/<Teleport to="body">[\s\S]*?<Transition name="fade">/)
    expect(sidebarSource).toMatch(/<Transition name="slide-fade">\s*<div v-if="isOpen" class="sidebar main-sidebar-shell"/)
  })
})
