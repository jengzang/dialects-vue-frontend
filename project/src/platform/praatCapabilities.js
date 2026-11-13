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
    preferredEngine: 'remote-api',
    fallbackEngine: 'local-python',
    inputFormats: WEB_PRAAT_FORMATS,
    acceptsAllBackendFormats: true,
    accept: '.wav,.mp3,.m4a,.webm,.ogg,.flac,.aac,audio/*',
    temporaryAudioPolicy: NATIVE_TEMPORARY_AUDIO_POLICY,
  },
  android: {
    target: 'android',
    preferredEngine: 'remote-api',
    fallbackEngine: 'local-python',
    inputFormats: WEB_PRAAT_FORMATS,
    acceptsAllBackendFormats: true,
    accept: '.wav,.mp3,.m4a,.webm,.ogg,.flac,.aac,audio/*',
    temporaryAudioPolicy: NATIVE_TEMPORARY_AUDIO_POLICY,
  },
}

function normalizePraatTarget(target) {
  return target === 'ios' || target === 'android' ? target : 'web'
}

export function getPraatPlatformCapabilities(target = 'web') {
  return PRAAT_PLATFORM_CAPABILITIES[normalizePraatTarget(target)]
}

export function getPraatInputAccept(target = 'web') {
  return getPraatPlatformCapabilities(target).accept
}

export function isPraatFileAcceptedOnPlatform(file) {
  const fileName = typeof file?.name === 'string' ? file.name : ''
  const fileType = typeof file?.type === 'string' ? file.type : ''
  const fileExt = fileName.split('.').pop().toLowerCase()
  return WEB_PRAAT_MIME_TYPES.some((format) => fileType.includes(format.split('/')[1])) ||
    WEB_PRAAT_FORMATS.includes(fileExt)
}
