// Pure service registration keeps native plugin imports out of geometry workers.
let nativeFileService = null

export function registerNativeFileService(service) {
  nativeFileService = service
}

export function getPlatformFileService() {
  if (!nativeFileService) throw new Error('Native file service is not initialized')
  return nativeFileService
}
