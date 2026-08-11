import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

function rangeInputs(source) {
  return [...source.matchAll(/<input\b[^>]*\btype=["']range["'][^>]*>/g)].map((match) => match[0])
}

function classAttributes(source) {
  return [...source.matchAll(/\bclass=["']([^"']*)["']/g)].map((match) => match[1])
}

describe('shared glass range conventions', () => {
  it('defines one reusable main range appearance primitive', () => {
    const source = readSource('src/styles/main/_forms.scss')

    expect(source).toContain('.glass-range')
    expect(source).toContain('var(--glass-range-progress, 0%)')
    expect(source).toContain('::-webkit-slider-runnable-track')
    expect(source).toContain('::-moz-range-track')
  })

  it('uses the shared range primitive for every current range input', () => {
    const files = [
      'src/main/views/menu/ComparePage.vue',
      'src/main/components/map/Draw/panels/MapDrawVoronoiPanel.vue',
      'src/main/components/map/Draw/panels/MapDrawToolsPanel.vue',
      'src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue',
      'src/main/components/user/auth/AvatarCustomizerModal.vue',
    ]

    for (const file of files) {
      const inputs = rangeInputs(readSource(file))
      expect(inputs.length, `${file} should contain range inputs`).toBeGreaterThan(0)

      for (const input of inputs) {
        expect(input, `${file} range input should use glass-range`).toMatch(
          /\bclass=["'][^"']*\bglass-range\b/,
        )
      }
    }
  })

  it('keeps VillagesML dashboard on its own panel primitive', () => {
    const source = readSource('src/VillagesML/dashboard/Dashboard.vue')
    const classTokens = classAttributes(source).flatMap((className) => className.trim().split(/\s+/))

    expect(classTokens).not.toContain('glass-panel')
    expect(source).toMatch(/\bclass=["'][^"']*\bvml-glass-panel\b/)
  })
})
