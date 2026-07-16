import * as XLSX from 'xlsx'

function parseColumnIndex(sourceKey) {
  const match = sourceKey?.match(/^column_(\d+)$/)
  return match ? parseInt(match[1], 10) - 1 : -1
}

function getCell(row, index) {
  if (index < 0 || index >= row.length) return ''
  return row[index] ?? ''
}

function buildXlsxFile(headers, dataRows, originalFileName) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  const baseName = originalFileName || 'file.xlsx'
  const dotIndex = baseName.lastIndexOf('.')
  const stem = dotIndex > 0 ? baseName.substring(0, dotIndex) : baseName
  const newName = `_mapped_${stem}.xlsx`

  return new File([blob], newName, { type: blob.type })
}

/**
 * Transform a parsed tabular file into a new XLSX File with remapped/renamed columns.
 *
 * @param {Object} params
 * @param {Object} params.parsedFile - Result from parseTabularFile()
 * @param {Array<{sourceKey: string, header: string}>} params.columnMap
 * @param {string} params.selectedSheetId
 * @param {number} [params.headerRowIndex=0]
 * @param {'replace'|'rename'} [params.mode='replace']
 *   - 'replace': output only the columns in columnMap, with new headers
 *   - 'rename': keep all original columns, rename those in columnMap
 * @returns {File}
 */
export function transformTabularFile({
  parsedFile,
  columnMap,
  selectedSheetId,
  headerRowIndex = 0,
  mode = 'replace'
}) {
  if (!parsedFile) throw new Error('transformTabularFile: parsedFile is required')
  if (!columnMap?.length) throw new Error('transformTabularFile: columnMap is required')

  const sheet = parsedFile.sheets.find(s => s.id === selectedSheetId) || parsedFile.sheets[0]
  if (!sheet) throw new Error('transformTabularFile: no sheet found')

  const rows = sheet.rows || []
  const hasHeader = headerRowIndex >= 0
  let safeHeaderIdx, dataRows

  if (hasHeader) {
    safeHeaderIdx = Math.max(0, Math.min(headerRowIndex, Math.max(rows.length - 1, 0)))
    dataRows = rows.slice(safeHeaderIdx + 1)
  } else {
    safeHeaderIdx = -1
    dataRows = rows.slice(0)
  }

  const outputHeaders = columnMap.map(m => m.header)
  const sourceIndices = columnMap.map(m => parseColumnIndex(m.sourceKey))

  if (mode === 'replace') {
    const outputRows = dataRows.map(row =>
      sourceIndices.map(idx => getCell(row, idx))
    )
    return buildXlsxFile(outputHeaders, outputRows, parsedFile.fileName)
  }

  // rename mode
  const allRows = sheet.rows || []
  const origHeaderRow = hasHeader ? (allRows[safeHeaderIdx] || []) : []
  const columnCount = sheet.columnCount || origHeaderRow.length || sourceIndices.length

  const renameMap = new Map()
  columnMap.forEach(m => {
    const idx = parseColumnIndex(m.sourceKey)
    if (idx >= 0) renameMap.set(idx, m.header)
  })

  const renamedHeaders = Array.from({ length: columnCount }, (_, i) =>
    renameMap.get(i) ?? (origHeaderRow[i] || `column_${i + 1}`)
  )

  const outputRows = dataRows.map(row =>
    Array.from({ length: columnCount }, (_, i) => getCell(row, i))
  )

  return buildXlsxFile(renamedHeaders, outputRows, parsedFile.fileName)
}
