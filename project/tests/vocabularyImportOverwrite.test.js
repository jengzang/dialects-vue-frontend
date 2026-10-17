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
  app.config.globalProperties.$t = (key) => key
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
  it.each([false, true])('resets the form only after a successful upload (%s)', async (fails) => {
    const { state } = mountPage()
    const file = new File(['content'], 'words.docx')
    state.uploadFile = file
    state.uploadLocation = { location_name: '甲村', coordinates: '113,23', t1: '55' }
    state.uploadTargetLocation = { user_id: 7, location_name: '甲村' }
    state.existingLocationKey = '7:甲村'
    state.uploadParserMode = 'table'
    state.fillStandardFromLocal = true
    await flush()
    state.backendPreview = { parsed_count: 1, skipped_count: 0, errors: [], would_delete_existing_count: 3 }
    state.isOverwriteConfirmed = true
    if (fails) mocks.uploadVocabulary.mockRejectedValue(new Error('上传失败'))
    else mocks.uploadVocabulary.mockResolvedValue({ imported_count: 1, skipped_count: 0, errors: ['第 3 行缺少字段'] })

    await state.handleImportAfterPreview()
    await flush()

    if (fails) {
      expect(state.uploadFile).toBe(file)
      expect(state.uploadLocation.location_name).toBe('甲村')
      expect(state.uploadTargetLocation).toEqual({ user_id: 7, location_name: '甲村' })
      expect(state.uploadParserMode).toBe('table')
      expect(state.fillStandardFromLocal).toBe(true)
      expect(state.backendPreview).not.toBeNull()
      expect(state.isOverwriteConfirmed).toBe(true)
    } else {
      expect(state.uploadFile).toBeNull()
      expect(Object.values(state.uploadLocation).every((value) => value === '')).toBe(true)
      expect(state.uploadTargetLocation).toBeNull()
      expect(state.existingLocationKey).toBe('')
      expect(state.uploadParserMode).toBe('auto')
      expect(state.fillStandardFromLocal).toBe(false)
      expect(state.backendPreview).toBeNull()
      expect(state.isOverwriteConfirmed).toBe(false)
      expect(state.importResult).toEqual({ importedCount: 1, skippedCount: 1, errors: ['第 3 行缺少字段'], locationName: '甲村' })
      expect(mocks.showWarning).toHaveBeenCalledWith(expect.stringContaining('successWithSkipped'))
    }
  })

  it.each([false, true])('can upload again with the location entered after the file: %s', async (fileFirst) => {
    const { state, host } = mountPage()
    state.uploadFile = new File(['first'], 'first.docx')
    state.uploadLocation = { location_name: '甲村', coordinates: '113,23' }
    await flush()
    state.backendPreview = { parsed_count: 1, errors: [] }
    mocks.uploadVocabulary.mockResolvedValue({ imported_count: 1, errors: [] })
    await state.handleImportAfterPreview()
    await flush()

    const reselect = [...host.querySelectorAll('button')].find((button) => button.textContent.includes('common.importPreview.actions.reselect'))
    expect(reselect).toBeTruthy()
    const input = host.querySelector('input[type="file"]')
    const openPicker = vi.spyOn(input, 'click').mockImplementation(() => {})
    reselect.click()
    expect(openPicker).toHaveBeenCalledOnce()
    expect(host.querySelectorAll('.backend-preview')).toHaveLength(1)
    expect(host.textContent).not.toContain('words.wordList.upload.success')

    async function enterNextLocation() {
      state.openUploadLocationEditor()
      await flush()
      state.uploadLocationDraft = { location_name: '乙村', coordinates: '114,24' }
      state.confirmUploadLocationEditor()
      await flush()
    }
    if (!fileFirst) await enterNextLocation()
    const nextFile = new File(['second'], 'second.docx')
    Object.defineProperty(input, 'files', { value: [nextFile], configurable: true })
    mocks.previewVocabularyImport.mockResolvedValue({ parsed_count: 1, errors: [] })
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await flush()
    expect(state.importResult).toBeNull()
    if (fileFirst) {
      await enterNextLocation()
      const preview = [...host.querySelectorAll('button')].find((button) => button.textContent.includes('words.wordList.upload.previewAction'))
      expect(preview).toBeTruthy()
      preview.click()
      await flush()
    }
    expect(state.canImportAfterPreview).toBe(true)
    await state.handleImportAfterPreview()
    await flush()
    expect(mocks.uploadVocabulary).toHaveBeenCalledTimes(2)
    expect(mocks.uploadVocabulary.mock.calls[1][0]).toMatchObject({ file: nextFile, location: { location_name: '乙村' } })
    expect(state.importResult.locationName).toBe('乙村')
  })

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

describe('existing upload location selection', () => {
  const first = { user_id: 7, username: 'alice', location_name: '甲村', coordinates: '113,23', province: '广东', vocabulary_source: '调查手稿', t1: '55' }
  const second = { user_id: 8, username: 'bob', location_name: '甲村', coordinates: '114,24', province: '广西', t1: '33' }

  it('fills the draft through the real SimpleSelectDropdown click event', async () => {
    mocks.getVocabularyLocations.mockResolvedValue({ locations: [second], total: 1 })
    const { state, host } = mountPage({ user_id: 1, permission_level: 'manage', can_upload: true })
    state.openUploadLocationEditor()
    await flush()
    host.querySelector('.upload-existing-location .select-trigger').click()
    await flush()
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    const option = [...document.body.querySelectorAll('.dropdown-item')].find((item) => item.textContent.includes('bob'))
    expect(option).toBeTruthy()
    option.click()
    await flush()
    expect(state.uploadLocationDraft).toMatchObject({ location_name: '甲村', province: '广西', t1: '33' })
  })

  it('loads every management location page and distinguishes same-name owners', async () => {
    mocks.getVocabularyLocations.mockResolvedValueOnce({ locations: [first], total: 2, page: 1, page_size: 1 })
      .mockResolvedValueOnce({ locations: [second], total: 2, page: 2, page_size: 1 })
    const { state, host } = mountPage({ user_id: 1, permission_level: 'manage', can_upload: true })
    state.openUploadLocationEditor()
    await flush()
    expect(mocks.getVocabularyLocations).toHaveBeenNthCalledWith(1, { page: 1, page_size: 200 })
    expect(mocks.getVocabularyLocations).toHaveBeenNthCalledWith(2, { page: 2, page_size: 200 })
    const locations = state.existingLocationOptions.filter((option) => option.value)
    expect(locations).toHaveLength(2)
    expect(locations[0].value).not.toBe(locations[1].value)
    expect(locations.map((option) => option.label).join(' ')).toMatch(/alice.*bob/)
    expect(host.textContent).toContain('words.wordList.upload.overwriteExistingLocation')
  })

  it('prefills metadata and uses the confirmed owner for preview and import', async () => {
    mocks.getVocabularyLocations.mockResolvedValue({ locations: [second], total: 1 })
    const { state } = mountPage({ user_id: 1, permission_level: 'manage', can_upload: true })
    state.openUploadLocationEditor()
    await flush()
    state.selectExistingLocation(state.existingLocationOptions.find((option) => option.value).value)
    expect(state.uploadLocationDraft).toMatchObject({ location_name: '甲村', province: '广西', t1: '33' })
    state.confirmUploadLocationEditor()
    state.uploadFile = new File(['content'], 'words.docx')
    await flush()
    mocks.previewVocabularyImport.mockResolvedValue({ parsed_count: 1, would_delete_existing_count: 3 })
    await state.handlePreviewImport()
    expect(mocks.previewVocabularyImport.mock.calls[0][0].target_user_id).toBe(8)
    state.isOverwriteConfirmed = true
    mocks.uploadVocabulary.mockResolvedValue({ imported_count: 1, skipped_count: 0, errors: [] })
    await state.handleImportAfterPreview()
    expect(mocks.uploadVocabulary.mock.calls[0][0].target_user_id).toBe(8)
  })

  it('does not change the confirmed upload when the location modal is cancelled', async () => {
    mocks.getVocabularyLocations.mockResolvedValue({ locations: [first, second], total: 2 })
    const { state } = mountPage({ user_id: 1, permission_level: 'manage', can_upload: true })
    state.openUploadLocationEditor()
    await flush()
    state.selectExistingLocation(state.existingLocationOptions[1].value)
    state.confirmUploadLocationEditor()
    state.openUploadLocationEditor()
    await flush()
    state.selectExistingLocation(state.existingLocationOptions[2].value)
    state.closeUploadLocationEditor()
    expect(state.uploadLocation.province).toBe('广东')
    expect(state.uploadTargetLocation.user_id).toBe(7)
  })

  it('clears an existing target when choosing to enter a new location', async () => {
    mocks.getVocabularyLocations.mockResolvedValue({ locations: [first], total: 1 })
    const { state } = mountPage()
    state.openUploadLocationEditor()
    await flush()
    state.selectExistingLocation(state.existingLocationOptions[1].value)
    state.selectExistingLocation('')
    expect(state.uploadLocationDraft.location_name).toBe('')
    state.uploadLocationDraft = { location_name: '乙村', coordinates: '115,25' }
    state.confirmUploadLocationEditor()
    expect(state.uploadTargetLocation).toBeNull()
  })

  it('does not offer a partial list when a later management page fails', async () => {
    mocks.getVocabularyLocations.mockResolvedValueOnce({ locations: [first], total: 2 })
      .mockRejectedValueOnce(new Error('network error'))
    const { state } = mountPage()
    state.openUploadLocationEditor()
    await flush()
    expect(state.existingLocationOptions.filter((option) => option.value)).toHaveLength(0)
    expect(mocks.showError).toHaveBeenCalled()
  })

  it('invalidates preview when selecting a different owner with identical location metadata', async () => {
    mocks.getVocabularyLocations.mockResolvedValue({ locations: [first, { ...first, user_id: 8, username: 'bob' }], total: 2 })
    const { state } = mountPage({ user_id: 1, permission_level: 'manage', can_upload: true })
    state.openUploadLocationEditor()
    await flush()
    state.selectExistingLocation(state.existingLocationOptions[1].value)
    state.confirmUploadLocationEditor()
    await flush()
    state.backendPreview = { parsed_count: 1, would_delete_existing_count: 2 }
    state.isOverwriteConfirmed = true
    state.openUploadLocationEditor()
    await flush()
    state.selectExistingLocation(state.existingLocationOptions[2].value)
    state.confirmUploadLocationEditor()
    await flush()
    expect(state.backendPreview).toBeNull()
    expect(state.isOverwriteConfirmed).toBe(false)
  })

  it('discards location results and the selected target after permission changes', async () => {
    let resolve
    const request = new Promise((done) => { resolve = done })
    mocks.getVocabularyLocations.mockReturnValueOnce(request)
    const { state, app } = mountPage({ user_id: 1, permission_level: 'manage', can_upload: true })
    state.openUploadLocationEditor()
    app._instance.props.vocabularyMe = { user_id: 1, permission_level: null, can_upload: false }
    await flush()
    resolve({ locations: [second], total: 1 })
    await flush()
    expect(state.isUploadLocationEditorOpen).toBe(false)
    expect(state.existingLocationOptions.filter((option) => option.value)).toHaveLength(0)
    expect(state.uploadTargetLocation).toBeNull()
  })

  it('does not confirm a previously selected target when reloading the list fails', async () => {
    mocks.getVocabularyLocations.mockResolvedValueOnce({ locations: [first], total: 1 })
      .mockRejectedValueOnce(new Error('network error'))
    const { state } = mountPage()
    state.openUploadLocationEditor()
    await flush()
    state.selectExistingLocation(state.existingLocationOptions[1].value)
    state.confirmUploadLocationEditor()
    state.openUploadLocationEditor()
    await flush()
    state.confirmUploadLocationEditor()
    expect(state.isUploadLocationEditorOpen).toBe(true)
    expect(state.uploadTargetLocation.user_id).toBe(7)
    expect(mocks.showWarning).toHaveBeenCalled()
  })

  it('returns to new-location mode when the selected location name is changed', async () => {
    mocks.getVocabularyLocations.mockResolvedValue({ locations: [first], total: 1 })
    const { state } = mountPage()
    state.openUploadLocationEditor()
    await flush()
    state.selectExistingLocation(state.existingLocationOptions[1].value)
    state.uploadLocationDraft.location_name = '乙村'
    await flush()
    state.confirmUploadLocationEditor()
    expect(state.uploadTargetLocation).toBeNull()
    expect(state.uploadLocation.location_name).toBe('乙村')
  })

  it('does not combine an old owner with a name edited while the list reloads', async () => {
    let resolve
    const request = new Promise((done) => { resolve = done })
    mocks.getVocabularyLocations.mockResolvedValueOnce({ locations: [second], total: 1 })
      .mockReturnValueOnce(request)
    const { state } = mountPage({ user_id: 1, permission_level: 'manage', can_upload: true })
    state.openUploadLocationEditor()
    await flush()
    state.selectExistingLocation(state.existingLocationOptions[1].value)
    state.confirmUploadLocationEditor()
    state.openUploadLocationEditor()
    state.uploadLocationDraft.location_name = '乙村'
    await flush()
    resolve({ locations: [second], total: 1 })
    await flush()
    state.confirmUploadLocationEditor()
    expect(state.uploadTargetLocation).toBeNull()
    expect(state.uploadLocation.location_name).toBe('乙村')
  })
})
