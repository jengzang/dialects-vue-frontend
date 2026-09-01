import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

function selectorBlock(source, selector) {
  const start = source.indexOf(selector)
  if (start === -1) return ''
  const open = source.indexOf('{', start)
  if (open === -1) return ''

  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') depth -= 1
    if (depth === 0) return source.slice(open + 1, index)
  }
  return ''
}

describe('home showcase layout', () => {
  it('keeps the showcase lazy mounted as the full-width bottom item of the hero section', () => {
    const homePage = readSource('src/main/views/HomePage.vue')
    const heroSectionStart = homePage.indexOf('<section class="hero-section">')
    const heroSectionEnd = homePage.indexOf('</section>', homePage.indexOf('<FeaturesSection'))
    const heroSection = homePage.slice(heroSectionStart, heroSectionEnd)
    const showcaseBlock = selectorBlock(homePage, '.showcase-section')

    expect(heroSection).toContain('<section class="showcase-section" ref="showcaseSectionRef">')
    expect(heroSection).toContain('<HeroShowcase v-if="showShowcase" />')
    expect(homePage).toContain('const showShowcase = ref(false)')
    expect(homePage).toContain('const showcaseSectionRef = ref(null)')
    expect(homePage).toContain('const initShowcaseLazy = () => {')
    expect(homePage).toContain('initShowcaseLazy()')
    expect(showcaseBlock).toContain('align-self: stretch;')
    expect(showcaseBlock).toContain('box-sizing: border-box;')
    expect(showcaseBlock).toContain('width: 100%;')
    expect(showcaseBlock).not.toContain('@include section-container')
    expect(showcaseBlock).not.toContain('padding:')
  })
})
