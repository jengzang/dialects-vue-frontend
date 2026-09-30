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

  it('keeps the sidebar shell readable with a stronger translucent glass layer', () => {
    const source = readSource('src/styles/global/_tokens.scss')

    expect(source).toContain(
      '--sidebar-shell-background: linear-gradient(135deg, var(--surface-glass-floating-strong), var(--surface-glass-floating));',
    )
  })
})
