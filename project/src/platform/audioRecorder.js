import { CapacitorAudioRecorder } from '@capgo/capacitor-audio-recorder'

function getGlobals(options = {}) {
  return options.globals ?? (typeof window === 'undefined' ? {} : window)
}

function isCapacitorPluginAvailable(globals, pluginName) {
  return Boolean(globals?.Capacitor?.isPluginAvailable?.(pluginName))
}

function isNativeCapacitorApp(globals) {
  if (typeof globals?.Capacitor?.isNativePlatform === 'function') {
    return globals.Capacitor.isNativePlatform()
  }

  const platform = globals?.Capacitor?.getPlatform?.()
  return platform === 'ios' || platform === 'android'
}

function getCapacitorAudioRecorder(options = {}) {
  return options.audioRecorder ?? { CapacitorAudioRecorder }
}

function getFetch(options = {}) {
  return options.fetch ?? (typeof fetch === 'undefined' ? null : fetch)
}

function getNow(options = {}) {
  return options.now ?? Date.now
}

function extensionForMimeType(mimeType = '') {
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a'
  if (mimeType.includes('wav')) return 'wav'
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('webm')) return 'webm'
  return 'm4a'
}

async function blobFromRecordingResult(result, options = {}) {
  if (result?.blob) {
    return result.blob
  }

  const globals = getGlobals(options)
  const fetchApi = getFetch(options)
  if (!fetchApi || !result?.uri) {
    throw new Error('Native recording data is not available')
  }

  const recordingUri = typeof globals?.Capacitor?.convertFileSrc === 'function'
    ? globals.Capacitor.convertFileSrc(result.uri)
    : result.uri
  const response = await fetchApi(recordingUri)
  if (response?.ok === false) {
    throw new Error('Failed to read native recording')
  }

  return response.blob()
}

export function hasNativeAudioRecorder(options = {}) {
  const globals = getGlobals(options)

  return Boolean(
    isNativeCapacitorApp(globals) &&
    isCapacitorPluginAvailable(globals, 'CapacitorAudioRecorder')
  )
}

export function getPlatformAudioRecorder(options = {}) {
  const { CapacitorAudioRecorder: AudioRecorder } = getCapacitorAudioRecorder(options)

  return {
    canRecord() {
      return hasNativeAudioRecorder(options)
    },
    async start(recordingOptions = {}) {
      if (!this.canRecord()) {
        return null
      }

      await AudioRecorder.startRecording({
        sampleRate: recordingOptions.sampleRate ?? 44100,
        bitRate: recordingOptions.bitRate ?? 128000,
      })

      return { driver: 'capacitor-audio-recorder' }
    },
    async stop() {
      if (!this.canRecord()) {
        return null
      }

      const result = await AudioRecorder.stopRecording()
      const blob = await blobFromRecordingResult(result, options)
      const mimeType = blob.type || 'audio/mp4'
      const extension = extensionForMimeType(mimeType)
      const file = new File([blob], `recording-${getNow(options)()}.${extension}`, {
        type: mimeType,
      })

      return {
        file,
        blob,
        duration: typeof result?.duration === 'number' ? result.duration / 1000 : 0,
        driver: 'capacitor-audio-recorder',
      }
    },
  }
}
