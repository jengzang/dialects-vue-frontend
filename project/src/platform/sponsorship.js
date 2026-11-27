import { getCurrentRuntimePlatform } from './runtime.js'

export function shouldHideSponsorContent(runtime = getCurrentRuntimePlatform()) {
  return runtime?.family === 'ios' && runtime?.container === 'native-webview'
}
