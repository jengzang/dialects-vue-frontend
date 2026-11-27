// Pure service registration keeps native plugin imports out of geometry workers.
let nativeFileService = null

export function registerNativeFileService(service) {
  nativeFileService = service
}

export function getPlatformFileService() {
  if (!nativeFileService) throw new Error('Native file service is not initialized')
  return nativeFileService
}

// Template/sample links also need the system share sheet in a native WebView.
export function initializeNativeDownloadLinks({ documentRef = document, onError = console.error } = {}) {
  const handleClick = event => {
    const anchor = event.target?.closest?.('a[download]')
    if (!anchor || event.defaultPrevented) return
    event.preventDefault()
    const filename = anchor.getAttribute('download') || decodeURIComponent(new URL(anchor.href).pathname.split('/').pop())
    fetch(anchor.href).then(response => {
      if (!response.ok) throw new Error('Unable to download file')
      return response.blob()
    }).then(blob => getPlatformFileService().saveBlob(blob, filename)).catch(error => {
      if (error?.name !== 'AbortError') onError(error)
    })
  }
  documentRef.addEventListener('click', handleClick, true)
  return () => documentRef.removeEventListener('click', handleClick, true)
}
