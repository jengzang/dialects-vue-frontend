export function isTabularSourceExportable(source) {
  if (!source || source.downloadable === false) {
    return false
  }

  return Boolean(source.file || source.resolveFile || source.resolveExport)
}

export async function resolveTabularSourceExport(source) {
  if (!isTabularSourceExportable(source)) {
    throw new Error('Source is not exportable')
  }

  if (source.file) {
    return {
      blob: source.file,
      fileName: source.file.name || source.fileName || 'export.dat'
    }
  }

  if (typeof source.resolveFile === 'function') {
    const file = await source.resolveFile()
    return {
      blob: file,
      fileName: file?.name || source.fileName || 'export.dat'
    }
  }

  if (typeof source.resolveExport === 'function') {
    const result = await source.resolveExport()
    if (!result?.blob) {
      throw new Error('Source export payload is missing blob')
    }
    return {
      blob: result.blob,
      fileName: result.fileName || source.fileName || 'export.dat'
    }
  }

  throw new Error('Source has no export resolver')
}

export async function downloadTabularSource(source) {
  const { blob, fileName } = await resolveTabularSourceExport(source)
  const objectUrl = window.URL.createObjectURL(blob)

  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName || 'export.dat'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  } finally {
    window.URL.revokeObjectURL(objectUrl)
  }

  return { fileName }
}
