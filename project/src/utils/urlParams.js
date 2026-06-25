/**
 * URL 参数处理工具函数
 *
 * 用于音系查询组件的 URL 参数化，也包含一些通用 URL 工具。
 *
 * 设计约定：
 * - URL 查询参数中的地点 loc 使用 URL-safe Base64 编码，避免中文、特殊字符造成路径或查询串问题。
 * - 普通 query 参数仍使用 encodeURIComponent。
 * - Vue Router 的 route.query 中，同一个 key 可能是 string，也可能是 string[]，因此提供 normalizeQueryArray 统一处理。
 */

// ==================== 内部通用工具 ====================

/**
 * 判断当前是否处于浏览器环境。
 * 主要用于避免 SSR、构建期或测试环境中直接访问 window/document 报错。
 *
 * @returns {boolean} 当前运行环境是否存在 window 和 document
 */
function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * 判断查询参数值是否应该被忽略。
 *
 * @param {*} value - 任意参数值
 * @returns {boolean} 当值为 null、undefined 或空字符串时返回 true
 */
function isEmptyQueryValue(value) {
  return value === null || value === undefined || value === ''
}

/**
 * 将查询字符串追加到 URL 上。
 *
 * 支持：
 * - baseUrl 已经带有 query：/search?a=1
 * - baseUrl 带有 hash：/search#top
 * - baseUrl 同时带有 query 和 hash：/search?a=1#top
 *
 * @param {string} baseUrl - 基础 URL
 * @param {string} queryString - 不带 ? 的查询字符串
 * @returns {string} 拼接后的 URL
 */
function appendQueryString(baseUrl, queryString) {
  if (!queryString) return baseUrl

  const hashIndex = baseUrl.indexOf('#')
  const hasHash = hashIndex !== -1
  const urlWithoutHash = hasHash ? baseUrl.slice(0, hashIndex) : baseUrl
  const hash = hasHash ? baseUrl.slice(hashIndex) : ''
  const separator = urlWithoutHash.includes('?') ? '&' : '?'

  return `${urlWithoutHash}${separator}${queryString}${hash}`
}

/**
 * 将文本按 UTF-8 编码后转为标准 Base64。
 *
 * 相比直接 btoa(str)，此函数可以正确处理中文、IPA、特殊符号等 Unicode 字符。
 *
 * @param {*} value - 要编码的值，会先转为字符串
 * @returns {string} 标准 Base64 字符串
 */
function encodeTextBase64(value) {
  const bytes = new TextEncoder().encode(String(value ?? ''))
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

/**
 * 将标准 Base64 解码为 UTF-8 文本。
 *
 * @param {string} value - 标准 Base64 字符串
 * @returns {string} 解码后的文本
 */
function decodeTextBase64(value) {
  const binary = atob(String(value || ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

/**
 * 解码单个 Vue Router query 参数。
 *
 * Vue Router 的 query value 可能是：
 * - string
 * - string[]
 * - null
 * - undefined
 *
 * 当传入数组时，仅取第一个值。
 *
 * @param {string|string[]|null|undefined} param - query 参数值
 * @returns {string} 解码后的字符串；无值时返回空字符串
 */
const decodeSingleQueryParam = (param) => {
  if (Array.isArray(param)) {
    return decodeSingleQueryParam(param[0])
  }

  if (!param) return ''

  try {
    return decodeURIComponent(param)
  } catch {
    return param
  }
}

// ==================== 通用 URL 工具 ====================

/**
 * 解码 URL 参数对象。
 *
 * 通常用于解析 buildQueryUrl(baseUrl, params, true) 生成的 q 参数。
 *
 * 支持：
 * - UTF-8 Base64 编码后的 JSON 字符串
 * - 旧版 ASCII Base64 JSON 字符串
 *
 * 解码失败时不会抛出异常，而是返回空对象。
 *
 * @param {string|null|undefined} encodedParam - 编码后的参数字符串
 * @returns {Object} 解码后的参数对象
 *
 * @example
 * const params = decodeParams('eyJmb28iOiJiYXIifQ==')
 * console.log(params) // { foo: 'bar' }
 */
export function decodeParams(encodedParam) {
  try {
    if (!encodedParam) return {}

    const decoded = decodeTextBase64(encodedParam)
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Failed to decode params:', error)
    return {}
  }
}

/**
 * 构建查询 URL。
 *
 * 当 encode=false 时，会将 params 转为普通查询字符串：
 * - 普通值：key=value
 * - 数组值：key=val1&key=val2
 * - null、undefined、空字符串会被忽略
 *
 * 当 encode=true 时，会把整个 params 对象序列化为 JSON，
 * 再按 UTF-8 Base64 编码后放入 q 参数中：
 * - /search?q=xxxx
 *
 * 注意：
 * - encode=true 适合参数较复杂、包含中文或数组对象的情况。
 * - encode=false 适合希望 URL 可读性较强的情况。
 *
 * @param {string} baseUrl - 基础 URL，例如 /search
 * @param {Object} [params={}] - 查询参数对象
 * @param {boolean} [encode=false] - 是否将整个参数对象 Base64 编码到 q 参数
 * @returns {string} 完整的查询 URL
 *
 * @example
 * const url = buildQueryUrl('/search', { char: '香', tone: '1' })
 * console.log(url) // '/search?char=%E9%A6%99&tone=1'
 *
 * @example
 * const url = buildQueryUrl('/search', { char: '香', tone: '1' }, true)
 * console.log(url) // '/search?q=...'
 */
export function buildQueryUrl(baseUrl, params = {}, encode = false) {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl
  }

  if (encode) {
    const encoded = encodeTextBase64(JSON.stringify(params))
    return appendQueryString(baseUrl, `q=${encodeURIComponent(encoded)}`)
  }

  const queryString = Object.entries(params)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .filter((item) => !isEmptyQueryValue(item))
          .map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`)
      }

      if (isEmptyQueryValue(value)) {
        return []
      }

      return [`${encodeURIComponent(key)}=${encodeURIComponent(value)}`]
    })
    .join('&')

  return appendQueryString(baseUrl, queryString)
}

/**
 * 复制当前 URL 到剪贴板。
 *
 * 默认复制完整 URL，包括协议、域名、路径、查询参数和 hash。
 * 当 includeOrigin=false 时，只复制 pathname + search + hash。
 *
 * 在不支持 navigator.clipboard 的浏览器中，会自动降级为 document.execCommand('copy')。
 * 在非浏览器环境中会直接返回 false。
 *
 * @param {boolean} [includeOrigin=true] - 是否包含协议和域名
 * @returns {Promise<boolean>} 复制成功返回 true，否则返回 false
 *
 * @example
 * await copyCurrentUrl() // 复制完整 URL
 *
 * @example
 * await copyCurrentUrl(false) // 只复制路径、查询参数和 hash
 */
export async function copyCurrentUrl(includeOrigin = true) {
  if (!isBrowser()) return false

  try {
    const url = includeOrigin
      ? window.location.href
      : window.location.pathname + window.location.search + window.location.hash

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url)
      return true
    }

    // 降级方案：使用 document.execCommand
    const textArea = document.createElement('textarea')
    textArea.value = url
    textArea.setAttribute('readonly', '')
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'

    document.body.appendChild(textArea)
    textArea.select()

    const success = document.execCommand('copy')
    document.body.removeChild(textArea)

    return success
  } catch (error) {
    console.error('Failed to copy URL:', error)
    return false
  }
}

/**
 * 从当前 URL 路径段中获取指定索引的值。
 *
 * 路径段以 / 分割，并自动忽略空段。
 *
 * 注意：
 * - index 从 0 开始。
 * - 非浏览器环境中返回 null。
 * - 索引不存在时返回 null。
 *
 * @param {number} index - 路径段索引，0 表示第一个路径段
 * @returns {string|null} 路径段的值
 *
 * @example
 * // URL: /explore/phonology/custom
 * getUrlSegmentValue(0) // 'explore'
 * getUrlSegmentValue(1) // 'phonology'
 * getUrlSegmentValue(2) // 'custom'
 */
export function getUrlSegmentValue(index) {
  if (!isBrowser() || index < 0) return null

  const segments = window.location.pathname.split('/').filter(Boolean)
  return segments[index] || null
}

// ==================== 音系查询专用工具 ====================

/**
 * 从 Vue Router route.query.loc 中解析地点数组。
 *
 * loc 参数支持：
 * - 单个字符串：?loc=xxx
 * - 多个字符串：?loc=xxx&loc=yyy
 *
 * 每个 loc 值会先按 URL-safe Base64 解码。
 * 为兼容旧链接，如果 Base64 解码失败，会继续尝试 decodeURIComponent。
 *
 * @param {Object} route - Vue Router route 对象
 * @param {Object} [options={}] - 解析选项
 * @param {number} [options.limit=Infinity] - 最多返回的地点数量
 * @returns {Array<string>} 地点名称数组
 *
 * @example
 * const locations = parseLocationsFromUrl(route, { limit: 5 })
 */
export function parseLocationsFromUrl(route, { limit = Infinity } = {}) {
  const locations = normalizeQueryArray(route?.query?.loc)

  return locations
    .map((location) => decodeQueryValueBase64Url(location))
    .filter(Boolean)
    .slice(0, limit)
}

/**
 * 更新 URL 中的地点参数 loc。
 *
 * 更新逻辑：
 * - 保留当前 route.query 中已有的其他参数。
 * - 合并 additionalParams。
 * - 删除旧 loc。
 * - 将新的 locations 编码为 URL-safe Base64 后写入 loc。
 *
 * 当 locations 为空数组时，会从 URL 中移除 loc 参数。
 *
 * @param {Object} router - Vue Router 实例
 * @param {Array<string>} locations - 地点名称数组
 * @param {Object} [additionalParams={}] - 其他需要写入或覆盖的查询参数
 * @param {Object} [options={}] - 更新选项
 * @param {number} [options.limit=Infinity] - 最多写入的地点数量
 * @returns {Promise<void>|void} router.replace 的返回值
 *
 * @example
 * updateUrlWithLocations(router, ['廣州', '香港'], { tab: 'result' }, { limit: 5 })
 */
export function updateUrlWithLocations(
  router,
  locations,
  additionalParams = {},
  { limit = Infinity } = {}
) {
  const query = {
    ...(router?.currentRoute?.value?.query || {}),
    ...additionalParams
  }

  delete query.loc

  const normalizedLocations = Array.isArray(locations)
    ? locations.filter(Boolean).slice(0, limit)
    : []

  if (normalizedLocations.length > 0) {
    query.loc = normalizedLocations.map((location) => encodeQueryValueBase64Url(location))
  }

  return router.replace({ query })
}

/**
 * 解析 PhonologyCustom 页面的 URL 参数。
 *
 * 当前支持参数：
 * - loc：地点数组，使用 URL-safe Base64 编码
 * - feature：音系特征
 * - h：横向分类字段 horizontalColumn
 * - v：纵向分类字段 verticalColumn
 * - c：单元格行字段 cellRowColumn
 *
 * @param {Object} route - Vue Router route 对象
 * @returns {{
 *   locations: Array<string>,
 *   feature: string,
 *   horizontalColumn: string,
 *   verticalColumn: string,
 *   cellRowColumn: string
 * }} 解析后的参数对象
 *
 * @example
 * const params = parsePhonologyCustomParams(route)
 * console.log(params.locations)
 */
export function parsePhonologyCustomParams(route) {
  return {
    locations: parseLocationsFromUrl(route),
    feature: decodeSingleQueryParam(route?.query?.feature),
    horizontalColumn: decodeSingleQueryParam(route?.query?.h),
    verticalColumn: decodeSingleQueryParam(route?.query?.v),
    cellRowColumn: decodeSingleQueryParam(route?.query?.c)
  }
}

/**
 * 验证音系查询参数的有效性。
 *
 * 主要用于防止 URL 中的非法参数直接进入组件状态。
 *
 * 验证内容：
 * - feature 是否在 allowedFeatures 中
 * - horizontalColumn 是否在 allowedColumns 中
 * - verticalColumn 是否在 allowedColumns 中
 * - cellRowColumn 是否在 allowedColumns 中
 *
 * 空值不会被视为错误，因为页面可以使用默认配置兜底。
 *
 * @param {Object} params - 参数对象
 * @param {string} [params.feature] - 音系特征
 * @param {string} [params.horizontalColumn] - 横向分类字段
 * @param {string} [params.verticalColumn] - 纵向分类字段
 * @param {string} [params.cellRowColumn] - 单元格行字段
 * @param {Array<string>} allowedFeatures - 允许的特征列表
 * @param {Array<string>} allowedColumns - 允许的分类字段列表
 * @returns {{isValid: boolean, errors: Array<string>}} 验证结果
 *
 * @example
 * const result = validatePhonologyParams(params, ['聲母', '韻母', '聲調'], columns)
 * if (!result.isValid) console.warn(result.errors)
 */
export function validatePhonologyParams(params, allowedFeatures = [], allowedColumns = []) {
  const errors = []

  if (params.feature && !allowedFeatures.includes(params.feature)) {
    errors.push(`Invalid feature: ${params.feature}`)
  }

  if (params.horizontalColumn && !allowedColumns.includes(params.horizontalColumn)) {
    errors.push(`Invalid horizontal column: ${params.horizontalColumn}`)
  }

  if (params.verticalColumn && !allowedColumns.includes(params.verticalColumn)) {
    errors.push(`Invalid vertical column: ${params.verticalColumn}`)
  }

  if (params.cellRowColumn && !allowedColumns.includes(params.cellRowColumn)) {
    errors.push(`Invalid cell row column: ${params.cellRowColumn}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 解析字音分類页面的 URL 参数。
 *
 * 当前支持参数：
 * - table：数据表 key
 * - levels：层级字段列表，使用英文逗号分隔
 *
 * @param {Object} route - Vue Router route 对象
 * @returns {{table: string, levels: string[]}} 解析后的字音分类配置
 *
 * @example
 * // URL: ?table=characters&levels=攝,韻,聲母
 * const params = parseCharClassParams(route)
 * console.log(params)
 * // { table: 'characters', levels: ['攝', '韻', '聲母'] }
 */
export function parseCharClassParams(route) {
  const levelsParam = decodeSingleQueryParam(route?.query?.levels)

  return {
    table: decodeSingleQueryParam(route?.query?.table),
    levels: levelsParam
      ? levelsParam
        .split(',')
        .map((level) => decodeSingleQueryParam(level))
        .filter(Boolean)
      : []
  }
}

/**
 * 更新字音分類页面的 URL 参数。
 *
 * 更新逻辑：
 * - 写入 tab=params.pageKey
 * - 移除 sub，避免旧子页签状态干扰
 * - 当 includeTable=true 且 tableKey 存在时写入 table
 * - 当 levels 非空时写入 levels，多个层级用英文逗号连接
 * - 当 table 或 levels 不需要时，从 URL 中删除对应参数
 *
 * @param {Object} router - Vue Router router 实例
 * @param {Object} route - Vue Router route 对象
 * @param {Object} params - URL 同步参数
 * @param {string} params.pageKey - 当前页面或 tab key
 * @param {string} [params.tableKey] - 数据表 key
 * @param {string[]} params.levels - 当前层级字段列表
 * @param {boolean} [params.includeTable=false] - 是否在 URL 中保留 table 参数
 * @returns {Promise<void>|void} router.replace 的返回值
 *
 * @example
 * updateUrlWithCharClassConfig(router, route, {
 *   pageKey: 'char-class',
 *   tableKey: 'characters',
 *   levels: ['攝', '韻'],
 *   includeTable: true
 * })
 */
export function updateUrlWithCharClassConfig(router, route, params) {
  const query = {
    ...(route?.query || {}),
    tab: params.pageKey
  }

  delete query.sub

  if (params.includeTable && params.tableKey) {
    query.table = params.tableKey
  } else {
    delete query.table
  }

  if (params.levels?.length) {
    query.levels = params.levels.join(',')
  } else {
    delete query.levels
  }

  return router.replace({ query })
}

// ==================== URL-safe Base64 工具 ====================

/**
 * 将单个 query 值编码为 URL-safe Base64。
 *
 * 与标准 Base64 相比，URL-safe Base64 会进行如下转换：
 * - + 替换为 -
 * - / 替换为 _
 * - 移除末尾 =
 *
 * 该函数使用 TextEncoder，因此可以正确处理：
 * - 中文
 * - IPA 字符
 * - 全角符号
 * - 其他 Unicode 字符
 *
 * @param {*} value - 要编码的值，会先转为字符串
 * @returns {string} URL-safe Base64 字符串
 *
 * @example
 * const encoded = encodeQueryValueBase64Url('廣州')
 * // 可安全放入 URL query 中
 */
export function encodeQueryValueBase64Url(value) {
  return encodeTextBase64(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

/**
 * 解码 URL-safe Base64 query 值。
 *
 * 解码流程：
 * 1. 优先按 URL-safe Base64 解码。
 * 2. 如果失败，则按旧格式 decodeURIComponent 解码。
 * 3. 如果仍失败，则返回原始字符串。
 *
 * 因此该函数可以兼容：
 * - 新格式：base64url
 * - 旧格式：%E6%9D%B1...
 * - 已经被 Vue Router 解码后的中文字符串
 *
 * @param {string|null|undefined} value - URL-safe Base64 字符串或旧格式 query 值
 * @returns {string} 解码后的字符串；无值时返回空字符串
 *
 * @example
 * const location = decodeQueryValueBase64Url(route.query.loc)
 */
export function decodeQueryValueBase64Url(value) {
  const raw = String(value || '')
  if (!raw) return ''

  // 新格式：base64url
  try {
    const base64 = raw
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(raw.length / 4) * 4, '=')

    const decoded = decodeTextBase64(base64)

    if (decoded) return decoded
  } catch {
    // ignore
  }

  // 兼容旧格式：%E6%9D%B1... 或已经被 Vue Router 解码后的中文
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/**
 * 将 Vue Router query 参数统一转换为数组。
 *
 * Vue Router 中，同一个 query key 可能对应：
 * - undefined
 * - string
 * - string[]
 *
 * 此函数用于统一处理多值参数，例如 loc。
 *
 * @param {string|string[]|null|undefined} value - 原始 query 参数值
 * @returns {Array<string>} 统一后的数组
 *
 * @example
 * normalizeQueryArray('a') // ['a']
 * normalizeQueryArray(['a', 'b']) // ['a', 'b']
 * normalizeQueryArray(undefined) // []
 */
export function normalizeQueryArray(value) {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}