import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('native export coverage', () => {
  it.each([
    'main/utils/export/resultExport.js',
    'main/utils/drawMap/export.js',
    'main/components/praat/PitchTonePanel.vue',
    'main/components/TableAndTree/UniversalTable.vue',
    'main/views/explore/word/vocabulary/ManageLocationsSection.vue',
    'VillagesML/workspace/modules/ml/FeatureExtraction.vue',
  ])('routes %s through the native file service', (file) => {
    const source = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8')
    expect(source).toContain('getPlatformFileService')
    expect(source).toContain('.saveBlob(')
    expect(source).toContain("container === 'native-webview'")
  })
})
