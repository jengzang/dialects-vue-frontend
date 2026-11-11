import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  getPraatInputAccept,
  isPraatFileAcceptedOnPlatform,
} from '../src/platform/index.js'
import enPraat from '../src/i18n/locales/en/praat.json'
import zhCNPraat from '../src/i18n/locales/zh-CN/praat.json'
import zhHantPraat from '../src/i18n/locales/zh-Hant/praat.json'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('Praat native input guard', () => {
  it('exposes WAV-only accept values for native Praat file picking', () => {
    expect(getPraatInputAccept('ios')).toBe('.wav,audio/wav,audio/x-wav')
    expect(getPraatInputAccept('android')).toBe('.wav,audio/wav,audio/x-wav')
    expect(getPraatInputAccept('web')).toContain('.mp3')
  })

  it('rejects non-WAV files on native platforms before analysis', () => {
    expect(isPraatFileAcceptedOnPlatform({ name: 'tone.wav', type: 'audio/wav' }, 'ios')).toBe(true)
    expect(isPraatFileAcceptedOnPlatform({ name: 'tone.mp3', type: 'audio/mpeg' }, 'ios')).toBe(false)
    expect(isPraatFileAcceptedOnPlatform({ name: 'tone.m4a', type: 'audio/mp4' }, 'android')).toBe(false)
    expect(isPraatFileAcceptedOnPlatform({ name: 'tone.m4a', type: 'audio/mp4' }, 'web')).toBe(true)
  })

  it('routes the upload component through Praat platform accept and validation helpers', () => {
    const source = readSource('src/main/components/praat/AudioInputPanel.vue')

    expect(source).toContain(':accept="fileInputAccept"')
    expect(source).toContain('accept: fileInputAccept.value')
    expect(source).toContain('isPraatFileAcceptedOnPlatform(file, praatPlatformTarget)')
    expect(source).toContain("t('praat.audioInput.errors.nativeUnsupportedFormat')")
  })

  it('keeps a second guard in the page-level start analysis action', () => {
    const source = readSource('src/main/views/explore/Praat.vue')

    expect(source).toContain("import { getCurrentRuntimePlatform, isPraatFileAcceptedOnPlatform } from '@/platform/index.js'")
    expect(source).toContain('isPraatFileAcceptedOnPlatform(audioFile.value, praatPlatformTarget)')
    expect(source).toContain("t('praat.audioInput.errors.nativeUnsupportedFormat')")
  })

  it('documents the native-only WAV message in every Praat locale', () => {
    for (const locale of [enPraat, zhCNPraat, zhHantPraat]) {
      expect(locale.audioInput.errors.nativeUnsupportedFormat).toBeTruthy()
    }
  })
})
