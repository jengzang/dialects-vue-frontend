import { DialectsNative } from './nativeBridge.js'
import { getCurrentRuntimePlatform } from './runtime.js'
import { PRAAT_AUDIO_LIMITS } from '@/main/config/constants.js'

export function createNativeAudioIntake({ plugin, router, route, onError = console.error }) {
  let pending = null
  let reading = false
  let listener
  const subscribers = new Set()
  const read = async () => {
    if (reading || pending) return
    reading = true
    try {
      const audio = await plugin.getPendingAudio()
      if (!audio?.id) return
      const binary = atob(audio.base64)
      if (!binary.length || binary.length > PRAAT_AUDIO_LIMITS.MAX_FILE_SIZE) {
        throw new Error('Invalid shared audio size')
      }
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
      const file = new File([bytes], audio.name || 'recording.wav', { type: audio.mime || '' })
      await router.isReady()
      // Wait for navigation before acknowledging the native copy.
      const failure = await router.push(route())
      // Vue Router returns a failure object when a guard cancels navigation.
      // Duplicated navigation is harmless when Praat is already open.
      if (failure && failure.type !== 16) throw failure
      pending = { file, id: audio.id }
      for (const subscriber of subscribers) subscriber()
    } catch (error) {
      onError(error)
    } finally {
      reading = false
    }
  }
  return {
    async start() {
      listener = await plugin.addListener('audioReceived', read)
      await read()
    },
    take() {
      if (!pending) return null
      const { file, id } = pending
      pending = null
      Promise.resolve(plugin.consumeAudio({ id })).catch(onError)
      return file
    },
    subscribe(callback) {
      subscribers.add(callback)
      return () => subscribers.delete(callback)
    },
    dispose() {
      listener?.remove()
      subscribers.clear()
    },
  }
}

let intake = null

export async function initializeNativeAudioIntake(router, route) {
  if (getCurrentRuntimePlatform().container !== 'native-webview') return
  intake = createNativeAudioIntake({ plugin: DialectsNative, router, route })
  await intake.start()
}

export function takeSharedAudio() {
  return intake?.take() || null
}

export function onSharedAudio(callback) {
  return intake?.subscribe(callback) || (() => {})
}
