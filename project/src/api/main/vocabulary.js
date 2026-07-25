// api/main/vocabulary.js - 词表业务接口
import { api } from '../auth/httpClient.js'
import { showError } from '@/utils/ui/message.js'

const VOCABULARY_ITEMS_ENDPOINT = '/api/vocabulary/items'
const VOCABULARY_SQL_ENDPOINT = '/api/vocabulary/sql'

function stripVocabularyDbKey(params = {}) {
  const { db_key: _dbKey, ...rest } = params
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

/**
 * @typedef {'all' | 'definition' | 'headword' | 'pronunciation' | 'detail' | 'location'} VocabularySearchField
 */

/**
 * @typedef {object} VocabularyItemsQuery
 * @property {string} [q] 模糊搜索内容。未传 search_fields 时，后端默认只搜 definition、headword、pronunciation、detail，不搜 location。
 * @property {VocabularySearchField | VocabularySearchField[]} [search_fields] 指定 q 搜索字段；如需用 q 搜地点，需要显式传 location。
 * @property {string | string[]} [locations] 独立地点筛选，多个地点之间为 OR；该筛选与 q 内容匹配是 AND 关系。
 * @property {number} [page=1] 卡片/地图模式结果页码；后端默认 1。
 * @property {number} [page_size=50] 卡片/地图模式每页数量；后端默认 50，最大 200。
 */

/**
 * @typedef {object} VocabularyItem
 * @property {string} id 词条 ID。
 * @property {string} definition 标准书面语释义。
 * @property {string} headword 当地方言写法。
 * @property {string} pronunciation IPA 或其他注音格式。
 * @property {string} pronunciation_type 注音类型，例如 IPA。
 * @property {string} detail 详情或注释。
 * @property {string} location 完整地点链。
 * @property {string} location_name 地点简称。
 * @property {number | null} longitude 经度；地图模式需要容忍空值。
 * @property {number | null} latitude 纬度；地图模式需要容忍空值。
 */

/**
 * @typedef {object} VocabularyItemsResponse
 * @property {VocabularyItem[]} items 卡片/地图模式词条结果。
 * @property {number} total 后端匹配总数。
 * @property {number} page 当前页码。
 * @property {number} page_size 当前页大小。
 */

/**
 * 构造词表卡片/地图模式查询路径。
 *
 * 该接口只服务卡片模式和地图模式；表格模式继续走表格专属 API。
 * 注意：不传 search_fields 时，后端默认搜索内容字段，不会把 location 纳入 q 搜索。
 *
 * @param {VocabularyItemsQuery} [params={}]
 * @returns {string}
 */
export function buildVocabularyItemsPath(params = {}) {
  const query = new URLSearchParams()
  appendScalarIfPresent(query, 'q', params.q)
  appendListIfPresent(query, 'search_fields', params.search_fields)
  appendListIfPresent(query, 'locations', params.locations)
  appendScalarIfPresent(query, 'page', params.page)
  appendScalarIfPresent(query, 'page_size', params.page_size)

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return `${VOCABULARY_ITEMS_ENDPOINT}${suffix}`
}

/**
 * 获取词表卡片/地图模式结果。
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
 * 上传词表文件。
 *
 * @param {{file: File, location: object, parser_mode?: 'auto' | 'table' | 'doc_whitespace' | 'doc_bracket'}} params
 * @returns {Promise<{success: boolean, location_id: number, location_name: string, permission_level: string, imported_count: number, deleted_existing_count: number, skipped_count: number, errors: string[], parser_mode: string}>}
 */
export async function uploadVocabulary({ file, location, parser_mode = 'auto' }) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('location', JSON.stringify(location))
    formData.append('parser_mode', parser_mode)

    return await api('/api/vocabulary/upload', {
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
  query(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/query`, {
      method: 'POST',
      body: stripVocabularyDbKey(params),
    })
  },

  distinct(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/distinct-query`, {
      method: 'POST',
      body: stripVocabularyDbKey(params),
    })
  },

  mutateSingle(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/mutate`, {
      method: 'POST',
      body: stripVocabularyDbKey(params),
    })
  },

  batchMutate(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/batch-mutate`, {
      method: 'POST',
      body: stripVocabularyDbKey(params),
    })
  },

  batchReplacePreview(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/batch-replace-preview`, {
      method: 'POST',
      body: stripVocabularyDbKey(params),
    })
  },

  batchReplaceExecute(params) {
    return api(`${VOCABULARY_SQL_ENDPOINT}/batch-replace-execute`, {
      method: 'POST',
      body: stripVocabularyDbKey(params),
    })
  },
}
