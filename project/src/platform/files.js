function getGlobals(options = {}) {
  return options.globals ?? (typeof window === 'undefined' ? {} : window)
}

function getDocument(options = {}) {
  return options.document ?? (typeof document === 'undefined' ? null : document)
}

function getUrlApi(globals) {
  return globals.URL || globals.webkitURL
}

function getDirectNativeBridge(globals) {
  return globals.DialectsNativeBridge || globals.DialectsAndroidBridge
}

function getWebkitNativeBridge(globals) {
  return globals.webkit?.messageHandlers?.dialectsNativeFile ||
    globals.webkit?.messageHandlers?.dialectsFile
}

export function hasNativeFileBridge(options = {}) {
  const globals = getGlobals(options)
  const directBridge = getDirectNativeBridge(globals)
  const webkitBridge = getWebkitNativeBridge(globals)

  return Boolean(
    typeof directBridge?.saveFile === 'function' ||
    typeof webkitBridge?.postMessage === 'function'
  )
}

async function blobToBase64(blob, options = {}) {
  if (typeof blob?.arrayBuffer === 'function') {
    const arrayBuffer = await blob.arrayBuffer()
    let binary = ''
    const bytes = new Uint8Array(arrayBuffer)

    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }

    return btoa(binary)
  }

  const globals = getGlobals(options)
  const FileReaderApi = globals.FileReader || (typeof FileReader === 'undefined' ? null : FileReader)

  if (!FileReaderApi) {
    throw new Error('Blob base64 conversion is not available')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReaderApi()
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = () => reject(reader.error || new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}

async function saveBlobWithNativeBridge(blob, fileName, options = {}) {
  const globals = getGlobals(options)
  const payload = {
    type: 'saveFile',
    fileName: fileName || 'export.dat',
    mimeType: blob?.type || 'application/octet-stream',
    base64: await blobToBase64(blob, options),
  }
  const directBridge = getDirectNativeBridge(globals)

  if (typeof directBridge?.saveFile === 'function') {
    directBridge.saveFile(payload)
    return { fileName: payload.fileName, driver: 'native-file-bridge' }
  }

  const webkitBridge = getWebkitNativeBridge(globals)
  if (typeof webkitBridge?.postMessage === 'function') {
    webkitBridge.postMessage(payload)
    return { fileName: payload.fileName, driver: 'native-file-bridge' }
  }

  return null
}

function saveBlobWithBrowserDownload(blob, fileName, options = {}) {
  const globals = getGlobals(options)
  const documentRef = getDocument(options)
  const urlApi = getUrlApi(globals)

  if (!documentRef || !urlApi?.createObjectURL) {
    return { fileName: fileName || 'export.dat', driver: 'unavailable' }
  }

  const objectUrl = urlApi.createObjectURL(blob)

  try {
    const anchor = documentRef.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName || 'export.dat'
    documentRef.body?.appendChild(anchor)
    anchor.click()
    if (typeof anchor.remove === 'function') {
      anchor.remove()
    } else {
      anchor.parentNode?.removeChild(anchor)
    }
    return { fileName: anchor.download, driver: 'browser-download' }
  } finally {
    urlApi.revokeObjectURL?.(objectUrl)
  }
}

export function getPlatformFileService(options = {}) {
  return {
    async saveBlob(blob, fileName) {
      if (hasNativeFileBridge(options)) {
        const nativeResult = await saveBlobWithNativeBridge(blob, fileName, options)
        if (nativeResult) {
          return nativeResult
        }
      }

      return saveBlobWithBrowserDownload(blob, fileName, options)
    },
  }
}
