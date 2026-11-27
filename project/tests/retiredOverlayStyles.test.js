import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(`src/styles/main/${path}`, 'utf8')

describe('retired overlay styles', () => {
  it('does not ship unused modal, sidebar, or popup selectors', () => {
    const overlays = read('_overlays.scss')
    for (const selector of ['.modal-header-base', '.modal-title-base', '.modal-body-base', '.modal-frame', '.main-glass-modal', '.main-query-modal', '.main-crud-modal', '.main-cell-detail-modal', '.main-tool-modal', '.tool-modal-shell', '.modal-container']) {
      expect(overlays).not.toContain(selector)
    }
    expect(readFileSync('src/components/bar/SimpleSidebar.vue', 'utf8')).not.toContain('.main-sidebar-icp')
    expect(read('_popups.scss')).not.toContain('.mini-button-delete')
  })
})
