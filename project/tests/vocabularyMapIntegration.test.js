import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('vocabulary map integration', () => {
  it('uses YuBaoMap marker clicks to fetch vocabulary point details', () => {
    const yuBaoMap = readSource('src/main/components/map/YuBaoMap.vue')

    expect(yuBaoMap).toContain("const emit = defineEmits(['marker-click'])")
    expect(yuBaoMap).toContain("emit('marker-click',")
    expect(yuBaoMap).toContain('locationName: properties.locationName')
    expect(yuBaoMap).toContain('locationNames: properties.locationNames')
  })
})
