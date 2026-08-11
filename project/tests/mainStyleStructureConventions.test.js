import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('main style structure conventions', () => {
  it('keeps layout helpers out of surface primitives', () => {
    const surfaces = readSource('src/styles/main/_surfaces.scss')
    const layout = readSource('src/styles/main/_layout.scss')
    const entry = readSource('src/styles/main-entry.scss')

    expect(surfaces).not.toContain('.main-card-grid')
    expect(layout).toContain('.main-card-grid')
    expect(entry).toContain("@use './main/layout' as main-layout;")
  })

  it('keeps panel title text rules in info utilities', () => {
    const surfaces = readSource('src/styles/main/_surfaces.scss')
    const info = readSource('src/styles/main/_info.scss')

    expect(surfaces).not.toContain('.panel-title')
    expect(info).toContain('.panel-title')
  })
})
