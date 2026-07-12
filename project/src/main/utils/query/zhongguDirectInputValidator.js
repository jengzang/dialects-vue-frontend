import { TABLE_COLUMN_SCHEMAS } from '@/main/config/chars_positions/characters.js'

const tableConfigCache = {}

function buildS2TT2S(normalizationMapping) {
  const S2T = {}
  const T2S = {}
  for (const [variant, canonical] of Object.entries(normalizationMapping)) {
    S2T[variant] = canonical
    if (!T2S[canonical]) T2S[canonical] = variant
  }
  return { S2T, T2S }
}

function getTableConfig(tableName) {
  if (tableConfigCache[tableName]) return tableConfigCache[tableName]

  const schema = TABLE_COLUMN_SCHEMAS[tableName]
  if (!schema) {
    console.warn(`Unknown character table "${tableName}", falling back to characters`)
    return getTableConfig('characters')
  }

  const categoryValues = schema.columns.column_values
  const normalizationMapping = schema.input?.normalization_mapping || {}
  const { S2T, T2S } = buildS2TT2S(normalizationMapping)

  const valueToCategories = {}
  Object.entries(categoryValues).forEach(([category, values]) => {
    values.forEach(value => {
      if (!valueToCategories[value]) valueToCategories[value] = []
      if (!valueToCategories[value].includes(category)) {
        valueToCategories[value].push(category)
      }
    })
  })

  const duplicateValues = new Set(
    Object.entries(valueToCategories)
      .filter(([, cats]) => cats.length > 1)
      .map(([val]) => val)
  )

  const categoryNames = Object.keys(categoryValues)
  const categoryNamesSorted = [...categoryNames].sort((a, b) => b.length - a.length)

  const categoryPriority = [...schema.columns.hierarchy].reverse()

  const config = {
    categoryValues,
    S2T,
    T2S,
    valueToCategories,
    duplicateValues,
    categoryNames,
    categoryNamesSorted,
    categoryPriority
  }

  tableConfigCache[tableName] = config
  return config
}

function toTraditional(str, ctx) {
  let result = ''
  for (const ch of str) {
    result += ctx.S2T[ch] || ch
  }
  return result
}

function toSimplified(str, ctx) {
  let result = ''
  for (const ch of str) {
    result += ctx.T2S[ch] || ch
  }
  return result
}

function lookupValue(value, ctx) {
  if (ctx.valueToCategories[value]) return ctx.valueToCategories[value]
  const trad = toTraditional(value, ctx)
  if (trad !== value && ctx.valueToCategories[trad]) return ctx.valueToCategories[trad]
  const simp = toSimplified(value, ctx)
  if (simp !== value && ctx.valueToCategories[simp]) return ctx.valueToCategories[simp]
  return null
}

function resolveCanonicalValue(value, ctx) {
  if (ctx.valueToCategories[value]) return value
  const trad = toTraditional(value, ctx)
  if (trad !== value && ctx.valueToCategories[trad]) return trad
  const simp = toSimplified(value, ctx)
  if (simp !== value && ctx.valueToCategories[simp]) return simp
  return toTraditional(value, ctx)
}

function lookupCategory(cat, ctx) {
  if (ctx.categoryValues[cat]) return cat
  const trad = toTraditional(cat, ctx)
  if (trad !== cat && ctx.categoryValues[trad]) return trad
  const simp = toSimplified(cat, ctx)
  if (simp !== cat && ctx.categoryValues[simp]) return simp
  return null
}

function tryMatchFullMatchPattern(token, ctx) {
  const dashIdx = token.indexOf('-')
  if (dashIdx <= 0) return null

  const prefixValueRaw = token.slice(0, dashIdx)
  const categoryRaw = token.slice(dashIdx + 1)

  const category = lookupCategory(categoryRaw, ctx)
  if (!category) return null

  const prefixCats = lookupValue(prefixValueRaw, ctx)
  if (!prefixCats || prefixCats.length === 0) return null

  return { value: resolveCanonicalValue(prefixValueRaw, ctx), category, isFullMatch: true }
}

function tryMatchCategorySuffix(token, ctx) {
  const tradToken = toTraditional(token, ctx)
  const simpToken = toSimplified(token, ctx)

  for (const cat of ctx.categoryNamesSorted) {
    const catSimp = toSimplified(cat, ctx)
    const vals = ctx.categoryValues[cat]
    if (!vals) continue

    if (tradToken.endsWith(cat) && tradToken.length > cat.length) {
      const v = tradToken.slice(0, -cat.length)
      if (vals.includes(v)) return { value: v, category: cat }
    }
    if (catSimp !== cat && tradToken.endsWith(catSimp) && tradToken.length > catSimp.length) {
      const v = tradToken.slice(0, -catSimp.length)
      if (vals.includes(v)) return { value: v, category: cat }
    }
    if (simpToken.endsWith(cat) && simpToken.length > cat.length) {
      const v = simpToken.slice(0, -cat.length)
      if (vals.includes(v)) return { value: v, category: cat }
    }
    if (catSimp !== cat && simpToken.endsWith(catSimp) && simpToken.length > catSimp.length) {
      const v = simpToken.slice(0, -catSimp.length)
      if (vals.includes(v)) return { value: v, category: cat }
    }
  }
  return null
}

function getDefaultCategory(categories, ctx) {
  if (!categories || categories.length === 0) return null
  if (categories.length === 1) return categories[0]
  for (const preferred of ctx.categoryPriority) {
    if (categories.includes(preferred)) return preferred
  }
  return categories[0]
}

function getCategoryForValue(value, ctx) {
  const cats = ctx.valueToCategories[value]
  return getDefaultCategory(cats, ctx)
}

export function parseTokens(input) {
  if (!input || !input.trim()) return []
  return input.trim().split(/\s+/)
}

export function getCategoryLabel(category) {
  return category
}

export function validateToken(token, tableName = 'characters') {
  const ctx = getTableConfig(tableName)

  if (!token || !token.trim()) {
    return { valid: false, error: 'empty' }
  }

  const trimmed = token.trim()

  if (trimmed.startsWith('-')) {
    const categoryRaw = trimmed.slice(1)
    const category = lookupCategory(categoryRaw, ctx)
    if (!category) {
      return {
        valid: false,
        error: 'unknownCategory',
        errorPayload: { category: categoryRaw }
      }
    }
    return {
      valid: true,
      parsed: { value: null, category, isFullMatch: true }
    }
  }

  const fullMatch = tryMatchFullMatchPattern(trimmed, ctx)
  if (fullMatch) {
    return { valid: true, parsed: fullMatch }
  }

  const suffixMatch = tryMatchCategorySuffix(trimmed, ctx)
  if (suffixMatch) {
    return {
      valid: true,
      parsed: { value: suffixMatch.value, category: suffixMatch.category, isFullMatch: false }
    }
  }

  const categories = lookupValue(trimmed, ctx)
  const resolvedValue = resolveCanonicalValue(trimmed, ctx)
  if (categories && categories.length === 1) {
    return {
      valid: true,
      parsed: { value: resolvedValue, category: categories[0], isFullMatch: false }
    }
  }

  if (categories && categories.length > 1) {
    return {
      valid: true,
      warning: 'duplicateValue',
      warningPayload: {
        value: trimmed,
        categories: categories.map(c => `${resolvedValue}${getCategoryLabel(c)}`)
      },
      parsed: { value: resolvedValue, category: getDefaultCategory(categories, ctx), isFullMatch: false }
    }
  }

  if (resolvedValue.length > 1) {
    const chars = [...resolvedValue]
    const charResults = []
    let allKnown = true

    for (const ch of chars) {
      const chCats = lookupValue(ch, ctx)
      if (!chCats || chCats.length === 0) {
        allKnown = false
        break
      }
      charResults.push({ value: resolveCanonicalValue(ch, ctx), category: getDefaultCategory(chCats, ctx) })
    }

    if (allKnown && charResults.length > 0) {
      return {
        valid: true,
        parsed: { compound: charResults, isCompound: true }
      }
    }
  }

  return {
    valid: false,
    error: 'unknownValue',
    errorPayload: { value: trimmed }
  }
}

export function validateAll(input, tableName = 'characters') {
  const tokens = parseTokens(input)
  if (tokens.length === 0) {
    return { valid: true, results: [], errors: [], warnings: [] }
  }

  const results = []
  const errors = []
  const warnings = []

  tokens.forEach(token => {
    const result = validateToken(token, tableName)
    if (result.valid && result.parsed) {
      results.push(result.parsed)
    } else if (!result.valid) {
      errors.push({
        token,
        message: result.error,
        payload: result.errorPayload || {}
      })
    }

    if (result.warning) {
      warnings.push({
        token,
        message: result.warning,
        payload: result.warningPayload || {}
      })
    }
  })

  return {
    valid: errors.length === 0,
    results,
    errors,
    warnings
  }
}

export function tokensToPathStrings(parseResults, tableName = 'characters') {
  const ctx = getTableConfig(tableName)
  const pathStrings = []

  parseResults.forEach(parsed => {
    if (parsed.isFullMatch) {
      const values = ctx.categoryValues[parsed.category] || []
      if (parsed.value) {
        const prefixCat = getCategoryForValue(parsed.value, ctx)
        const prefix = `[${parsed.value}]{${prefixCat || parsed.category}}`
        values.forEach(v => {
          pathStrings.push(`${prefix}[${v}]{${parsed.category}}`)
        })
      } else {
        values.forEach(v => {
          pathStrings.push(`[${v}]{${parsed.category}}`)
        })
      }
    } else if (parsed.isCompound) {
      const segments = parsed.compound.map(c => `[${c.value}]{${c.category}}`).join('')
      pathStrings.push(segments)
    } else {
      pathStrings.push(`[${parsed.value}]{${parsed.category}}`)
    }
  })

  return pathStrings
}

export { getDefaultCategory }
