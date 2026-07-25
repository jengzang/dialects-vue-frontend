import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('UniversalTable API adapter wiring', () => {
  it('keeps normal SQL APIs as the default adapter while routing calls through tableApi', () => {
    const source = readSource('src/main/components/TableAndTree/UniversalTable.vue')

    expect(source).toContain("apiAdapter: { type: String, default: 'normal' }")
    expect(source).toContain('const tableApiAdapters = {')
    expect(source).toContain('normal: {')
    expect(source).toContain('query: sqlQuery')
    expect(source).toContain('distinct: distinctQuery')
    expect(source).toContain('mutateSingle: mutateSingleRow')
    expect(source).toContain('const tableApi = computed(() => tableApiAdapters[props.apiAdapter] || tableApiAdapters.normal)')

    expect(source).toContain('await tableApi.value.query(payload)')
    expect(source).toContain('await tableApi.value.distinct(payload)')
    expect(source).toContain('await tableApi.value.batchMutate(payload)')
    expect(source).toContain('await tableApi.value.mutateSingle(payload)')
    expect(source).toContain('await tableApi.value.batchReplacePreview(payload)')
    expect(source).toContain('await tableApi.value.batchReplaceExecute(payload)')
  })
})
