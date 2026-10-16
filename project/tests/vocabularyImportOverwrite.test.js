import { createApp, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getVocabularyCounts: vi.fn(),
  getVocabularyLocations: vi.fn(),
  previewVocabularyImport: vi.fn(),
  uploadVocabulary: vi.fn(),
  showWarning: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
}))
vi.mock('@/api', () => mocks)
vi.mock('@/utils/ui/message.js', () => mocks)
vi.mock('vue-i18n', () => ({ useI18n: () => ({
  t: (key, params) => `${key}${params ? JSON.stringify(params) : ''}`,
}) }))
vi.mock('vue-router', () => ({ useRoute: () => ({}), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/main/components/map/MiniMapSelector.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/import/TabularImportPreview.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/ToastAndHelp/HelpIcon.vue', () => ({ default: { template: '<span />' } }))
vi.mock('@/components/common/AppModal.vue', () => ({ default: { template: '<div><slot /><slot name="footer" /></div>' } }))
vi.mock('@/main/views/explore/word/vocabulary/YindianLocationMatch.vue', () => ({ default: { template: '<div />' } }))

const { default: ImportPage } = await import('../src/main/views/explore/word/vocabulary/VocabularyImportPage.vue')
let wrapper

function mountPage(me = { user_id: 7, permission_level: 'edit', can_upload: true }) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(ImportPage, { vocabularyMe: me, isAuthenticated: true, isAuthReady: true })
  app.mount(host)
  wrapper = { app, host, state: app._instance.setupState }
  return wrapper
}

async function flush() {
  for (let i = 0; i < 8; i++) { await Promise.resolve(); await nextTick() }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getVocabularyCounts.mockResolvedValue({ total: 0, locations: 0 })
  mocks.getVocabularyLocations.mockResolvedValue({ locations: [], total: 0, page: 1, page_size: 200 })
})
afterEach(() => { wrapper?.app.unmount(); wrapper?.host.remove() })

describe('vocabulary import feedback', () => {
  it('counts both blank and malformed rows in the preview while allowing partial overwrite', async () => {
    const { state, host } = mountPage()
    state.uploadFile = new File(['content'], 'words.docx')
    await flush()
    state.backendPreview = { parsed_count: 1, skipped_count: 2, errors: ['第 3 行缺少字段'], would_delete_existing_count: 3 }
    state.isOverwriteConfirmed = true
    await flush()
    const stats = host.querySelectorAll('.backend-preview-stat-value')
    expect(stats[1].textContent).toBe('3')
    expect(state.canImportAfterPreview).toBe(true)
  })

  it('shows a partial-import warning when errors exist even if the server blank count is zero', async () => {
    const { state, host } = mountPage()
    state.uploadFile = new File(['content'], 'words.docx')
    state.uploadLocation = { location_name: '甲村', coordinates: '113,23' }
    await flush()
    state.backendPreview = { parsed_count: 1, skipped_count: 0, errors: ['第 3 行缺少字段'], would_delete_existing_count: 3 }
    state.isOverwriteConfirmed = true
    mocks.uploadVocabulary.mockResolvedValue({ imported_count: 1, skipped_count: 0, errors: ['第 3 行缺少字段'] })
    await state.handleImportAfterPreview()
    await flush()
    expect(state.importResult.skippedCount).toBe(1)
    expect(mocks.showWarning).toHaveBeenCalled()
    expect(mocks.showSuccess).not.toHaveBeenCalled()
    expect(host.querySelector('.backend-preview-icon').textContent).toBe('!')
    expect(mocks.uploadVocabulary.mock.calls[0][0].overwrite).toBe(true)
  })

  it.each([0, 2])('reports imports with %i blank rows and no format errors accurately', async (blankCount) => {
    const { state } = mountPage()
    state.uploadFile = new File(['content'], 'words.docx')
    state.uploadLocation = { location_name: '甲村', coordinates: '113,23' }
    await flush()
    state.backendPreview = { parsed_count: 1, skipped_count: 0, errors: [] }
    mocks.uploadVocabulary.mockResolvedValue({ imported_count: 1, skipped_count: blankCount, errors: [] })
    await state.handleImportAfterPreview()
    expect(state.importResult.skippedCount).toBe(blankCount)
    expect(blankCount ? mocks.showWarning : mocks.showSuccess).toHaveBeenCalled()
  })
})
