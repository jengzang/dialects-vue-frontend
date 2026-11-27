import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('query detail panel styles', () => {
  it('keeps its visual rules with the owning component', () => {
    const panel = readFileSync('src/main/components/result/PanelManager.vue', 'utf8')
    const overlays = readFileSync('src/styles/main/_overlays.scss', 'utf8')
    expect(panel).toContain(':global(.query-detail-panel)')
    expect(panel).toContain(':global(.query-detail-panel:hover)')
    expect(overlays).not.toContain('.query-detail-panel')
  })
})
