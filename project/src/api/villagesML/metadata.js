// api/villagesML/metadata.js
// 系統元數據相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取數據庫概覽統計
 * @returns {Promise<Object>} {
 *   total_villages: number,
 *   total_cities: number,
 *   total_counties: number,
 *   total_townships: number,
 *   total_characters: number,
 *   total_ngrams: number,
 *   database_size_mb: number,
 *   last_updated: string
 * }
 */
export async function getMetadataOverview() {
  return api('/api/villages/metadata/stats/overview')
}

/**
 * 獲取數據表統計信息
 * @returns {Promise<Array>} [{
 *   table_name: string,
 *   row_count: number,
 *   size_mb: number,
 *   description: string
 * }, ...]
 */
export async function getMetadataTables() {
  return api('/api/villages/metadata/stats/tables')
}

/**
 * 獲取 N-gram 顯著性統計
 * @returns {Promise<Object>} {
 *   ngram_significance: {
 *     total: number,
 *     significant: number,
 *     not_significant: number,
 *     significance_rate: number
 *   },
 *   by_level: {
 *     city: { total, significant, rate },
 *     county: { total, significant, rate },
 *     township: { total, significant, rate }
 *   }
 * }
 */
export async function getNgramStatistics() {
  return api('/api/villages/statistics/ngrams')
}

/**
 * 獲取數據庫整體統計
 * @returns {Promise<Object>}
 */
export async function getDatabaseStatistics() {
  return api('/api/villages/statistics/database')
}
