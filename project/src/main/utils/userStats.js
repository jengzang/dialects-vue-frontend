/**
 * Compute query statistics from user data
 * @param {Object} user - User object with usage_summary
 * @returns {Object} Statistics breakdown
 */
export function computeQueryStats(user) {
  if (!user || !user.usage_summary) {
    return {
      total: 0,
      categories: []
    }
  }

  const stats = user.usage_summary || []

  // Define category structure
  const categoryMap = {
    '音韻查詢': {
      icon: '🔍',
      paths: {
        '/api/ZhongGu': '查中古',
        '/api/YinWei': '查音位',
        '/api/phonology': '查地位',
        '/api/feature_stats': '查音節'
      }
    },
    '字調查詢': {
      icon: '📝',
      paths: {
        '/api/search_chars/': '查字',
        '/api/search_tones/': '查調'
      }
    },
    '音系分析': {
      icon: '📊',
      paths: {
        '/api/phonology_matrix': '查音系',
        '/api/phonology_classification_matrix': '查音素',
        '/api/feature_counts': '音節統計'
      }
    },
    '工具使用': {
      icon: '🛠️',
      paths: {
        '/api/tools/check/analyze': '字表檢查',
        '/api/tools/jyut2ipa/upload': '粵拼轉換',
        '/api/tools/merge/execute': '合併字表',
        '/api/tools/praat/jobs': '聲學分析'
      }
    }
  }

  let total = 0
  const categoryCounts = {}

  // Initialize category counts
  Object.keys(categoryMap).forEach(categoryName => {
    categoryCounts[categoryName] = {}
  })

  // Count each API call
  stats.forEach(stat => {
    // Find which category this path belongs to
    for (const [categoryName, categoryData] of Object.entries(categoryMap)) {
      if (categoryData.paths[stat.path]) {
        const label = categoryData.paths[stat.path]
        total += stat.count

        if (categoryCounts[categoryName][label]) {
          categoryCounts[categoryName][label] += stat.count
        } else {
          categoryCounts[categoryName][label] = stat.count
        }
        break
      }
    }
  })

  // Build category data structure
  const categories = Object.entries(categoryMap).map(([categoryName, categoryData]) => {
    const items = Object.entries(categoryCounts[categoryName]).map(([label, count]) => ({
      label,
      count
    }))

    const categoryTotal = items.reduce((sum, item) => sum + item.count, 0)

    return {
      name: categoryName,
      icon: categoryData.icon,
      total: categoryTotal,
      items
    }
  }).filter(category => category.total > 0) // Only show categories with data

  return {
    total,
    categories
  }
}

/**
 * Format online time (seconds to readable string)
 * @param {number} seconds - Online time in seconds
 * @returns {string} Formatted time string
 */
export function formatOnlineTime(seconds) {
  if (!seconds || isNaN(seconds)) return '-'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours} 小時 ${minutes} 分鐘`
  }
  return `${minutes} 分鐘 ${secs} 秒`
}

/**
 * Format date to localized string
 * @param {string|Date} isoStr - Date to format
 * @returns {string} Formatted date string
 */
export function fmt(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleString('zh-Hant-CN', { hour12: false })
}

