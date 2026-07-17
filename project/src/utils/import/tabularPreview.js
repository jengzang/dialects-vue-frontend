import * as XLSX from 'xlsx'

const EXCEL_FILE_PATTERN = /\.(xlsx|xls)$/i
const CSV_FILE_PATTERN = /\.csv$/i
const TABULAR_FILE_PATTERN = /\.(xlsx|xls|csv)$/i

export const DEFAULT_PREVIEW_ROW_COUNT = null

function normalizeCellValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return String(value).trim()
}

function buildFallbackHeaders(columnCount) {
  return Array.from({ length: columnCount }, (_, index) => `column_${index + 1}`)
}

function padRow(row, targetLength) {
  const normalized = Array.isArray(row) ? row.map(normalizeCellValue) : []
  if (normalized.length >= targetLength) {
    return normalized.slice(0, targetLength)
  }

  return [...normalized, ...Array.from({ length: targetLength - normalized.length }, () => '')]
}

function inferColumnCount(rows) {
  return rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0)
}

function sanitizeSheetRows(rows) {
  return rows
    .map((row) => (Array.isArray(row) ? row.map(normalizeCellValue) : []))
    .filter((row) => row.some((cell) => cell !== ''))
}

function parseWorkbook(workbook) {
  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
      defval: ''
    })
    const rows = sanitizeSheetRows(rawRows)
    const columnCount = inferColumnCount(rows)
    const normalizedRows = rows.map((row) => padRow(row, columnCount))

    return {
      id: sheetName,
      name: sheetName,
      rows: normalizedRows,
      rowCount: normalizedRows.length,
      columnCount
    }
  }).filter((sheet) => sheet.rowCount > 0 || sheet.columnCount > 0)
}

function parseCsvText(text, fileName = 'CSV') {
  const workbook = XLSX.read(text, { type: 'string' })
  const sheets = parseWorkbook(workbook)

  if (sheets.length > 0) {
    return sheets
  }

  return [
    {
      id: fileName,
      name: fileName,
      rows: [],
      rowCount: 0,
      columnCount: 0
    }
  ]
}

export function isTabularPreviewFile(file) {
  return Boolean(file?.name && TABULAR_FILE_PATTERN.test(file.name))
}

export async function parseTabularFile(file) {
  if (!file) {
    throw new Error('No file provided')
  }

  if (!isTabularPreviewFile(file)) {
    throw new Error('Unsupported file type')
  }

  let sheets = []

  if (CSV_FILE_PATTERN.test(file.name)) {
    const text = await file.text()
    sheets = parseCsvText(text, file.name)
  } else if (EXCEL_FILE_PATTERN.test(file.name)) {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    sheets = parseWorkbook(workbook)
  }

  if (sheets.length === 0) {
    sheets = [{
      id: 'sheet-1',
      name: 'Sheet1',
      rows: [],
      rowCount: 0,
      columnCount: 0
    }]
  }

  return {
    fileName: file.name,
    size: file.size,
    type: file.type,
    sheets,
    totalSheets: sheets.length,
    totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0),
    totalColumns: Math.max(0, ...sheets.map((sheet) => sheet.columnCount))
  }
}

export function derivePreviewTable(parsedFile, options = {}) {
  const {
    sheetId,
    headerRowIndex = 0,
    previewRowCount = DEFAULT_PREVIEW_ROW_COUNT
  } = options

  const sheets = parsedFile?.sheets || []
  const activeSheet = sheets.find((sheet) => sheet.id === sheetId) || sheets[0] || null

  if (!activeSheet) {
    return {
      activeSheet: null,
      headers: [],
      previewRows: [],
      sourceColumns: []
    }
  }

  const rows = activeSheet.rows || []
  const columnCount = activeSheet.columnCount || inferColumnCount(rows)
  const fallbackHeaders = buildFallbackHeaders(columnCount)
  const hasHeader = headerRowIndex >= 0

  let headers, dataRows, safeHeaderIndex
  if (hasHeader) {
    safeHeaderIndex = Math.max(0, Math.min(headerRowIndex, Math.max(rows.length - 1, 0)))
    const headerRow = rows[safeHeaderIndex] || []
    headers = fallbackHeaders.map((fallback, index) => normalizeCellValue(headerRow[index]) || fallback)
    dataRows = rows.slice(safeHeaderIndex + 1)
  } else {
    safeHeaderIndex = -1
    headers = fallbackHeaders
    dataRows = rows.slice(0)
  }
  const previewRows = (Number.isFinite(previewRowCount)
    ? dataRows.slice(0, Math.max(0, previewRowCount))
    : dataRows
  ).map((row) => padRow(row, headers.length))
  const sourceColumns = headers.map((label, index) => ({
    key: `column_${index + 1}`,
    label,
    index,
    sampleValues: previewRows.map((row) => row[index]).filter(Boolean).slice(0, 3)
  }))

  return {
    activeSheet,
    headers,
    previewRows,
    sourceColumns,
    headerRowIndex: safeHeaderIndex
  }
}
