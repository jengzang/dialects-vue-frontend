function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-—–()（）【】[]：:]/g, '')
}

export function autoMatchColumns(schema = [], sourceColumns = []) {
  const remaining = new Map(sourceColumns.map((column) => [column.key, column]))
  const mapping = {}

  schema.forEach((field) => {
    const candidates = [field.label, ...(field.aliases || [])]
      .map(normalizeText)
      .filter(Boolean)

    const directMatch = sourceColumns.find((column) => candidates.includes(normalizeText(column.label)))
    if (directMatch) {
      mapping[field.key] = directMatch.key
      remaining.delete(directMatch.key)
      return
    }

    const fuzzyMatch = sourceColumns.find((column) => {
      const normalizedColumn = normalizeText(column.label)
      return candidates.some((candidate) => normalizedColumn.includes(candidate) || candidate.includes(normalizedColumn))
    })

    if (fuzzyMatch) {
      mapping[field.key] = fuzzyMatch.key
      remaining.delete(fuzzyMatch.key)
      return
    }

    mapping[field.key] = null
  })

  return mapping
}

export function buildMappingDiagnostics(schema = [], sourceColumns = [], mapping = {}) {
  const assignedSourceKeys = new Map()
  Object.entries(mapping || {}).forEach(([fieldKey, sourceKey]) => {
    if (!sourceKey) {
      return
    }

    if (!assignedSourceKeys.has(sourceKey)) {
      assignedSourceKeys.set(sourceKey, [])
    }
    assignedSourceKeys.get(sourceKey).push(fieldKey)
  })

  const duplicateSourceKeys = Array.from(assignedSourceKeys.entries())
    .filter(([, fieldKeys]) => fieldKeys.length > 1)
    .map(([sourceKey, fieldKeys]) => ({ sourceKey, fieldKeys }))

  const missingRequiredFields = schema
    .filter((field) => field.required && !mapping[field.key])
    .map((field) => field.key)

  const usedSourceKeys = new Set(Object.values(mapping || {}).filter(Boolean))
  const unusedSourceColumns = sourceColumns.filter((column) => !usedSourceKeys.has(column.key))

  return {
    missingRequiredFields,
    duplicateSourceKeys,
    unusedSourceColumns,
    isComplete: missingRequiredFields.length === 0 && duplicateSourceKeys.length === 0
  }
}
