import { createApp, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { showError } from '@/utils/ui/message.js'
import AudioInputPanel from '@/main/components/praat/AudioInputPanel.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
vi.mock('@/utils/ui/message.js', () => ({ showError: vi.fn() }))
vi.mock('@/components/common/InlineIcon.vue', () => ({ default: { render: () => null } }))

let app
let host

afterEach(() => {
  app?.unmount()
  host?.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('Praat browser recording errors', () => {
  it.each(['NotAllowedError', 'NotFoundError', 'NotReadableError'])(
    'preserves the browser microphone hint for %s', async (name) => {
      const getUserMedia = vi.fn().mockRejectedValue(new DOMException('Microphone unavailable', name))
      vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
      vi.spyOn(console, 'error').mockImplementation(() => {})
      host = document.createElement('div')
      document.body.appendChild(host)
      app = createApp(AudioInputPanel)
      app.mount(host)

      host.querySelector('.record-button').click()

      await vi.waitFor(() => {
        expect(showError).toHaveBeenCalledWith('praat.audioInput.errors.microphoneAccessDenied')
      })
      await nextTick()
      expect(getUserMedia).toHaveBeenCalledWith({ audio: true })
      expect(host.querySelector('.record-button').disabled).toBe(false)
    },
  )
})

describe('Praat browser file selection', () => {
  it('opens the file input only once per upload-area click', async () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(AudioInputPanel)
    app.mount(host)
    const input = host.querySelector('input[type="file"]')
    let clicks = 0
    input.addEventListener('click', (event) => {
      clicks++
      // Bound the regression so an asynchronous click loop cannot hang the test runner.
      if (clicks >= 3) event.stopPropagation()
    })

    host.querySelector('.upload-area').click()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(clicks).toBe(1)
  })
})
