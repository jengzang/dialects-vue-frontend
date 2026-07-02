const CATEGORY_VALUES = {
  '攝': ['通', '宕', '江', '止', '遇', '蟹', '流', '山', '效', '咸', '深', '臻', '曾', '梗', '果', '假'],
  '韻': ['之', '仙', '佳', '侯', '侵', '元', '先', '冬', '凡', '刪', '咍', '咸', '唐', '嚴', '夬', '宵', '寒', '尤', '山', '幽', '庚', '廢', '微', '支', '文', '東', '模', '欣', '歌', '江', '泰', '添', '灰', '痕', '登', '皆', '真', '祭', '耕', '肴', '脂', '臻', '蒸', '蕭', '虞', '覃', '談', '豪', '銜', '鍾', '陽', '青', '魂', '魚', '鹽', '麻', '齊', '清'],
  '呼': ['合', '開'],
  '等': ['一', '二', '三', '三A', '三B', '三C', '三銳', '四'],
  '入': ['舒', '入'],
  '調': ['平', '上', '去', '入'],
  '部位': ['雙唇', '齒', '唇齒', '喉', '捲舌', '腭', '軟腭'],
  '方式': ['塞', '塞擦', '擦', '近', '鼻'],
  '清濁': ['全清', '全濁', '次清', '次濁'],
  '系': ['幫', '知', '端', '見'],
  '組': ['幫', '非', '端', '泥', '精', '莊', '知', '章', '見', '曉', '影', '日'],
  '母': ['幫', '滂', '並', '明', '非', '敷', '奉', '微', '端', '透', '定', '泥', '知', '徹', '澄', '娘', '精', '從', '心', '邪', '莊', '初', '崇', '俟', '生', '章', '昌', '常', '書', '日', '船', '見', '溪', '群', '疑', '影', '曉', '匣', '云', '以', '來', '清']
}

const S2T = {
  '庄': '莊', '浊': '濁', '软': '軟', '卷': '捲', '齿': '齒',
  '双': '雙', '见': '見', '帮': '幫', '并': '並', '来': '來',
  '从': '從', '开': '開', '无': '無', '为': '為', '门': '門',
  '关': '關', '书': '書', '东': '東', '经': '經',
  '层': '層', '严': '嚴', '刍': '芻', '发': '發', '齐': '齊',
  '废': '廢', '号': '號', '国': '國', '会': '會', '机': '機',
  '极': '極', '节': '節', '尽': '盡', '据': '據', '宽': '寬',
  '乐': '樂', '离': '離', '里': '裡', '历': '歷', '联': '聯',
  '刘': '劉', '龙': '龍', '马': '馬', '么': '麼', '万': '萬',
  '农': '農', '气': '氣', '圣': '聖', '胜': '勝', '实': '實',
  '肃': '肅', '岁': '歲',
  '调': '調', '韵': '韻', '组': '組',
}

const T2S = {}
Object.entries(S2T).forEach(([s, t]) => {
  T2S[t] = s
})
// Additional traditional→simplified mappings for characters whose
// traditional variant differs from the canonical category value
Object.assign(T2S, {
  '雲': '云',
  '衛': '卫',
  '錄': '录',
  '復': '复',
  '術': '术',
  '選': '选',
  '尋': '寻',
  '對': '对',
  '導': '导',
  '義': '义',
  '處': '处',
  '傳': '传',
  '區': '区',
  '號': '号',
  '機': '机',
  '極': '极',
  '節': '节',
  '盡': '尽',
  '據': '据',
  '寬': '宽',
  '樂': '乐',
  '離': '离',
  '聯': '联',
  '劉': '刘',
  '龍': '龙',
  '馬': '马',
  '農': '农',
  '氣': '气',
  '聖': '圣',
  '勝': '胜',
  '實': '实',
  '肅': '肃',
  '歲': '岁',
  '萬': '万',
  '經': '经',
  '層': '层',
  '嚴': '严',
  '廢': '废',
  '齊': '齐',
  '國': '国',
  '會': '会',
  '關': '关',
  '東': '东',
  '麼': '么',
  '裏': '里',
  '歷': '历'
})

function toTraditional(str) {
  let result = ''
  for (const ch of str) {
    result += S2T[ch] || ch
  }
  return result
}

function toSimplified(str) {
  let result = ''
  for (const ch of str) {
    result += T2S[ch] || ch
  }
  return result
}

const valueToCategories = {}
Object.entries(CATEGORY_VALUES).forEach(([category, values]) => {
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

const CATEGORY_NAMES = Object.keys(CATEGORY_VALUES)
const CATEGORY_NAMES_SORTED = [...CATEGORY_NAMES].sort((a, b) => b.length - a.length)

const CATEGORY_LABELS = {
  '攝': '攝', '韻': '韻', '呼': '呼', '等': '等', '入': '入',
  '調': '調', '部位': '部位', '方式': '方式', '清濁': '清濁',
  '系': '系', '組': '組', '母': '母'
}

export function parseTokens(input) {
  if (!input || !input.trim()) return []
  return input.trim().split(/\s+/)
}

export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category
}

function lookupValue(value) {
  if (valueToCategories[value]) return valueToCategories[value]
  const trad = toTraditional(value)
  if (trad !== value && valueToCategories[trad]) return valueToCategories[trad]
  const simp = toSimplified(value)
  if (simp !== value && valueToCategories[simp]) return valueToCategories[simp]
  return null
}

function resolveCanonicalValue(value) {
  if (valueToCategories[value]) return value
  const trad = toTraditional(value)
  if (trad !== value && valueToCategories[trad]) return trad
  const simp = toSimplified(value)
  if (simp !== value && valueToCategories[simp]) return simp
  return toTraditional(value)
}

function lookupCategory(cat) {
  if (CATEGORY_VALUES[cat]) return cat
  const trad = toTraditional(cat)
  if (trad !== cat && CATEGORY_VALUES[trad]) return trad
  const simp = toSimplified(cat)
  if (simp !== cat && CATEGORY_VALUES[simp]) return simp
  return null
}

function tryMatchFullMatchPattern(token) {
  const dashIdx = token.indexOf('-')
  if (dashIdx <= 0) return null

  const prefixValueRaw = token.slice(0, dashIdx)
  const categoryRaw = token.slice(dashIdx + 1)

  const category = lookupCategory(categoryRaw)
  if (!category) return null

  const prefixCats = lookupValue(prefixValueRaw)
  if (!prefixCats || prefixCats.length === 0) return null

  return { value: resolveCanonicalValue(prefixValueRaw), category, isFullMatch: true }
}

function tryMatchCategorySuffix(token) {
  const tradToken = toTraditional(token)
  const simpToken = toSimplified(token)

  for (const cat of CATEGORY_NAMES_SORTED) {
    const catSimp = toSimplified(cat)
    let value = null

    if (tradToken.endsWith(cat) && tradToken.length > cat.length) {
      value = tradToken.slice(0, -cat.length)
    } else if (catSimp !== cat && tradToken.endsWith(catSimp) && tradToken.length > catSimp.length) {
      value = tradToken.slice(0, -catSimp.length)
    } else if (simpToken.endsWith(cat) && simpToken.length > cat.length) {
      value = simpToken.slice(0, -cat.length)
    } else if (catSimp !== cat && simpToken.endsWith(catSimp) && simpToken.length > catSimp.length) {
      value = simpToken.slice(0, -catSimp.length)
    }

    if (value !== null && CATEGORY_VALUES[cat] && CATEGORY_VALUES[cat].includes(value)) {
      return { value, category: cat }
    }
  }
  return null
}

export function validateToken(token) {
  if (!token || !token.trim()) {
    return { valid: false, error: 'empty' }
  }

  const trimmed = token.trim()

  if (trimmed.startsWith('-')) {
    const categoryRaw = trimmed.slice(1)
    const category = lookupCategory(categoryRaw)
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

  const fullMatch = tryMatchFullMatchPattern(trimmed)
  if (fullMatch) {
    return { valid: true, parsed: fullMatch }
  }

  const suffixMatch = tryMatchCategorySuffix(trimmed)
  if (suffixMatch) {
    return {
      valid: true,
      parsed: { value: suffixMatch.value, category: suffixMatch.category, isFullMatch: false }
    }
  }

  const categories = lookupValue(trimmed)
  const resolvedValue = resolveCanonicalValue(trimmed)
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
      parsed: { value: resolvedValue, category: getDefaultCategory(categories), isFullMatch: false }
    }
  }

  if (resolvedValue.length > 1) {
    const chars = [...resolvedValue]
    const charResults = []
    let allKnown = true

    for (const ch of chars) {
      const chCats = lookupValue(ch)
      if (!chCats || chCats.length === 0) {
        allKnown = false
        break
      }
      charResults.push({ value: ch, category: getDefaultCategory(chCats) })
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

export function validateAll(input) {
  const tokens = parseTokens(input)
  if (tokens.length === 0) {
    return { valid: true, results: [], errors: [], warnings: [] }
  }

  const results = []
  const errors = []
  const warnings = []

  tokens.forEach(token => {
    const result = validateToken(token)
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

export function tokensToPathStrings(parseResults) {
  const pathStrings = []

  parseResults.forEach(parsed => {
    if (parsed.isFullMatch) {
      const values = CATEGORY_VALUES[parsed.category] || []
      if (parsed.value) {
        const prefixCat = getCategoryForValue(parsed.value)
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

const CATEGORY_PRIORITY = ['母', '組', '系', '攝', '韻', '等', '呼', '調', '入', '部位', '方式', '清濁']

function getDefaultCategory(categories) {
  if (!categories || categories.length === 0) return null
  if (categories.length === 1) return categories[0]
  for (const preferred of CATEGORY_PRIORITY) {
    if (categories.includes(preferred)) return preferred
  }
  return categories[0]
}

function getCategoryForValue(value) {
  const cats = valueToCategories[value]
  return getDefaultCategory(cats)
}

export { CATEGORY_VALUES, valueToCategories, duplicateValues, CATEGORY_NAMES }
