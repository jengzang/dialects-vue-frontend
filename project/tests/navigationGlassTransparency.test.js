import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')
const translucentBackground = 'linear-gradient(135deg, var(--surface-glass-floating), var(--surface-glass-floating-subtle));'

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
    const tokenSource = readSource('src/styles/global/_tokens.scss')
    const toolbarSource = readSource('src/styles/main/_toolbars.scss')
    const sidebarSource = readSource('src/components/bar/SimpleSidebar.vue')

    expect(tokenSource).toContain('--sidebar-shell-background: var(--glass-20);')
    expect(tokenSource.match(/--sidebar-shell-background: var\(--glass-10\);/g)).toHaveLength(3)
    expect(toolbarSource).toContain('backdrop-filter: blur(24px) saturate(145%);')
    expect(toolbarSource).toContain('-webkit-backdrop-filter: blur(24px) saturate(145%);')
    expect(sidebarSource).toMatch(/<Teleport to="body">[\s\S]*?<Transition name="fade">/)
    expect(sidebarSource).toMatch(/<Transition name="slide-fade">\s*<div v-if="isOpen" class="sidebar main-sidebar-shell"/)
  })
})
