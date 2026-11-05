import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

const analysisResultsPanelPath = resolve(projectRoot, 'src/main/components/praat/AnalysisResultsPanel.vue')
const tendencyHeatmapPanelPath = resolve(projectRoot, 'src/VillagesML/workspace/modules/character/TendencyHeatmapPanel.vue')
const featureExtractionPath = resolve(projectRoot, 'src/VillagesML/workspace/modules/ml/FeatureExtraction.vue')
const regionSimilarityPath = resolve(projectRoot, 'src/VillagesML/workspace/modules/regional/RegionSimilarity.vue')
const characterEmbeddingsPath = resolve(projectRoot, 'src/VillagesML/workspace/modules/character/CharacterEmbeddings.vue')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

describe('Chart lifecycle review fixes', () => {
  it('AnalysisResultsPanel stores and clears chart resize observers across rerenders', () => {
    const source = readSource(analysisResultsPanelPath)

    expect(source).toContain('const chartResizeObservers = []')
    expect(source).toContain('const clearChartResizeObservers = () => {')
    expect(source).toContain('chartResizeObservers.push(resizeObserver)')
    expect(source).toContain('clearChartResizeObservers()')
    expect(source).toContain('if (pitchChart) pitchChart.dispose()')
    expect(source).not.toContain('const resizeObserver = new ResizeObserver(() => {\n    pitchChart?.resize()\n  })')
  })

  it('TendencyHeatmapPanel removes its resize listener and disposes the chart on unmount', () => {
    const source = readSource(tendencyHeatmapPanelPath)

    expect(source).toContain("import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'")
    expect(source).toContain('const handleResize = () => {')
    expect(source).toContain("window.addEventListener('resize', handleResize)")
    expect(source).toContain("window.removeEventListener('resize', handleResize)")
    expect(source).toContain('if (chartInstance) {')
    expect(source).toContain('chartInstance.dispose()')
  })

  it('TendencyHeatmapPanel renders existing data on mount so remounting the tab is not blank', () => {
    const source = readSource(tendencyHeatmapPanelPath)

    expect(source).toContain("onMounted(() => {\n  window.addEventListener('resize', handleResize)\n  nextTick(renderChart)\n})")
  })

  it('FeatureExtraction reuses a tracked chart instance and disposes it on unmount', () => {
    const source = readSource(featureExtractionPath)

    expect(source).toContain('onBeforeUnmount')
    expect(source).toContain('let aggregationChartInstance = null')
    expect(source).toContain('if (aggregationChartInstance) aggregationChartInstance.dispose()')
    expect(source).toContain('aggregationChartInstance = initChart(aggregationChart.value)')
    expect(source).toContain('aggregationChartInstance.setOption({')
    expect(source).toContain('onBeforeUnmount(() => {')
  })

  it('RegionSimilarity disposes the heatmap instance when the component unmounts', () => {
    const source = readSource(regionSimilarityPath)

    expect(source).toContain('onBeforeUnmount')
    expect(source).toContain('if (chartInstance) {')
    expect(source).toContain('chartInstance.dispose()')
    expect(source).toContain('chartInstance = null')
  })

  it('CharacterEmbeddings disposes the visualization chart when the page unmounts', () => {
    const source = readSource(characterEmbeddingsPath)

    expect(source).toContain('onBeforeUnmount')
    expect(source).toContain('if (vizChartInstance) {')
    expect(source).toContain('vizChartInstance.dispose()')
    expect(source).toContain('vizChartInstance = null')
  })
})
