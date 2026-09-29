import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const testsDir = dirname(fileURLToPath(import.meta.url))
const componentPath = resolve(
  testsDir,
  '../src/main/components/geo/LocationAndRegionInput.vue'
)

function readComponentSource() {
  return readFileSync(componentPath, 'utf8')
}

describe('LocationAndRegionInput notes scope extension', () => {
  it('keeps empty scope and unlimited location support opt-in', () => {
    const source = readComponentSource()

    expect(source).toContain('allowEmptyScope:')
    expect(source).toMatch(/allowEmptyScope:\s*\{\s*type:\s*Boolean,\s*default:\s*false\s*\}/)
    expect(source).toContain('disableLocationLimit:')
    expect(source).toMatch(/disableLocationLimit:\s*\{\s*type:\s*Boolean,\s*default:\s*false\s*\}/)
    expect(source).toContain("'locationsResolved'")
  })

  it('emits an empty successful resolution without calling getLocations', () => {
    const source = readComponentSource()
    const fetchLocationsResult = source.indexOf('async function fetchLocationsResult()')
    const fetchLocationsSource = source.slice(fetchLocationsResult)
    const emptyScopeBranch = fetchLocationsSource.indexOf('if (props.allowEmptyScope)')
    const getLocationsCall = fetchLocationsSource.indexOf('const data = await getLocations')

    expect(fetchLocationsResult).toBeGreaterThan(-1)
    expect(emptyScopeBranch).toBeGreaterThan(-1)
    expect(getLocationsCall).toBeGreaterThan(emptyScopeBranch)
    expect(fetchLocationsSource.slice(emptyScopeBranch, getLocationsCall)).toContain('hasScope: false')
    expect(fetchLocationsSource.slice(emptyScopeBranch, getLocationsCall)).toContain("emit('locationsResolved'")
  })

  it('protects preview state from stale location resolutions', () => {
    const source = readComponentSource()

    expect(source).toContain('let locationResolutionToken = 0')
    expect(source).toContain('const resolutionToken = ++locationResolutionToken')
    expect(source).toContain('if (resolutionToken !== locationResolutionToken)')
  })

  it('bypasses every existing location cap only when explicitly enabled', () => {
    const source = readComponentSource()

    expect(source).toContain('!props.disableLocationLimit && isExplicitLocationsLimitExceeded')
    expect(source).toContain('if (props.disableLocationLimit) {')
    expect(source).toContain('if (props.disableLocationLimit) {\n    return null')
  })
})
