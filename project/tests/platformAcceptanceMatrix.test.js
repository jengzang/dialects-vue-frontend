import { describe, expect, it } from 'vitest'

import {
  getPlatformAcceptanceChecklist,
  getPlatformAcceptanceDiagnostics,
  PLATFORM_FEATURE_MATRIX,
} from '../src/platform/index.js'

describe('platform acceptance matrix', () => {
  it('keeps Praat acceptance criteria in the platform matrix for all three targets', () => {
    expect(PLATFORM_FEATURE_MATRIX.praatTools.acceptance).toMatchObject({
      web: expect.arrayContaining([
        expect.objectContaining({ id: 'praat.web.file-select', driver: 'browser-file-input' }),
        expect.objectContaining({ id: 'praat.web.record', driver: 'browser-media-recorder' }),
        expect.objectContaining({ id: 'praat.web.decode-segment', driver: 'web-audio' }),
        expect.objectContaining({ id: 'praat.web.submit-analysis', driver: 'praat-api' }),
      ]),
      ios: expect.arrayContaining([
        expect.objectContaining({ id: 'praat.ios.file-select', driver: 'capacitor-file-picker' }),
        expect.objectContaining({ id: 'praat.ios.record', driver: 'capacitor-audio-recorder' }),
        expect.objectContaining({ id: 'praat.ios.microphone-permission', driver: 'ios-info-plist' }),
        expect.objectContaining({ id: 'praat.ios.decode-segment', driver: 'web-audio' }),
        expect.objectContaining({ id: 'praat.ios.submit-analysis', driver: 'python-parselmouth' }),
        expect.objectContaining({ id: 'praat.ios.local-python-analysis', driver: 'python-parselmouth' }),
      ]),
      android: expect.arrayContaining([
        expect.objectContaining({ id: 'praat.android.file-select', driver: 'capacitor-file-picker' }),
        expect.objectContaining({ id: 'praat.android.record', driver: 'capacitor-audio-recorder' }),
        expect.objectContaining({ id: 'praat.android.microphone-permission', driver: 'android-manifest' }),
        expect.objectContaining({ id: 'praat.android.decode-segment', driver: 'web-audio' }),
        expect.objectContaining({ id: 'praat.android.submit-analysis', driver: 'python-parselmouth' }),
        expect.objectContaining({ id: 'praat.android.local-python-analysis', driver: 'python-parselmouth' }),
      ]),
    })
  })

  it('collects target-specific acceptance checklists for scripted verification', () => {
    const iosChecklist = getPlatformAcceptanceChecklist('ios')
    const androidChecklist = getPlatformAcceptanceChecklist('android')
    const webChecklist = getPlatformAcceptanceChecklist('web')

    expect(iosChecklist.map((item) => item.id)).toEqual(expect.arrayContaining([
      'praat.ios.file-select',
      'praat.ios.record',
      'praat.ios.microphone-permission',
      'praat.ios.decode-segment',
      'praat.ios.submit-analysis',
      'praat.ios.local-python-analysis',
    ]))
    expect(androidChecklist.map((item) => item.id)).toEqual(expect.arrayContaining([
      'praat.android.file-select',
      'praat.android.record',
      'praat.android.microphone-permission',
      'praat.android.decode-segment',
      'praat.android.submit-analysis',
      'praat.android.local-python-analysis',
    ]))
    expect(webChecklist.map((item) => item.id)).toEqual(expect.arrayContaining([
      'praat.web.file-select',
      'praat.web.record',
      'praat.web.decode-segment',
      'praat.web.submit-analysis',
    ]))
  })

  it('diagnoses malformed acceptance matrix entries', () => {
    expect(getPlatformAcceptanceDiagnostics()).toEqual({
      duplicateIds: [],
      invalidTargets: [],
      missingFields: [],
    })
  })
})
