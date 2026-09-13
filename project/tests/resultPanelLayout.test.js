import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const resultListSource = () => readFileSync(
  'src/main/components/result/ResultList.vue',
  'utf8',
)

const charsAndTonesSource = () => readFileSync(
  'src/main/components/result/CharsAndTones.vue',
  'utf8',
)

function extractPanelStyle(source) {
  const match = source.match(/\.Panel\s*\{([\s\S]*?)\n\}/)
  return match?.[1] ?? ''
}

function extractStyleBlock(source, selector) {
  const match = source.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`))
  return match?.[1] ?? ''
}

describe('result panel layout', () => {
  it('keeps the result panel in page flow so the layout footer remains reachable', () => {
    const panelStyle = extractPanelStyle(resultListSource())

    expect(panelStyle).toContain('height: 85dvh')
    expect(panelStyle).toContain('border: 1px solid var(--border-light-gray)')
    expect(panelStyle).not.toContain('position: fixed')
    expect(panelStyle).not.toContain('bottom: 1dvh')
  })

  it('lets character and tone results grow in page flow instead of clipping to the viewport', () => {
    const source = charsAndTonesSource()
    const pageStyle = extractStyleBlock(source, '\\.chartonepage')
    const contentStyle = extractStyleBlock(source, '\\.content-search')

    expect(pageStyle).not.toContain('height: 66dvh')
    expect(pageStyle).not.toContain('height: 60dvh')
    expect(pageStyle).not.toContain('overflow-y: auto')
    expect(contentStyle).not.toContain('max-height: calc(100% - 70px)')
    expect(contentStyle).not.toContain('overflow-y: auto')
  })
})
