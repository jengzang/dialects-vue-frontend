/**
 * 文白讀 / 多音字 統計的共享轉換與着色標籤解析。
 *
 * 從 PhonologyPage.vue 與 PhonologyTable.vue 抽出的純函數，供：
 * - PhonologyPage（cellDetails）
 * - PhonologyTable（現有矩陣着色）
 * - HomophoneLexicon（同音字匯）
 * 復用，避免三處各寫一套。
 */

const readingPriorityLabels = ['文白讀', '文讀', '白讀', '多音字']

export function transformMatrixReadStats(matrixReadStats = {}) {
  const transformedCellDetails = {}

  Object.entries(matrixReadStats || {}).forEach(([initial, finalMap]) => {
    transformedCellDetails[initial] = {}

    Object.entries(finalMap || {}).forEach(([final, toneMap]) => {
      transformedCellDetails[initial][final] = {}

      Object.entries(toneMap || {}).forEach(([tone, readStats]) => {
        const polyphonicDetails = readStats?.polyphonic?.details || {}

        const items = [
          ['polyphonic', '多音字'],
          ['wendu', '文讀'],
          ['baidu', '白讀'],
          ['wenbai', '文白讀']
        ]
          .map(([key, label]) => {
            const bucket = readStats?.[key]
            const item = {
              label,
              count: Number(bucket?.count || 0),
              chars: Array.isArray(bucket?.chars) ? bucket.chars : []
            }

            if (key === 'polyphonic') {
              const detailEntries = Object.entries(polyphonicDetails).map(([char, values]) => ({
                char,
                values: Array.isArray(values) ? values : []
              }))

              if (detailEntries.length > 0) {
                item.details = detailEntries
              }
            }

            return item
          })
          .filter((item) => item.count > 0 || item.chars.length > 0 || item.details?.length > 0)

        if (items.length > 0) {
          transformedCellDetails[initial][final][tone] = items
        }
      })
    })
  })

  return transformedCellDetails
}

/**
 * 給定某個 (initial, final, tone) 的 cellDetails，返回「字符 → 文白讀/多音字標籤」映射。
 * 優先級：文白讀 > 文讀 > 白讀 > 多音字。
 */
export function resolveCharReadingLabel(cellDetails, initial, final, tone) {
  const detailItems = cellDetails?.[initial]?.[final]?.[tone] || []
  const labelMap = new Map()

  if (!Array.isArray(detailItems) || detailItems.length === 0) {
    return labelMap
  }

  detailItems.forEach((item) => {
    const label = item?.label
    if (!label || !Array.isArray(item?.chars)) return

    item.chars.forEach((char) => {
      const currentLabel = labelMap.get(char)
      const currentPriority = currentLabel ? readingPriorityLabels.indexOf(currentLabel) : Infinity
      const nextPriority = readingPriorityLabels.indexOf(label)

      if (nextPriority !== -1 && nextPriority < currentPriority) {
        labelMap.set(char, label)
      }
    })
  })

  return labelMap
}
