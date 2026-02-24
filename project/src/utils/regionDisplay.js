/**
 * 區域顯示工具函數
 * 用於處理層級區域信息的顯示
 */

/**
 * 構建層級路徑字符串
 * @param {Object} item - 包含區域信息的對象
 * @param {string} item.city - 城市
 * @param {string} item.county - 區縣
 * @param {string} item.township - 鄉鎮
 * @param {string} item.region_name - 區域名稱（向後兼容）
 * @param {Object} options - 選項
 * @param {string} options.separator - 分隔符（默認 ' > '）
 * @param {boolean} options.skipCity - 是否跳過市級（默認 true）
 * @returns {string} 層級路徑字符串
 */
export function buildRegionPath(item, options = {}) {
  if (!item) return ''

  const { separator = ' > ', skipCity = true } = options

  // 如果有完整的層級信息，構建路徑
  const parts = []
  if (item.city && !skipCity) parts.push(item.city)
  if (item.county) parts.push(item.county)
  if (item.township) parts.push(item.township)

  // 如果有層級信息，返回完整路徑
  if (parts.length > 0) {
    return parts.join(separator)
  }

  // 向後兼容：如果沒有層級信息，返回 region_name
  return item.region_name || ''
}

/**
 * 獲取區域簡稱（最後一級）
 * @param {Object} item - 包含區域信息的對象
 * @returns {string} 區域簡稱
 */
export function getRegionShortName(item) {
  if (!item) return ''
  return item.township || item.county || item.city || item.region_name || ''
}

/**
 * 檢查是否有完整的層級信息
 * @param {Object} item - 包含區域信息的對象
 * @returns {boolean} 是否有層級信息
 */
export function hasHierarchyInfo(item) {
  return !!(item?.city || item?.county || item?.township)
}

/**
 * 格式化區域顯示（智能模式）
 * 如果有層級信息顯示完整路徑，否則顯示 region_name
 * @param {Object} item - 包含區域信息的對象
 * @param {Object} options - 選項
 * @param {boolean} options.showFull - 是否總是顯示完整路徑（默認 true）
 * @param {string} options.separator - 分隔符
 * @param {boolean} options.skipCity - 是否跳過市級（默認 true）
 * @returns {string} 格式化後的區域字符串
 */
export function formatRegionDisplay(item, options = {}) {
  const { showFull = true, separator = ' > ', skipCity = true } = options

  if (!item) return ''

  if (hasHierarchyInfo(item)) {
    return showFull ? buildRegionPath(item, { separator, skipCity }) : getRegionShortName(item)
  }

  return item.region_name || ''
}
