import { describe, expect, it, vi } from 'vitest'
import { createNativeAudioIntake } from '../src/platform/audioIntake.js'

describe('shared audio intake', () => {
  it('queues cold-start audio, opens Praat and consumes only after reading it', async () => {
    const plugin = {
      getPendingAudio: vi.fn().mockResolvedValue({ id: '1', name: '手機.m4a', mime: 'audio/mp4', base64: 'YWJj' }),
      consumeAudio: vi.fn(),
      addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    }
    const router = { isReady: vi.fn(), push: vi.fn() }
    const intake = createNativeAudioIntake({ plugin, router, route: () => '/zh-CN/explore/tools/praat' })
    await intake.start()
    expect(router.push).toHaveBeenCalledWith('/zh-CN/explore/tools/praat')
    const file = intake.take()
    expect(file.name).toBe('手機.m4a')
    expect(file.type).toBe('audio/mp4')
    expect(file.size).toBe(3)
    expect(plugin.consumeAudio).toHaveBeenCalledWith({ id: '1' })
    expect(intake.take()).toBeNull()
  })
  it('does not consume malformed data or navigate', async () => {
    const plugin = {
      getPendingAudio: vi.fn().mockResolvedValue({ id: '1', base64: 'bad!' }),
      consumeAudio: vi.fn(),
      addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    }
    const router = { isReady: vi.fn(), push: vi.fn() }
    const intake = createNativeAudioIntake({ plugin, router, route: () => '/praat', onError: vi.fn() })
    await intake.start()
    expect(plugin.consumeAudio).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })
})

it('retains native audio if navigation is rejected', async () => {
  const plugin = {
    getPendingAudio: vi.fn().mockResolvedValue({ id: '2', name: 'a.wav', base64: 'YWJj' }),
    consumeAudio: vi.fn(),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  }
  const intake = createNativeAudioIntake({
    plugin, router: { isReady: vi.fn(), push: vi.fn().mockResolvedValue({ type: 4 }) },
    route: () => '/praat', onError: vi.fn(),
  })
  await intake.start()
  expect(intake.take()).toBeNull()
  expect(plugin.consumeAudio).not.toHaveBeenCalled()
})
