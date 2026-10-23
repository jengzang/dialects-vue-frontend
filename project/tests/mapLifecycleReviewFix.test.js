import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

const villageMapPopupPath = resolve(projectRoot, 'src/main/components/map/popups/VillageMapPopup.vue')
const spatialMapPath = resolve(projectRoot, 'src/VillagesML/workspace/modules/spatial/SpatialMap.vue')
const yuBaoMapPath = resolve(projectRoot, 'src/main/components/map/YuBaoMap.vue')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

describe('Map lifecycle review fixes', () => {
  it('VillageMapPopup restores overlays after style.load and rebinds clustered interactions safely', () => {
    const source = readSource(villageMapPopupPath)

    expect(source).toContain("map.value.once('style.load'")
    expect(source).toContain('renderMarkers()')
    expect(source).toContain('const unbindClusteredInteractions = () => {')
    expect(source).toContain("map.value.off('click', 'clusters', clusteredInteractionHandlers.clickClusters)")
    expect(source).toContain("map.value.off('mouseenter', 'unclustered-point-bg', clusteredInteractionHandlers.mouseEnterPoint)")
    expect(source).toContain("map.value.off('mouseleave', 'clusters', clusteredInteractionHandlers.mouseLeaveClusters)")
    expect(source).not.toContain("map.value.on('click', 'clusters', (e) =>")
  })

  it('SpatialMap clears registered layer interactions before rerendering map layers', () => {
    const source = readSource(spatialMapPath)

    expect(source).toContain('const layerInteractionHandlers = new Map()')
    expect(source).toContain('const clearLayerInteractions = () => {')
    expect(source).toContain('clearLayerInteractions()')
    expect(source).toContain('bindLayerInteractions(layerId, {')
    expect(source).toContain("bindLayerInteractions('villages-layer', {")
    expect(source).toContain("bindLayerInteractions('clusters-layer', {")
    expect(source).not.toContain("map.value.on('click', 'villages-layer', (e) =>")
    expect(source).not.toContain("map.value.on('click', 'clusters-layer', (e) =>")
  })

  it('YuBaoMap rebuilds style-switched layers after style.load with the original cluster settings', () => {
    const source = readSource(yuBaoMapPath)
    const clusterMaxZoomMatches = source.match(/clusterMaxZoom: 14/g) ?? []
    const clusterRadiusMatches = source.match(/clusterRadius: 50/g) ?? []

    expect(source).toContain("map.value.once('style.load'")
    expect(source).not.toContain("map.value.once('styledata'")
    expect(clusterMaxZoomMatches.length).toBeGreaterThanOrEqual(2)
    expect(clusterRadiusMatches.length).toBeGreaterThanOrEqual(2)
    expect(source).not.toContain('clusterMaxZoom: 12')
    expect(source).not.toContain('clusterRadius: 30')
  })
})
