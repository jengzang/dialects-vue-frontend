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

  it.each(['ios', 'android'])('uses the remote API by default with Web input formats on %s', (target) => {
    expect(getPraatPlatformCapabilities(target)).toMatchObject({
      target,
      preferredEngine: 'remote-api',
      fallbackEngine: 'local-python',
      acceptsAllBackendFormats: true,
      inputFormats: ['wav', 'mp3', 'm4a', 'webm', 'ogg', 'flac', 'aac'],
      temporaryAudioPolicy: {
        originalInput: 'delete-after-analysis',
        normalizedAudio: 'delete-after-analysis',
        resultJson: 'retain',
        runMetadata: 'retain',
      },
    })
    expect(getPraatInputAccept(target)).toBe(getPraatInputAccept('web'))
  })

  it('validates selected file names against target-specific Praat input formats', () => {
    expect(isPraatFileAcceptedOnPlatform({ name: 'sample.wav', type: 'audio/wav' }, 'ios')).toBe(true)
    expect(isPraatFileAcceptedOnPlatform({ name: 'sample.m4a', type: 'audio/mp4' }, 'ios')).toBe(true)
    expect(isPraatFileAcceptedOnPlatform({ name: 'sample.flac', type: 'audio/flac' }, 'android')).toBe(true)
    expect(isPraatFileAcceptedOnPlatform({ name: 'sample.flac', type: 'audio/flac' }, 'web')).toBe(true)
  })

  it('preserves Web MIME-only acceptance for supported audio files without recognized extensions', () => {
    expect(isPraatFileAcceptedOnPlatform({ name: 'recording', type: 'audio/mpeg' }, 'web')).toBe(true)
    expect(isPraatFileAcceptedOnPlatform({ name: 'recording', type: 'audio/x-m4a' }, 'web')).toBe(true)
    expect(isPraatFileAcceptedOnPlatform({ name: 'recording', type: 'audio/x-aac' }, 'web')).toBe(true)
  })

  it.each([
    { name: 'recording', type: 'audio/x-flac' },
    { name: 'recording', type: 'audio/webm;codecs=opus' },
    { name: 'recording', type: 'audio/ogg;codecs=opus' },
    { name: 'recording', type: 'audio/x-pn-wav' },
    { name: 'flac', type: '' },
  ])('preserves legacy Web acceptance for $name ($type)', (file) => {
    expect(isPraatFileAcceptedOnPlatform(file, 'web')).toBe(true)
    expect(isPraatFileAcceptedOnPlatform(file, 'ios')).toBe(true)
    expect(isPraatFileAcceptedOnPlatform(file, 'android')).toBe(true)
  })

  it.each(['web', 'ios', 'android'])('accepts every Web format and rejects unsupported audio on %s', (target) => {
    for (const extension of getPraatPlatformCapabilities('web').inputFormats) {
      expect(isPraatFileAcceptedOnPlatform({ name: `recording.${extension}`, type: '' }, target)).toBe(true)
    }
    expect(isPraatFileAcceptedOnPlatform({ name: 'recording.aiff', type: 'audio/aiff' }, target)).toBe(false)
  })

  it('keeps native local Python available as an explicit fallback in the acceptance matrix', () => {
    expect(PLATFORM_FEATURE_MATRIX.praatTools.capabilities).toMatchObject({
      web: { preferredEngine: 'remote-api' },
      ios: { preferredEngine: 'remote-api', fallbackEngine: 'local-python', inputFormats: ['wav', 'mp3', 'm4a', 'webm', 'ogg', 'flac', 'aac'] },
      android: { preferredEngine: 'remote-api', fallbackEngine: 'local-python', inputFormats: ['wav', 'mp3', 'm4a', 'webm', 'ogg', 'flac', 'aac'] },
    })

    expect(PLATFORM_FEATURE_MATRIX.praatTools.acceptance.ios).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'praat.ios.local-python-analysis', driver: 'python-parselmouth' }),
    ]))
    expect(PLATFORM_FEATURE_MATRIX.praatTools.acceptance.android).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'praat.android.local-python-analysis', driver: 'python-parselmouth' }),
    ]))
  })
})
