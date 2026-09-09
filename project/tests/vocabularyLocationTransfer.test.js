import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.fn()
const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

vi.mock('../src/api/auth/httpClient.js', () => ({
  api: apiMock,
}))

vi.mock('../src/utils/ui/message.js', () => ({
  showError: vi.fn(),
}))

const { transferVocabularyLocation } = await import('../src/api/main/vocabulary.js')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

beforeEach(() => {
  apiMock.mockClear()
})

describe('vocabulary location transfer', () => {
  it('posts source location and numeric target user id to the backend transfer endpoint', async () => {
    apiMock.mockResolvedValueOnce({ success: true, transferred_entries_count: 2 })

    await transferVocabularyLocation(
      { location_name: '息烽', user_id: 7, username: 'alice' },
      '8',
    )

    expect(apiMock).toHaveBeenCalledWith('/api/vocabulary/locations/transfer', {
      method: 'POST',
      body: {
        location_name: '息烽',
        user_id: 7,
        target_user_id: 8,
      },
    })
  })

  it('posts source username and target username when the target is not numeric', async () => {
    apiMock.mockResolvedValueOnce({ success: true, transferred_entries_count: 1 })

    await transferVocabularyLocation(
      { location_name: '息烽', username: 'alice' },
      'bob',
    )

    expect(apiMock).toHaveBeenCalledWith('/api/vocabulary/locations/transfer', {
      method: 'POST',
      body: {
        location_name: '息烽',
        username: 'alice',
        target_username: 'bob',
      },
    })
  })

  it('wires a transfer button and AppModal into the location item head', () => {
    const source = readSource('src/main/views/explore/word/vocabulary/ManageLocationsSection.vue')
    const itemHeadStart = source.indexOf('class="location-item-head"')
    const itemHeadEnd = source.indexOf('</article>', itemHeadStart)
    const itemHead = source.slice(itemHeadStart, itemHeadEnd)

    expect(itemHead).toContain("t('words.wordList.locations.transfer.action')")
    expect(itemHead.indexOf("t('common.button.delete')")).toBeLessThan(
      itemHead.indexOf("t('words.wordList.locations.transfer.action')")
    )
    expect(source).toContain('v-model="isTransferModalOpen"')
    expect(source).toContain('transferTargetInput')
    expect(source).toContain('handleConfirmTransferLocation')
  })
})
