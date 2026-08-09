// api/main/vocabulary.js - 词表业务接口
import { api } from '../auth/httpClient.js'
import { showError } from '@/utils/ui/message.js'

const VOCABULARY_ITEMS_ENDPOINT = '/api/vocabulary/search/entries'
const VOCABULARY_MAP_POINTS_ENDPOINT = '/api/vocabulary/search/map-points'
const VOCABULARY_STANDARD_WORDS_ENDPOINT = '/api/vocabulary/search/standard-words'
const VOCABULARY_MAP_ITEMS_ENDPOINT = '/api/vocabulary/search/map-items'
const VOCABULARY_LOCATION_OPTIONS_ENDPOINT = '/api/vocabulary/search/location-options'
const VOCABULARY_LOCATIONS_ENDPOINT = '/api/vocabulary/locations'
const VOCABULARY_LOGS_ENDPOINT = '/api/vocabulary/logs'
const VOCABULARY_IMPORTS_ENDPOINT = '/api/vocabulary/imports'
const VOCABULARY_ME_ENDPOINT = '/api/vocabulary/me'
const VOCABULARY_ADMIN_PERMISSIONS_ENDPOINT = '/api/vocabulary/admin/permissions'
const VOCABULARY_SQL_ENDPOINT = '/api/vocabulary/sql'
const VOCABULARY_ENTRIES_TABLE = 'vocabulary_entries'

function stripVocabularyDbKey(params = {}) {
  const rest = { ...params }
  delete rest.db_key
  return rest
}

function appendScalarIfPresent(params, key, value) {
  if (value === undefined || value === null || value === '') {
    return
  }
  params.append(key, String(value))
}

function appendListIfPresent(params, key, value) {
  if (Array.isArray(value)) {
    const normalized = value.map((item) => String(item).trim()).filter(Boolean)
    if (normalized.length) {
      params.append(key, normalized.join(','))
    }
    return
  }

  appendScalarIfPresent(params, key, value)
}

function appendQueryParams(values = {}) {
  const query = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    appendListIfPresent(query, key, value)
  })
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

function assertVocabularyEntriesTable(params = {}) {
  if (params.table_name && params.table_name !== VOCABULARY_ENTRIES_TABLE) {
    throw new Error('/api/vocabulary/sql/* 只允許操作 vocabulary_entries')
  }
}

function stripAndValidateVocabularySqlParams(params = {}) {
  assertVocabularyEntriesTable(params)
  return stripVocabularyDbKey({
    ...params,
    table_name: VOCABULARY_ENTRIES_TABLE,
  })
}

function stripVocabularyBatchReplaceParams(params = {}) {
  const rest = stripAndValidateVocabularySqlParams(params)
  delete rest.pk_column
  return rest
}

/**
 * @typedef {'all' | 'definition' | 'headword' | 'pronunciation' | 'detail' | 'location'} VocabularySearchField
 */

/**
 * @typedef {object} VocabularyItemsQuery
 * @property {string} [q] 模糊搜索内容。
 * @property {VocabularySearchField | VocabularySearchField[]} [search_fields] 指定 q 搜索字段。
 * @property {string | string[]} [locations] 独立地点筛选，多个地点之间为 OR；该筛选与 q 内容匹配是 AND 关系。
 * @property {string} [province] 按省筛选，与 locations 互斥。
 * @property {string} [city] 按市筛选，与 locations 互斥。
 * @property {number} [page=1] 卡片模式结果页码；后端默认 1。
 * @property {number} [page_size=50] 卡片模式每页数量；后端默认 50，最大 200。
 */

/**
 * @typedef {object} VocabularyItem
 * @property {string | number} [id] 词条 ID。
 * @property {string} standard_word 标准书面语释义。
 * @property {string} local_expression 当地方言写法。
 * @property {string} ipa IPA 或其他注音格式。
 * @property {string} notes 备注。
 * @property {string} informations 补充信息。
 * @property {string} location_name 地点简称。
 * @property {string} location_label 完整地点链。
 */

/**
 * @typedef {object} VocabularyMapPoint
 * @property {string} location_name 地点简称，也用于点击地图点后回查词条详情。
 * @property {string} location_label 完整地点链。
 * @property {number | null} longitude 经度；地图模式需要容忍空值。
 * @property {number | null} latitude 纬度；地图模式需要容忍空值。
 * @property {number} entry_count 当前搜索条件下该地点命中的词条数。
 */

/**
 * @typedef {object} VocabularyStandardWordOption
 * @property {string} standard_word 标准书面词。
 * @property {number} entry_count 该标准词匹配词条数。
 * @property {number} location_count 该标准词覆盖地点数。
 */

/**
 * @typedef {VocabularyMapPoint & {items: VocabularyItem[]}} VocabularyMapItemPoint
 */

/**
 * @typedef {object} VocabularyItemsResponse
 * @property {VocabularyItem[]} items 卡片模式词条结果。
 * @property {number} total 后端匹配总数。
 * @property {number} page 当前页码。
 * @property {number} page_size 当前页大小。
 */

/**
 * @typedef {object} VocabularyMapPointsResponse
 * @property {VocabularyMapPoint[]} points 可绘制的地图点。
 * @property {number} total_entries 当前搜索条件下命中的词条总数，包括无有效坐标的词条。
 * @property {number} total_points 实际返回的可绘制点数量。
 * @property {number} omitted_without_coordinates 命中词条但无有效坐标的地点数量。
 */

/**
 * 构造词表卡片模式查询路径。
 *
 * 该接口服务卡片列表、加载更多、地图点点击后的词条详情列表；表格模式继续走表格专属 API。
 * 注意：不传 search_fields 时，后端默认搜索内容字段，不会把 location 纳入 q 搜索。
 *
 * @param {VocabularyItemsQuery} [params={}]
 * @returns {string}
 */
export function buildVocabularyItemsPath(params = {}) {
  return `${VOCABULARY_ITEMS_ENDPOINT}${appendQueryParams({
    q: params.q,
    search_fields: params.search_fields,
    locations: params.locations,
    province: params.province,
    city: params.city,
    page: params.page,
    page_size: params.page_size,
  })}`
}

/**
 * 构造词表地图模式聚合点查询路径。
 *
 * 该接口用于地图初始绘制，不分页，不返回完整词条详情。
 *
 * @param {Omit<VocabularyItemsQuery, 'page' | 'page_size'>} [params={}]
 * @returns {string}
 */
export function buildVocabularyMapPointsPath(params = {}) {
  return `${VOCABULARY_MAP_POINTS_ENDPOINT}${appendQueryParams({
    q: params.q,
    search_fields: params.search_fields,
    locations: params.locations,
    province: params.province,
    city: params.city,
  })}`
}

/**
 * 构造词表标准词候选查询路径。
 *
 * 该接口用于地图模式的 standard_word 单选/多选控件；不传 limit 时由后端返回全量去重候选。
 *
 * @param {Omit<VocabularyItemsQuery, 'page' | 'page_size'> & {limit?: number}} [params={}]
 * @returns {string}
 */
export function buildVocabularyStandardWordsPath(params = {}) {
  return `${VOCABULARY_STANDARD_WORDS_ENDPOINT}${appendQueryParams({
    q: params.q,
    search_fields: params.search_fields,
    locations: params.locations,
    province: params.province,
    city: params.city,
    limit: params.limit,
  })}`
}

/**
 * 构造词表地图详情点查询路径。
 *
 * 该接口只在前端已选择 standard_words 时调用；不分页，返回每个地点的词条详情 items。
 *
 * @param {Omit<VocabularyItemsQuery, 'page' | 'page_size'> & {standard_words: string | string[]}} params
 * @returns {string}
 */
export function buildVocabularyMapItemsPath(params = {}) {
  return `${VOCABULARY_MAP_ITEMS_ENDPOINT}${appendQueryParams({
    standard_words: params.standard_words,
    q: params.q,
    search_fields: params.search_fields,
    locations: params.locations,
    province: params.province,
    city: params.city,
  })}`
}

/**
 * 获取词表卡片模式结果。
 *
 * @param {VocabularyItemsQuery} [params={}]
 * @returns {Promise<VocabularyItemsResponse>}
 */
export async function getVocabularyItems(params = {}) {
  try {
    return await api(buildVocabularyItemsPath(params))
  } catch (error) {
    console.error('Get vocabulary items error:', error)
    showError(error.message || '獲取詞表條目失敗')
    throw new Error(error.message || '獲取詞表條目失敗')
  }
}

/**
 * 获取词表地图模式聚合点。
 *
 * @param {Omit<VocabularyItemsQuery, 'page' | 'page_size'>} [params={}]
 * @returns {Promise<VocabularyMapPointsResponse>}
 */
export async function getVocabularyMapPoints(params = {}) {
  try {
    return await api(buildVocabularyMapPointsPath(params))
  } catch (error) {
    console.error('Get vocabulary map points error:', error)
    showError(error.message || '獲取詞表地圖點失敗')
    throw new Error(error.message || '獲取詞表地圖點失敗')
  }
}

/**
 * 获取词表标准词候选。
 *
 * @param {Omit<VocabularyItemsQuery, 'page' | 'page_size'> & {limit?: number}} [params={}]
 * @returns {Promise<{standard_words: VocabularyStandardWordOption[], total: number}>}
 */
export async function getVocabularyStandardWords(params = {}) {
  try {
    return await api(buildVocabularyStandardWordsPath(params))
  } catch (error) {
    console.error('Get vocabulary standard words error:', error)
    showError(error.message || '獲取詞表標準詞失敗')
    throw new Error(error.message || '獲取詞表標準詞失敗')
  }
}

/**
 * 获取词表地图详情点。
 *
 * @param {Omit<VocabularyItemsQuery, 'page' | 'page_size'> & {standard_words: string | string[]}} params
 * @returns {Promise<{points: VocabularyMapItemPoint[], total_entries: number, total_points: number, omitted_without_coordinates: number}>}
 */
export async function getVocabularyMapItems(params = {}) {
  try {
    return await api(buildVocabularyMapItemsPath(params))
  } catch (error) {
    console.error('Get vocabulary map items error:', error)
    showError(error.message || '獲取詞表地圖詳情失敗')
    throw new Error(error.message || '獲取詞表地圖詳情失敗')
  }
}

/**
 * 获取当前登录用户的词表权限上下文。
 *
 * 该接口是 vocabulary 前端权限 UI 的唯一来源；公开展示失败时可按无权限处理。
 *
 * @returns {Promise<{user_id: number, permission_level: 'edit' | 'manage' | null, can_upload: boolean, can_manage_entries: boolean, can_view_logs: boolean}>}
 */
export async function getVocabularyMe() {
  return api(VOCABULARY_ME_ENDPOINT)
}

/**
 * 分页获取词表权限配置。
 *
 * 该接口需要项目 admin 权限，不是 vocabulary manage 权限。
 *
 * @param {{page?: number, page_size?: number}} [params={}]
 * @returns {Promise<{permissions: Array<{user_id: number, permission_level: 'none' | 'edit' | 'manage' | null}>, total: number, page: number, page_size: number}>}
 */
export async function getVocabularyPermissions(params = {}) {
  return api(`${VOCABULARY_ADMIN_PERMISSIONS_ENDPOINT}${appendQueryParams(params)}`)
}

/**
 * 获取单个用户的词表权限配置。
 *
 * @param {number|string} userId
 * @returns {Promise<{user_id: number, permission_level: 'none' | 'edit' | 'manage' | null}>}
 */
export async function getVocabularyPermission(userId) {
  return api(`${VOCABULARY_ADMIN_PERMISSIONS_ENDPOINT}/${encodeURIComponent(userId)}`)
}

/**
 * 设置单个用户的词表权限配置。
 *
 * 后端新版本支持 none/edit/manage；none 用于撤销 vocabulary 权限。
 *
 * @param {number|string} userId
 * @param {'none' | 'edit' | 'manage'} permissionLevel
 * @returns {Promise<{user_id: number, permission_level: 'none' | 'edit' | 'manage' | null}>}
 */
export async function setVocabularyPermission(userId, permissionLevel) {
  return api(`${VOCABULARY_ADMIN_PERMISSIONS_ENDPOINT}/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: { permission_level: permissionLevel },
  })
}

/**
 * 获取词表地点筛选候选值，供卡片/地图模式的地点多选筛选使用。
 *
 * @returns {Promise<Array<{value: string, label: string, province: string, city: string}>>}
 */
export async function getVocabularyLocationOptions() {
  try {
    const response = await api(VOCABULARY_LOCATION_OPTIONS_ENDPOINT)
    const seenLocationNames = new Set()
    const locations = Array.isArray(response.locations) ? response.locations : []

    return locations.reduce((options, location) => {
      const locationName = String(location.location_name || '').trim()
      if (!locationName || seenLocationNames.has(locationName)) {
        return options
      }

      seenLocationNames.add(locationName)
      options.push({
        value: locationName,
        label: location.location_label || locationName,
        province: location.province || '',
        city: location.city || '',
      })
      return options
    }, [])
  } catch (error) {
    console.error('Get vocabulary locations error:', error)
    showError(error.message || '獲取詞表地點失敗')
    throw new Error(error.message || '獲取詞表地點失敗')
  }
}

export async function getVocabularyLocationNames() {
  const options = await getVocabularyLocationOptions()
  return options.map((option) => option.value)
}

/**
 * 获取词表地点元数据。
 *
 * @param {{user_id?: number|string, username?: string, location_name?: string, page?: number, page_size?: number}} [params={}]
 * @returns {Promise<{locations: Array<object>, total: number, page: number, page_size: number}>}
 */
export async function getVocabularyLocations(params = {}) {
  try {
    return await api(`${VOCABULARY_LOCATIONS_ENDPOINT}${appendQueryParams(params)}`)
  } catch (error) {
    console.error('Get vocabulary locations metadata error:', error)
    showError(error.message || '獲取詞表地點信息失敗')
    throw new Error(error.message || '獲取詞表地點信息失敗')
  }
}

/**
 * 更新词表地点元数据。
 *
 * @param {string} locationName
 * @param {object} data
 * @param {{user_id?: number|string}} [params={}]
 * @returns {Promise<object>}
 */
export async function getVocabularyCounts() {
  try {
    const [totalResult, locationResult] = await Promise.all([
      api(`${VOCABULARY_SQL_ENDPOINT}/query/count?table_name=${encodeURIComponent(VOCABULARY_ENTRIES_TABLE)}`),
      api(`${VOCABULARY_SQL_ENDPOINT}/query/count?table_name=${encodeURIComponent(VOCABULARY_ENTRIES_TABLE)}&distinct_column=location_name`),
    ])
    return {
      total: totalResult.count ?? 0,
      locations: locationResult.count ?? 0,
    }
  } catch (error) {
    console.error('Get vocabulary counts error:', error)
    return { total: null, locations: null }
  }
}

export async function updateVocabularyLocation(locationName, data, params = {}) {
  try {
    return await api(`${VOCABULARY_LOCATIONS_ENDPOINT}/${encodeURIComponent(locationName)}${appendQueryParams(params)}`, {
      method: 'PATCH',
      body: data,
    })
  } catch (error) {
    console.error('Update vocabulary location error:', error)
    showError(error.message || '更新詞表地點信息失敗')
    throw new Error(error.message || '更新詞表地點信息失敗')
  }
}

/**
 * 删除词表地点（级联删除该地点下所有词条）。
 *
 * @param {string} locationName
 * @param {{user_id?: number|string}} [params={}]
 * @returns {Promise<{status: string, location_name: string, deleted_entries: number}>}
 */
export async function deleteVocabularyLocation(locationName, params = {}) {
  try {
    return await api(`${VOCABULARY_LOCATIONS_ENDPOINT}/${encodeURIComponent(locationName)}${appendQueryParams(params)}`, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('Delete vocabulary location error:', error)
    showError(error.message || '刪除詞表地點失敗')
    throw new Error(error.message || '刪除詞表地點失敗')
  }
}

/**
 * 获取词表操作日志。
 *
 * @param {{user_id?: number|string, permission_level?: string, source?: string, action?: string, table_name?: string, status?: string, page?: number, page_size?: number}} [params={}]
 * @returns {Promise<{logs: Array<object>, total: number, page: number, page_size: number}>}
 */
export async function getVocabularyLogs(params = {}) {
  try {
    return await api(`${VOCABULARY_LOGS_ENDPOINT}${appendQueryParams(params)}`)
  } catch (error) {
    console.error('Get vocabulary logs error:', error)
    showError(error.message || '獲取詞表操作日誌失敗')
    throw new Error(error.message || '獲取詞表操作日誌失敗')
  }
}

/**
 * 预览词表导入结果。
 *
 * @param {{file: File, location: object, parser_mode?: 'auto' | 'table' | 'doc_whitespace' | 'doc_bracket'}} params
 * @returns {Promise<{success: boolean, location_name: string, permission_level: string, parsed_count: number, would_delete_existing_count: number, skipped_count: number, errors: string[], parser_mode: string}>}
 */
export async function previewVocabularyImport({ file, location, parser_mode = 'auto', fill_standard_from_local = false }) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('location', JSON.stringify(location))
    formData.append('parser_mode', parser_mode)
    formData.append('fill_standard_from_local', fill_standard_from_local ? 'true' : 'false')

    return await api(`${VOCABULARY_IMPORTS_ENDPOINT}/preview`, {
      method: 'POST',
      body: formData,
    })
  } catch (error) {
    console.error('Preview vocabulary import error:', error)
    showError(error.message || '預覽詞表導入失敗')
    throw new Error(error.message || '預覽詞表導入失敗')
  }
}

/**
 * 上传词表文件。
 *
 * @param {{file: File, location: object, parser_mode?: 'auto' | 'table' | 'doc_whitespace' | 'doc_bracket', overwrite?: boolean}} params
 * @returns {Promise<{success: boolean, location_id: number, location_name: string, permission_level: string, imported_count: number, deleted_existing_count: number, skipped_count: number, errors: string[], parser_mode: string}>}
 */
export async function uploadVocabulary({ file, location, parser_mode = 'auto', overwrite = false, fill_standard_from_local = false }) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('location', JSON.stringify(location))
    formData.append('parser_mode', parser_mode)
    formData.append('overwrite', overwrite ? 'true' : 'false')
    formData.append('fill_standard_from_local', fill_standard_from_local ? 'true' : 'false')

    return await api(VOCABULARY_IMPORTS_ENDPOINT, {
      method: 'POST',
      body: formData,
    })
  } catch (error) {
    console.error('Upload vocabulary error:', error)
    showError(error.message || '上傳詞表失敗')
    throw new Error(error.message || '上傳詞表失敗')
  }
}

/**
 * 词表表格模式专属 API adapter。
 *
 * 后端固定操作 vocabulary.db，/api/vocabulary/sql/* 不接受 db_key。
 * 该 adapter 供 UniversalTable 复用表格能力，同时把旧通用 SQL payload 中的 db_key 剥离。
 */
export const vocabularySqlApi = {
  async query(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/query`, {
      method: 'POST',
      body: stripAndValidateVocabularySqlParams(params),
    })
  },

  async distinct(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/distinct-query`, {
      method: 'POST',
      body: stripAndValidateVocabularySqlParams(params),
    })
  },

  async columns(params = {}) {
    const body = stripAndValidateVocabularySqlParams(params)
    return api(`${VOCABULARY_SQL_ENDPOINT}/query/columns${appendQueryParams({ table_name: body.table_name })}`)
  },

  async count(params = {}) {
    const body = stripAndValidateVocabularySqlParams(params)
    return api(`${VOCABULARY_SQL_ENDPOINT}/query/count${appendQueryParams({
      table_name: body.table_name,
      filter_column: body.filter_column,
      filter_value: body.filter_value,
    })}`)
  },

  async distinctDirect(params = {}) {
    const body = stripAndValidateVocabularySqlParams(params)
    return api(`${VOCABULARY_SQL_ENDPOINT}/distinct/${encodeURIComponent(body.table_name)}/${encodeURIComponent(body.column)}`)
  },

  async mutateSingle(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/mutate`, {
      method: 'POST',
      body: stripAndValidateVocabularySqlParams(params),
    })
  },

  async batchMutate(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/batch-mutate`, {
      method: 'POST',
      body: stripAndValidateVocabularySqlParams(params),
    })
  },

  async batchReplacePreview(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/batch-replace-preview`, {
      method: 'POST',
      body: stripVocabularyBatchReplaceParams(params),
    })
  },

  async batchReplaceExecute(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/batch-replace-execute`, {
      method: 'POST',
      body: stripVocabularyBatchReplaceParams(params),
    })
  },
}
