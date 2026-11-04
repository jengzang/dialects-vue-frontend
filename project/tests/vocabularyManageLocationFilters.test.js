import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('vocabulary manage location filters', () => {
  it('allows edit users to search locations and restricts username search to manage users', () => {
    const managePage = readSource('src/main/views/explore/word/vocabulary/VocabularyManagePage.vue')
    const locationsSection = readSource('src/main/views/explore/word/vocabulary/ManageLocationsSection.vue')

    expect(managePage).toContain(':manage-permission-level="effectiveVocabularyMe?.permission_level"')
    expect(locationsSection).toContain('managePermissionLevel: { type: String, default: null }')
    expect(locationsSection).toContain("const canShowLocationFilters = computed(() => ['manage', 'edit'].includes(props.managePermissionLevel))")
    expect(locationsSection).toContain('v-if="canShowLocationFilters"')
    expect(locationsSection).toContain('v-if="canSearchUsername"')
    expect(locationsSection).toContain("const canSearchUsername = computed(() => props.managePermissionLevel === 'manage')")
  })
})
