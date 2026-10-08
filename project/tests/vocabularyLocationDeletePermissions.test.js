import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('vocabulary location deletion permissions', () => {
  it('keeps deletion, transfer, and selected-owner forwarding as separate contracts', () => {
    const managePage = readSource('src/main/views/explore/word/vocabulary/VocabularyManagePage.vue')
    const locationsSection = readSource('src/main/views/explore/word/vocabulary/ManageLocationsSection.vue')
    const itemHeadStart = locationsSection.indexOf('class="location-item-head"')
    const itemHeadEnd = locationsSection.indexOf('</article>', itemHeadStart)
    const itemHead = locationsSection.slice(itemHeadStart, itemHeadEnd)
    const deleteHandlerStart = locationsSection.indexOf('async function handleDeleteLocation')
    const deleteHandlerEnd = locationsSection.indexOf('\n}\n\nwatch', deleteHandlerStart)
    const deleteHandler = locationsSection.slice(deleteHandlerStart, deleteHandlerEnd)

    expect(managePage).toContain(':can-delete-location="canDeleteVocabularyLocations"')
    expect(managePage).toContain(':can-transfer-location="canManageVocabularyEntries"')
    expect(locationsSection).toContain('canDeleteLocation: { type: Boolean, default: false }')
    expect(locationsSection).toContain('canTransferLocation: { type: Boolean, default: false }')
    expect(itemHead).toContain('v-if="canDeleteLocation"')
    expect(itemHead).toContain('v-if="canTransferLocation"')
    expect(deleteHandler).toContain('if (!location?.location_name || location.user_id === null || location.user_id === undefined) return')
    expect(deleteHandler).toContain('const params = { user_id: location.user_id }')
  })
})
