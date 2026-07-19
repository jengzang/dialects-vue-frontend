import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')
const editableMapLibrePath = resolve(projectRoot, 'src/main/components/map/EditableMapLibre.vue')
const mapDrawTabPath = resolve(projectRoot, 'src/main/components/map/Tabs/MapDrawTab.vue')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

function drawStylesBlock(source) {
  const start = source.indexOf('const drawStyles = [')
  const end = source.indexOf('const props = defineProps')

  expect(start).toBeGreaterThan(-1)
  expect(end).toBeGreaterThan(start)

  return source.slice(start, end)
}

describe('Map draw editor contracts', () => {
  it('enables Mapbox Draw user properties for active layer styling', () => {
    const source = readSource(editableMapLibrePath)

    expect(source).toContain('userProperties: true')
  })

  it('reads user-prefixed style properties in active Draw layers', () => {
    const source = readSource(editableMapLibrePath)
    const stylesSource = drawStylesBlock(source)

    for (const key of [
      'user_fill',
      'user_stroke',
      'user_fillOpacity',
      'user_strokeWidth',
      'user_visible',
      'user_pointRadius',
      'user_pointColor',
      'user_pointStrokeColor',
    ]) {
      expect(stylesSource).toContain(`['get', '${key}']`)
    }

    for (const key of [
      'fill',
      'stroke',
      'fillOpacity',
      'strokeWidth',
      'visible',
      'pointRadius',
      'pointColor',
      'pointStrokeColor',
    ]) {
      expect(stylesSource).not.toContain(`['get', '${key}']`)
    }
  })

  it('keeps hidden active layer features in Draw state and hides them through style filters', () => {
    const editableSource = readSource(editableMapLibrePath)
    const tabSource = readSource(mapDrawTabPath)
    const stylesSource = drawStylesBlock(editableSource)

    expect(stylesSource).toContain(`['!=', 'user_visible', false]`)
    expect(editableSource).not.toContain('props.activeLayer?.visible === false ? emptyFeatureCollection()')
    expect(tabSource).not.toContain('activeLayer.value.visible === false ? emptyFeatureCollection()')
  })
})
