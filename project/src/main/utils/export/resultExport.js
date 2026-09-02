// 通用结果导出/复制原语：CSV/TSV 序列化 + 剪贴板 + 下载

function escapeCsvCell(value) {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function escapeTsvCell(value) {
  return String(value ?? '').replace(/[\t\n\r]+/g, ' ').trim()
}

export function toCsv(rows) {
  return '﻿' + rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n')
}

export function toTsv(rows) {
  return rows.map((r) => r.map(escapeTsvCell).join('\t')).join('\n')
}

export async function copyText(text) {
  if (typeof navigator === 'undefined') return false

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) {
    // 降级到 execCommand
  }

  if (typeof document === 'undefined') return false

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-999999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch (e) {
    console.error('复制失败:', e)
    return false
  }
}

export function downloadText(content, filename, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
