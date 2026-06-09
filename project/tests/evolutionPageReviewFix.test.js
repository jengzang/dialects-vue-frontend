import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')
const evolutionPagePath = resolve(projectRoot, 'src/main/components/pho/EvolutionPage.vue')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

describe('Evolution page review fixes', () => {
  it('queries evolution charts with matched get_locs locations instead of raw textarea input', () => {
    const source = readSource(evolutionPagePath)

    expect(source).toContain('@update:matched-locations="handleMatchedLocations"')
    expect(source).toContain('@update:is-matching="handleIsMatching"')
    expect(source).toContain('const matchedLocations = ref([])')
    expect(source).toContain('const isMatching = ref(false)')
    expect(source).toContain('locations: matchedLocations.value')
    expect(source).not.toContain('locations: selectedLocations.value')
  })

  it('re-renders evolution charts only after loading mode releases the chart container', () => {
    const source = readSource(evolutionPagePath)

    expect(source).toContain('let shouldRefreshVisualization = false')
    expect(source).toContain('shouldRefreshVisualization = true')
    expect(source).toContain('isLoading.value = false')
    expect(source).toContain('if (shouldRefreshVisualization) {')
    expect(source).toContain('await nextTick()')
    expect(source).toContain('updateContainerSize()')
    expect(source).toContain('await renderCurrentVisualization()')
  })

  it('registers hover detail events only for desktop pie charts', () => {
    const source = readSource(evolutionPagePath)
    const interactionStart = source.indexOf("// 绑定点击：钉住卡片 (注意传 index)")
    const interactionEnd = source.indexOf('  return chart', interactionStart)
    const interactionSection = source.slice(interactionStart, interactionEnd)

    expect(interactionSection).toContain("chart.on('click', (params) => handleInteraction(index, params, true))")
    expect(interactionSection).toContain("if (!isMobileLayout.value) {")
    expect(interactionSection).toContain("chart.on('mouseover', (params) => handleInteraction(index, params, false))")
    expect(interactionSection).toContain("chart.on('mouseout', () => {")
    expect(interactionSection.indexOf('if (!isMobileLayout.value) {')).toBeLessThan(
      interactionSection.indexOf("chart.on('mouseover', (params) => handleInteraction(index, params, false))"),
    )
  })
})
