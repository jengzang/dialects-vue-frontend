import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const barSource = (name) => readFileSync(resolve(process.cwd(), `src/components/bar/${name}.vue`), 'utf8')

function block(source, selector, from = 0) {
  const start = source.indexOf(selector, from)
  if (start < 0) return ''
  const open = source.indexOf('{', start)
  let depth = 1
  let end = open + 1
  while (depth && end < source.length) {
    if (source[end] === '{') depth++
    if (source[end] === '}') depth--
    end++
  }
  return source.slice(open + 1, end - 1)
}

describe('bar active pill appearance', () => {
  it.each(['ExploreBar', 'CommonBar'])('%s uses the Navbar pill and transparent active surfaces', (name) => {
    const source = barSource(name)
    expect(block(source, '.tab-pill {')).toBe(block(barSource('NavBar'), '.tab-pill {'))
    const desktopActive = block(block(source, '.tab-inner {'), '&.active {')
    const mobileActive = block(block(source, '@media (max-aspect-ratio: 1/1)'), '&.active {')
    for (const active of [desktopActive, mobileActive]) {
      expect(active).toContain('background: transparent;')
      expect(active).toContain('border: 3px solid transparent;')
      expect(active).not.toContain('box-shadow:')
      expect(active).toContain('&::after')
    }
  })
})
