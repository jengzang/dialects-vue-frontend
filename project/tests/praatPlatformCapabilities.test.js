import { describe, expect, it } from 'vitest'

import {
  getPraatPlatformCapabilities,
  getPraatInputAccept,
  isPraatFileAcceptedOnPlatform,
  PLATFORM_FEATURE_MATRIX,
} from '../src/platform/index.js'

describe('Praat platform capabilities', () => {
  it('keeps Web Praat on the backend API with the existing input formats', () => {
    expect(getPraatPlatformCapabilities('web')).toMatchObject({
      target: 'web',
      preferredEngine: 'remote-api',
      fallbackEngine: null,
      acceptsAllBackendFormats: true,
      inputFormats: ['wav', 'mp3', 'm4a', 'webm', 'ogg', 'flac', 'aac'],
    })
    expect(getPraatInputAccept('web')).toBe('.wav,.mp3,.m4a,.webm,.ogg,.flac,.aac,audio/*')
  })

  it.each(['ios', 'android'])('uses local Python and WAV-only input on %s', (target) => {
    expect(getPraatPlatformCapabilities(target)).toMatchObject({
      target,
      preferredEngine: 'local-python',
      fallbackEngine: 'remote-api',
      acceptsAllBackendFormats: false,
      inputFormats: ['wav'],
      temporaryAudioPolicy: {
        originalInput: 'delete-after-analysis',
        normalizedAudio: 'delete-after-analysis',
        resultJson: 'retain',
        runMetadata: 'retain',
      },
    })
    expect(getPraatInputAccept(target)).toBe('.wav,audio/wav,audio/x-wav')
  })

  it('validates selected file names against target-specific Praat input formats', () => {
    expect(isPraatFileAcceptedOnPlatform({ name: 'sample.wav', type: 'audio/wav' }, 'ios')).toBe(true)
    expect(isPraatFileAcceptedOnPlatform({ name: 'sample.m4a', type: 'audio/mp4' }, 'ios')).toBe(false)
    expect(isPraatFileAcceptedOnPlatform({ name: 'sample.flac', type: 'audio/flac' }, 'android')).toBe(false)
    expect(isPraatFileAcceptedOnPlatform({ name: 'sample.flac', type: 'audio/flac' }, 'web')).toBe(true)
  })

  it('preserves Web MIME-only acceptance for supported audio files without recognized extensions', () => {
    expect(isPraatFileAcceptedOnPlatform({ name: 'recording', type: 'audio/mpeg' }, 'web')).toBe(true)
    expect(isPraatFileAcceptedOnPlatform({ name: 'recording', type: 'audio/x-m4a' }, 'web')).toBe(true)
    expect(isPraatFileAcceptedOnPlatform({ name: 'recording', type: 'audio/x-aac' }, 'web')).toBe(true)
  })

  it('advertises native local Python analysis in the acceptance matrix', () => {
    expect(PLATFORM_FEATURE_MATRIX.praatTools.capabilities).toMatchObject({
      web: { preferredEngine: 'remote-api' },
      ios: { preferredEngine: 'local-python', inputFormats: ['wav'] },
      android: { preferredEngine: 'local-python', inputFormats: ['wav'] },
    })

    expect(PLATFORM_FEATURE_MATRIX.praatTools.acceptance.ios).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'praat.ios.local-python-analysis', driver: 'python-parselmouth' }),
    ]))
    expect(PLATFORM_FEATURE_MATRIX.praatTools.acceptance.android).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'praat.android.local-python-analysis', driver: 'python-parselmouth' }),
    ]))
  })
})
