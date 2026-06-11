// api/query/phoPie.js
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/message.js'
import {
  DEFAULT_CHARACTER_TABLE,
  VALID_CHARACTER_TABLES,
  getCharacterTableHierarchy,
  isValidCharacterTable
} from '@/main/config'

/**
 * @typedef {'characters'|'fenyun'|'hongwu'|'menggu'|'old_chinese'|'zhongyuan'} PhoPieTableName
 */

function createValidationError(message, status = 422) {
  const error = new Error(message)
  error.status = status
  return error
}

function normalizePhoPiePayload(payload) {
  const rawTableName = typeof payload?.table_name === 'string'
    ? payload.table_name.trim()
    : ''
  const tableName = rawTableName || DEFAULT_CHARACTER_TABLE
  const locations = Array.isArray(payload?.locations)
    ? payload.locations.map(item => String(item).trim()).filter(Boolean)
    : []
  const level1Column = typeof payload?.level1_column === 'string' ? payload.level1_column.trim() : ''
  const level2Column = typeof payload?.level2_column === 'string' ? payload.level2_column.trim() : ''

  if (locations.length === 0) {
    throw createValidationError('locations 至少需要 1 個有效地點')
  }
  if (!level1Column) {
    throw createValidationError('level1_column 不能為空')
  }
  if (!level2Column) {
    throw createValidationError('level2_column 不能為空')
  }
  if (level1Column === level2Column) {
    throw createValidationError('level1_column 與 level2_column 不能相同')
  }
  if (!isValidCharacterTable(tableName)) {
    throw createValidationError(
      `table_name 不合法，需為 ${VALID_CHARACTER_TABLES.join(', ')}`,
      400
    )
  }

  const hierarchy = getCharacterTableHierarchy(tableName)
  if (!hierarchy.includes(level1Column)) {
    throw createValidationError(`level1_column 不在 ${tableName} 的可查詢欄位內`)
  }
  if (!hierarchy.includes(level2Column)) {
    throw createValidationError(`level2_column 不在 ${tableName} 的可查詢欄位內`)
  }

  return {
    locations,
    level1_column: level1Column,
    level2_column: level2Column,
    table_name: tableName
  }
}

export async function postPhoPieByValue(payload) {
  try {
    const body = normalizePhoPiePayload(payload)
    return await api('/api/pho_pie_by_value', {
      method: 'POST',
      body,
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Post pho pie by value error:', error)
    showError(error.message || '語音分佈圖資料請求失敗')
    throw error
  }
}

export async function postPhoPieByStatus(payload) {
  try {
    const body = normalizePhoPiePayload(payload)
    return await api('/api/pho_pie_by_status', {
      method: 'POST',
      body,
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Post pho pie by status error:', error)
    showError(error.message || '語音地位分佈資料請求失敗')
    throw error
  }
}
