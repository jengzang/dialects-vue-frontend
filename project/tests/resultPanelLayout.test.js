import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const resultListSource = () => readFileSync(
  'src/main/components/result/ResultList.vue',
  'utf8',
)

function extractPanelStyle(source) {
  const match = source.match(/\.Panel\s*\{([\s\S]*?)\n\}/)
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
})
