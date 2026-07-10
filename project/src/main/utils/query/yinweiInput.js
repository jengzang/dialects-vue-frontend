export function aggregateFeatureCountsByType(data = {}) {
  const aggregated = {}

  Object.entries(data || {}).forEach(([locationName, locationData]) => {
    if (!locationData || typeof locationData !== 'object') {
      return
    }

    Object.entries(locationData).forEach(([featureType, features]) => {
      if (!features || typeof features !== 'object') {
        return
      }

      if (!aggregated[featureType]) {
        aggregated[featureType] = {}
      }

      Object.entries(features).forEach(([syllable, count]) => {
        if (!aggregated[featureType][syllable]) {
          aggregated[featureType][syllable] = {
            totalCount: 0,
            locationCount: 0,
            locations: []
          }
        }

        aggregated[featureType][syllable].totalCount += Number(count) || 0
        aggregated[featureType][syllable].locationCount += 1
        aggregated[featureType][syllable].locations.push(locationName)
      })
    })
  })

  return aggregated
}

export function getFeatureSuggestionsByCard(data = {}, card = '') {
  const aggregated = aggregateFeatureCountsByType(data)
  const featureBucket = aggregated[card]

  if (!featureBucket || typeof featureBucket !== 'object') {
    return []
  }

  return Object.entries(featureBucket)
    .sort(([, leftStats], [, rightStats]) => {
      if ((rightStats?.totalCount || 0) !== (leftStats?.totalCount || 0)) {
        return (rightStats?.totalCount || 0) - (leftStats?.totalCount || 0)
      }
      return 0
    })
    .map(([syllable]) => syllable)
}

export function normalizeYinweiTokens(rawInput = '', validSuggestions = [], maxCount = 3) {
  const validSet = new Set(validSuggestions)
  const tokens = String(rawInput)
    .split(/[\s,;，；、\n\t]+/)
    .map(item => item.trim())
    .filter(Boolean)

  const legalTokens = []
  const legalSet = new Set()
  let ignoredLegalTokenCount = 0

  tokens.forEach((token) => {
    if (!validSet.has(token) || legalSet.has(token)) {
      return
    }

    if (legalTokens.length >= maxCount) {
      ignoredLegalTokenCount += 1
      return
    }

    legalTokens.push(token)
    legalSet.add(token)
  })

  return {
    legalTokens,
    normalizedInput: legalTokens.join(' '),
    ignoredLegalTokenCount,
    exceededLimit: ignoredLegalTokenCount > 0
  }
}

export function filterYinweiSuggestions(query = '', suggestions = [], selectedTokens = [], suggestionStats = {}) {
  const trimmedQuery = String(query).trim()
  const selectedSet = new Set(selectedTokens)

  const filtered = suggestions.filter((item) => {
    if (selectedSet.has(item) && item !== trimmedQuery) {
      return false
    }

    if (!trimmedQuery) {
      return true
    }

    return item.includes(trimmedQuery)
  })

  const rankByTotalCountDesc = (items) => {
    return [...items].sort((left, right) => {
      const rightCount = suggestionStats[right]?.totalCount || 0
      const leftCount = suggestionStats[left]?.totalCount || 0

      if (rightCount !== leftCount) {
        return rightCount - leftCount
      }

      return left.localeCompare(right)
    })
  }

  if (!trimmedQuery) {
    return rankByTotalCountDesc(filtered)
  }

  const exactMatches = []
  const prefixMatches = []
  const containsMatches = []

  filtered.forEach((item) => {
    if (item === trimmedQuery) {
      exactMatches.push(item)
    } else if (item.startsWith(trimmedQuery)) {
      prefixMatches.push(item)
    } else {
      containsMatches.push(item)
    }
  })

  return [
    ...rankByTotalCountDesc(exactMatches),
    ...rankByTotalCountDesc(prefixMatches),
    ...rankByTotalCountDesc(containsMatches)
  ]
}
