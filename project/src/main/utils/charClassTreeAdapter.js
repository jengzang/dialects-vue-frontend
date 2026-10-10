const CHAR_KEYS = Object.freeze(['漢字', '汉字', 'chars', 'characters'])
const ANNOTATION_KEYS = Object.freeze(['釋義', '释义', 'annotations', 'notes'])

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeLeafText = (value) => {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

const isBlankNodeName = (value) => normalizeLeafText(value) === ''
const isEmptyLikeNodeName = (value) => {
  const normalizedValue = normalizeLeafText(value)
  return normalizedValue === '(空)' || normalizedValue === '（空）'
}

// 优化：直接基于预先分离好的 arrayMap 和 objectEntries 进行提取，避免重复 Object.entries
const pickArrayByKeys = (arrayMap, keys) => {
  for (const key of keys) {
    if (arrayMap.has(key)) {
      return arrayMap.get(key)
    }
  }
  return null
}

const getConfiguredColumnArrays = (columnNames, arrayMap) =>
  (columnNames || []).map((columnName) => arrayMap.get(columnName)).filter(Array.isArray)

const appendLeafContent = (target, node) => {
  const chars = Array.isArray(node?.chars) ? node.chars : []
  const annotations = Array.isArray(node?.annotations) ? node.annotations : []

  chars.forEach((char, index) => {
    const normalizedChar = normalizeLeafText(char)
    if (!normalizedChar) {
      return
    }

    target.chars.push(normalizedChar)
    target.annotations.push(normalizeLeafText(annotations[index]))
  })
}

const composeLeafValues = (fieldConfig, arrayMap) => {
  const columnArrays = getConfiguredColumnArrays(fieldConfig?.columns, arrayMap)
  if (!columnArrays.length) {
    return []
  }

  const rowCount = columnArrays.reduce(
    (maxLength, currentValues) => Math.max(maxLength, currentValues.length),
    0
  )

  return Array.from({ length: rowCount }, (_, rowIndex) =>
    columnArrays
      .map((columnValues) => normalizeLeafText(columnValues[rowIndex]))
      .filter(Boolean)
      .join(fieldConfig?.joiner ?? '')
  )
}

const buildConfiguredLeafPayload = (name, arrayMap, objectEntries, options) => {
  if (!options?.leafLevelColumnName || objectEntries.length > 0) {
    return null
  }

  const normalizedChar = normalizeLeafText(name)
  if (!normalizedChar) {
    return null
  }

  const annotations = composeLeafValues(options?.leafData?.annotations, arrayMap)
  const rowCount = Math.max(annotations.length, 1)

  const normalizedChars = []
  const normalizedAnnotations = []

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    normalizedChars.push(normalizedChar)
    normalizedAnnotations.push(normalizeLeafText(annotations[rowIndex]))
  }

  return {
    chars: normalizedChars,
    annotations: normalizedAnnotations,
    promoteLeafContent: true
  }
}

const buildLegacyLeafPayload = (arrayMap, objectEntries) => {
  const charsByKey = pickArrayByKeys(arrayMap, CHAR_KEYS)
  const annotationsByKey = pickArrayByKeys(arrayMap, ANNOTATION_KEYS)

  if (charsByKey || annotationsByKey) {
    return {
      chars: charsByKey || [],
      annotations: annotationsByKey || []
    }
  }

  // 兜底逻辑：如果有数组，但没有任何子对象，默认取前两个数组
  if (arrayMap.size > 0 && objectEntries.length === 0) {
    const arrayValues = Array.from(arrayMap.values())
    return {
      chars: arrayValues[0] || [],
      annotations: arrayValues[1] || []
    }
  }

  return null
}

const normalizeChildNodes = (objectEntries, path, options) => {
  const normalizedChildren = []
  const promotedLeafContent = {
    chars: [],
    annotations: []
  }

  objectEntries.forEach(([key, value], index) => {
    const childNode = normalizeNode(value, key, `${path}.${index}`, options)
    if (!childNode) {
      return
    }

    const hasNestedChildren = Array.isArray(childNode.children) && childNode.children.length > 0
    const shouldPromoteTrailingEmptyNode = isEmptyLikeNodeName(childNode.name) && !hasNestedChildren

    if (isBlankNodeName(childNode.name) || shouldPromoteTrailingEmptyNode || childNode.promoteLeafContent) {
      appendLeafContent(promotedLeafContent, childNode)
      normalizedChildren.push(...(childNode.children || []))
      return
    }

    normalizedChildren.push(childNode)
  })

  return {
    children: normalizedChildren,
    ...promotedLeafContent
  }
}

const normalizeNode = (data, name, path, options) => {
  if (!isObject(data)) {
    return null
  }

  // 核心优化：在入口处一次性完成数据分类，彻底避免在子函数中重复执行 Object.entries
  const arrayMap = new Map()
  const objectEntries = []

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      arrayMap.set(key, value)
    } else if (isObject(value)) {
      objectEntries.push([key, value])
    }
  }

  // 将分类好的数据传入，取代旧版的 data 透传
  const configuredLeafPayload = buildConfiguredLeafPayload(name, arrayMap, objectEntries, options)
  if (configuredLeafPayload) {
    return {
      id: path,
      name,
      _normalizedName: normalizeLeafText(name).toLowerCase(), // 缓存用于搜索的小写名称
      ...configuredLeafPayload,
      children: [],
      isLeaf: true
    }
  }

  const legacyLeafPayload = buildLegacyLeafPayload(arrayMap, objectEntries)
  if (legacyLeafPayload) {
    return {
      id: path,
      name,
      _normalizedName: normalizeLeafText(name).toLowerCase(),
      ...legacyLeafPayload,
      children: [],
      isLeaf: true
    }
  }

  const {
    children,
    chars,
    annotations
  } = normalizeChildNodes(objectEntries, path, options)

  if (!children.length && !chars.length) {
    return null
  }

  return {
    id: path,
    name,
    _normalizedName: normalizeLeafText(name).toLowerCase(),
    chars,
    annotations,
    children,
    isLeaf: children.length === 0
  }
}

const normalizeCollapsedLeafLevel = (rawTree, options) => {
  const promotedLeafContent = {
    chars: [],
    annotations: []
  }

  Object.entries(rawTree || {}).forEach(([topKey, value], index) => {
    const node = normalizeNode(value, topKey, `node.${index}`, options)
    if (!node) {
      return
    }

    appendLeafContent(promotedLeafContent, node)
  })

  if (!promotedLeafContent.chars.length) {
    return []
  }

  return [{
    id: 'node.leaf-content',
    name: '',
    _normalizedName: '',
    ...promotedLeafContent,
    children: [],
    isLeaf: true
  }]
}

export const normalizeCharClassTree = (rawTree, options = {}) => {
  if (options.collapseLeafLevel) {
    return normalizeCollapsedLeafLevel(rawTree, options)
  }

  return Object.entries(rawTree || {})
    .map(([topKey, value], index) => normalizeNode(value, topKey, `node.${index}`, options))
    .filter(Boolean)
}

export const filterCharClassTree = (nodes, query) => {
  if (!nodes?.length) {
    return []
  }

  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return nodes
  }

  const loweredQuery = trimmedQuery.toLowerCase()

  return nodes.reduce((accumulator, node) => {
    // 优化：直接使用初始化时缓存的名字，避免搜索时重复计算
    const selfMatch = node._normalizedName.includes(loweredQuery)
    
    // 修正：从诡异的单字 OR 匹配，改为符合直觉的包含匹配
    const charMatch = (node.chars || []).some((char) => char.includes(trimmedQuery))

    if (node.isLeaf) {
      if (selfMatch || charMatch) {
        accumulator.push({ ...node, _autoExpand: false })
      }
      return accumulator
    }

    const filteredChildren = filterCharClassTree(node.children || [], trimmedQuery)

    if (filteredChildren.length > 0 || charMatch) {
      accumulator.push({
        ...node,
        children: filteredChildren,
        _autoExpand: true
      })
    } else if (selfMatch) {
      accumulator.push({
        ...node,
        children: node.children,
        _autoExpand: false
      })
    }

    return accumulator
  }, [])
}
