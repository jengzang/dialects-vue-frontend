import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { FilePicker } from '@capawesome/capacitor-file-picker'

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

function hasCapacitorFileExport(globals) {
  return Boolean(
    isNativeCapacitorApp(globals) &&
    isCapacitorPluginAvailable(globals, 'Filesystem') &&
    isCapacitorPluginAvailable(globals, 'Share')
  )
}

function hasCapacitorFilePicker(globals) {
  return Boolean(
    isNativeCapacitorApp(globals) &&
    isCapacitorPluginAvailable(globals, 'FilePicker')
  )
}

function getCapacitorFilesystem(options = {}) {
  return options.filesystem ?? { Directory, Filesystem }
}

function getCapacitorShare(options = {}) {
  return options.share ?? { Share }
}

function getCapacitorFilePicker(options = {}) {
  return options.filePicker ?? { FilePicker }
}

export function hasNativeFileBridge(options = {}) {
  const globals = getGlobals(options)
  const directBridge = getDirectNativeBridge(globals)
  const webkitBridge = getWebkitNativeBridge(globals)

  return Boolean(
    typeof directBridge?.saveFile === 'function' ||
    typeof webkitBridge?.postMessage === 'function' ||
    hasCapacitorFileExport(globals)
  )
}

export function hasNativeFilePickerBridge(options = {}) {
  const globals = getGlobals(options)
  const directBridge = getDirectNativeBridge(globals)

  return Boolean(
    typeof directBridge?.pickFiles === 'function' ||
    hasCapacitorFilePicker(globals)
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

function base64ToBlob(base64, mimeType = 'application/octet-stream') {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

function nativePayloadToFile(payload) {
  const fileName = payload?.fileName || payload?.name || 'import.dat'
  const mimeType = payload?.mimeType || payload?.type || 'application/octet-stream'
  const blob = payload?.blob || base64ToBlob(payload?.base64 || payload?.data || '', mimeType)

  return new File([blob], fileName, {
    type: mimeType,
    lastModified: payload?.lastModified || payload?.modifiedAt || Date.now(),
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

  if (hasCapacitorFileExport(globals)) {
    return saveBlobWithCapacitor(blob, fileName, payload.base64, options)
  }

  return null
}

async function saveBlobWithCapacitor(blob, fileName, base64, options = {}) {
  const safeFileName = fileName || 'export.dat'
  const { Directory: CapacitorDirectory, Filesystem: CapacitorFilesystem } = getCapacitorFilesystem(options)
  const { Share: CapacitorShare } = getCapacitorShare(options)
  const path = `exports/${safeFileName}`
  const result = await CapacitorFilesystem.writeFile({
    path,
    directory: CapacitorDirectory.Cache,
    data: base64,
    recursive: true,
  })
  const sharePayload = {
    title: safeFileName,
    files: [result.uri],
    dialogTitle: safeFileName,
  }
  const canShareResult = typeof CapacitorShare.canShare === 'function'
    ? await CapacitorShare.canShare()
    : { value: true }

  if (canShareResult?.value) {
    await CapacitorShare.share(sharePayload)
  }

  return {
    fileName: safeFileName,
    driver: 'capacitor-filesystem-share',
  }
}

async function pickFilesWithNativeBridge(pickerOptions = {}, options = {}) {
  const globals = getGlobals(options)
  const directBridge = getDirectNativeBridge(globals)

  if (typeof directBridge?.pickFiles !== 'function') {
    return null
  }

  const result = await directBridge.pickFiles({
    type: 'pickFiles',
    accept: pickerOptions.accept || '',
    multiple: Boolean(pickerOptions.multiple),
  })
  const payloads = Array.isArray(result) ? result : [result].filter(Boolean)

  return payloads.map(nativePayloadToFile)
}

function acceptToPickerTypes(accept = '') {
  return String(accept)
    .split(',')
    .map((type) => type.trim())
    .filter(Boolean)
}

async function pickFilesWithCapacitorFilePicker(pickerOptions = {}, options = {}) {
  const globals = getGlobals(options)

  if (!hasCapacitorFilePicker(globals)) {
    return null
  }

  const { FilePicker: CapacitorFilePicker } = getCapacitorFilePicker(options)
  const result = await CapacitorFilePicker.pickFiles({
    types: acceptToPickerTypes(pickerOptions.accept),
    limit: pickerOptions.multiple ? 0 : 1,
    readData: true,
  })
  const payloads = Array.isArray(result?.files) ? result.files : []

  return payloads.map(nativePayloadToFile)
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
    canPickFiles() {
      return hasNativeFilePickerBridge(options)
    },
    async pickFiles(pickerOptions = {}) {
      if (hasNativeFilePickerBridge(options)) {
        const nativeFiles = await pickFilesWithNativeBridge(pickerOptions, options)
        if (nativeFiles) {
          return nativeFiles
        }

        const capacitorFiles = await pickFilesWithCapacitorFilePicker(pickerOptions, options)
        if (capacitorFiles) {
          return capacitorFiles
        }
      }

      return null
    },
    async pickFilesOrOpenInput(inputElement, pickerOptions = {}) {
      const nativeFiles = await this.pickFiles(pickerOptions)
      if (nativeFiles) {
        return nativeFiles
      }

      inputElement?.click?.()
      return null
    },
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
