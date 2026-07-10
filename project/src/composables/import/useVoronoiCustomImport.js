import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildPartitionPoints, PARTITION_MODE_MAP, PARTITION_MODE_YINDIAN } from '@/main/utils/drawMap/partitionVoronoi.js'

const PARTITION_SOURCE_OFFICIAL = 'official'
const PARTITION_SOURCE_CUSTOM = 'custom'

function buildRequiredRule(sourceModes) {
  const hasMap = sourceModes.includes(PARTITION_MODE_MAP)
  const hasYindian = sourceModes.includes(PARTITION_MODE_YINDIAN)

  if (hasMap && hasYindian) {
    return 'anyPartition'
  }
  if (hasMap) {
    return PARTITION_MODE_MAP
  }
  return PARTITION_MODE_YINDIAN
}

function buildSchemaField(t, schemaKey, aliases, options = {}) {
  const { required = true } = options
  return {
    key: schemaKey,
    label: t(`common.importPreview.schemas.voronoi.${schemaKey}.label`),
    description: t(`common.importPreview.schemas.voronoi.${schemaKey}.description`),
    example: t(`common.importPreview.schemas.voronoi.${schemaKey}.example`),
    aliases,
    required,
  }
}

function buildVoronoiPreviewRow(row, index = 0) {
  return {
    ...row,
    __rowId: row.__rowId || `custom-${index + 1}`,
    __source: PARTITION_SOURCE_CUSTOM,
  }
}

function getMappedCell(row, sourceKey) {
  if (!sourceKey) return ''
  const value = row?.[sourceKey]
  return value === null || value === undefined ? '' : String(value).trim()
}

function buildNormalizedCandidate(row, mapping, partitionMode) {
  const lng = getMappedCell(row, mapping.lng)
  const lat = getMappedCell(row, mapping.lat)
  return {
    name: getMappedCell(row, mapping.name),
    lng,
    lat,
    longitude: lng,
    latitude: lat,
    mapPartition: partitionMode === PARTITION_MODE_MAP ? getMappedCell(row, mapping.mapPartition) : '',
    yindianPartition: partitionMode === PARTITION_MODE_YINDIAN ? getMappedCell(row, mapping.yindianPartition) : '',
    raw: row,
  }
}

function collectDuplicateNames(rows) {
  const counts = new Map()
  ;(Array.isArray(rows) ? rows : []).forEach((row) => {
    const name = String(row?.name || '').trim()
    if (!name) return
    counts.set(name, (counts.get(name) || 0) + 1)
  })
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([name, count]) => ({ name, count }))
}

export function useVoronoiCustomImport(options = {}) {
  const {
    sourceModes = [PARTITION_MODE_YINDIAN],
    defaultPartitionMode = PARTITION_MODE_YINDIAN,
  } = options

  const { t } = useI18n()
  const requiredRule = buildRequiredRule(sourceModes)
  const partitionMode = ref(sourceModes.includes(defaultPartitionMode) ? defaultPartitionMode : sourceModes[0] || PARTITION_MODE_YINDIAN)
  const summary = ref(null)
  const normalizedRows = ref([])
  const lastAppliedRows = ref([])

  const schema = computed(() => {
    const fields = [
      buildSchemaField(t, 'name', ['name', 'location', 'place', '地点', '地點', '簡稱', '简称']),
      buildSchemaField(t, 'lng', ['lng', 'lon', 'longitude', 'x', '经度', '經度']),
      buildSchemaField(t, 'lat', ['lat', 'latitude', 'y', '纬度', '緯度']),
    ]

    if (sourceModes.includes(PARTITION_MODE_MAP)) {
      fields.push(buildSchemaField(t, 'mapPartition', ['mapPartition', '地图集分区', '地圖集分區', '地图集二分区', '地圖集二分區'], {
        required: requiredRule === PARTITION_MODE_MAP,
      }))
    }

    if (sourceModes.includes(PARTITION_MODE_YINDIAN)) {
      fields.push(buildSchemaField(t, 'yindianPartition', ['yindianPartition', '音典分区', '音典分區'], {
        required: requiredRule === PARTITION_MODE_YINDIAN,
      }))
    }

    return fields
  })

  const sourceModeOptions = computed(() => sourceModes.map((value) => ({
    value,
    label: t(`map.drawTab.voronoi.customImport.partitionModeOptions.${value}`),
  })))

  const diagnostics = computed(() => {
    const currentSummary = summary.value
    const mappedRows = normalizedRows.value
    const missingPartitionRows = currentSummary?.missingPartitionRows || 0
    const invalidCoordinateRows = currentSummary?.invalidCoordinateRows || 0
    const duplicateNames = currentSummary?.duplicateNames || []

    return {
      mappedRowCount: mappedRows.length,
      totalRowCount: currentSummary?.totalRowCount || 0,
      invalidCoordinateRows,
      missingPartitionRows,
      duplicateNames,
      hasWarnings: invalidCoordinateRows > 0 || missingPartitionRows > 0 || duplicateNames.length > 0,
      isReady: mappedRows.length > 0,
    }
  })

  function updateSummaryFromPreview(previewSummary) {
    summary.value = previewSummary || null
    normalizedRows.value = []

    if (!previewSummary?.isComplete) {
      return null
    }

    const previewRows = previewSummary.parsedFile?.sheets?.find((sheet) => sheet.id === previewSummary.selectedSheetId)?.rows || []
    const startIndex = Number(previewSummary.headerRowIndex || 0) + 1
    const bodyRows = previewRows.slice(startIndex)
    const sourceColumns = Array.isArray(previewSummary.sourceColumns) ? previewSummary.sourceColumns : []
    const keys = sourceColumns.map((column) => column.key)

    const rawRows = bodyRows.map((cells, index) => {
      const row = keys.reduce((accumulator, key, cellIndex) => {
        accumulator[key] = cells?.[cellIndex] ?? ''
        return accumulator
      }, {})
      return buildVoronoiPreviewRow(row, index)
    })

    const nextNormalizedRows = []
    let invalidCoordinateRows = 0
    let missingPartitionRows = 0

    rawRows.forEach((row) => {
      const candidate = buildNormalizedCandidate(row, previewSummary.mapping || {}, partitionMode.value)
      const normalized = buildPartitionPoints([candidate], { partitionMode: partitionMode.value })[0]
      if (!candidate.name || !candidate.lng || !candidate.lat) {
        invalidCoordinateRows += 1
        return
      }
      if (!normalized) {
        if (!candidate.mapPartition && !candidate.yindianPartition) {
          missingPartitionRows += 1
        } else {
          invalidCoordinateRows += 1
        }
        return
      }
      nextNormalizedRows.push({
        ...normalized,
        source: PARTITION_SOURCE_CUSTOM,
        rowId: row.__rowId,
      })
    })

    normalizedRows.value = nextNormalizedRows
    const duplicateNames = collectDuplicateNames(nextNormalizedRows)
    summary.value = {
      ...previewSummary,
      totalRowCount: rawRows.length,
      invalidCoordinateRows,
      missingPartitionRows,
      duplicateNames,
    }
    return normalizedRows.value
  }

  function applyPreviewSummary(previewSummary) {
    const rows = updateSummaryFromPreview(previewSummary)
    lastAppliedRows.value = Array.isArray(rows) ? rows : []
    return lastAppliedRows.value
  }

  function clearImportedData() {
    summary.value = null
    normalizedRows.value = []
    lastAppliedRows.value = []
  }

  return {
    schema,
    partitionMode,
    sourceModeOptions,
    summary,
    diagnostics,
    normalizedRows,
    lastAppliedRows,
    updateSummaryFromPreview,
    applyPreviewSummary,
    clearImportedData,
  }
}
