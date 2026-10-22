const WEB_PRAAT_FORMATS = ['wav', 'mp3', 'm4a', 'webm', 'ogg', 'flac', 'aac']
const WEB_PRAAT_MIME_TYPES = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/webm',
  'audio/m4a',
  'audio/x-m4a',
  'audio/flac',
  'audio/aac',
  'audio/x-aac',
]
const NATIVE_PRAAT_FORMATS = ['wav']

const NATIVE_TEMPORARY_AUDIO_POLICY = {
  originalInput: 'delete-after-analysis',
  normalizedAudio: 'delete-after-analysis',
  resultJson: 'retain',
  runMetadata: 'retain',
}

export const PRAAT_PLATFORM_CAPABILITIES = {
  web: {
    target: 'web',
    preferredEngine: 'remote-api',
    fallbackEngine: null,
    inputFormats: WEB_PRAAT_FORMATS,
    acceptsAllBackendFormats: true,
    accept: '.wav,.mp3,.m4a,.webm,.ogg,.flac,.aac,audio/*',
    temporaryAudioPolicy: null,
  },
  ios: {
    target: 'ios',
    preferredEngine: 'local-python',
    fallbackEngine: 'remote-api',
    inputFormats: NATIVE_PRAAT_FORMATS,
    acceptsAllBackendFormats: false,
    accept: '.wav,audio/wav,audio/x-wav',
    temporaryAudioPolicy: NATIVE_TEMPORARY_AUDIO_POLICY,
  },
  android: {
    target: 'android',
    preferredEngine: 'local-python',
    fallbackEngine: 'remote-api',
    inputFormats: NATIVE_PRAAT_FORMATS,
    acceptsAllBackendFormats: false,
    accept: '.wav,audio/wav,audio/x-wav',
    temporaryAudioPolicy: NATIVE_TEMPORARY_AUDIO_POLICY,
  },
}

function normalizePraatTarget(target) {
  return target === 'ios' || target === 'android' ? target : 'web'
}

function getFileExtension(file) {
  const name = typeof file?.name === 'string' ? file.name : ''
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex === -1 || dotIndex === name.length - 1) {
    return ''
  }
  return name.slice(dotIndex + 1).toLowerCase()
}

export function getPraatPlatformCapabilities(target = 'web') {
  return PRAAT_PLATFORM_CAPABILITIES[normalizePraatTarget(target)]
}

export function getPraatInputAccept(target = 'web') {
  return getPraatPlatformCapabilities(target).accept
}

export function isPraatFileAcceptedOnPlatform(file, target = 'web') {
  const capabilities = getPraatPlatformCapabilities(target)
  const extension = getFileExtension(file)

  if (extension && capabilities.inputFormats.includes(extension)) {
    return true
  }

  const mimeType = typeof file?.type === 'string' ? file.type.toLowerCase() : ''
  if (capabilities.target === 'web' && WEB_PRAAT_MIME_TYPES.includes(mimeType)) {
    return true
  }

  if (capabilities.inputFormats.includes('wav')) {
    return mimeType === 'audio/wav' || mimeType === 'audio/x-wav' || mimeType === 'audio/wave'
  }

  return false
}
