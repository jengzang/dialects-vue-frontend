import { getPlatformFileService } from './files.js'

export function getPlatformShareUrl(href, native = false) {
  if (!native) return href
  const source = new URL(href)
  return `https://dialects.yzup.top${source.pathname}${source.search}${source.hash}`
}

export async function shareNativeImage(dataUrl, filename, service = getPlatformFileService()) {
  const [header, payload] = dataUrl.split(',')
  const mime = header.match(/^data:([^;]+)/)?.[1] || 'image/png'
  const binary = atob(payload)
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  return service.saveBlob(new Blob([bytes], { type: mime }), filename)
}
